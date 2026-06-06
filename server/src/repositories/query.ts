import type { CourseStatus, Enrollment, PaymentStatus, Role } from '../types/models.js';
import type { QuizAnswerInput } from './quizRepository.js';

export const analyticsQueries = {
  getDashboardAnalytics: () => ({
    text: `WITH student_counts AS (
       SELECT COUNT(*)::integer AS total_students
       FROM users
       WHERE role = $1
     ),
     enrollment_counts AS (
       SELECT
         COUNT(*) FILTER (WHERE status = $2)::integer AS active_enrollments,
         COUNT(*) FILTER (WHERE status = $3)::numeric / NULLIF(COUNT(*), 0) * 100 AS completion_rate
       FROM enrollments
     ),
     revenue AS (
       SELECT COALESCE(SUM(amount_cents), 0)::integer AS revenue_cents
       FROM payments
       WHERE status = $4
     ),
     quiz_scores AS (
       SELECT COALESCE(AVG(score), 0)::numeric(5,2) AS average_quiz_score
       FROM quiz_submissions
     )
     SELECT
       sc.total_students,
       ec.active_enrollments,
       r.revenue_cents,
       qs.average_quiz_score,
       COALESCE(ec.completion_rate, 0)::numeric(5,2) AS completion_rate
     FROM student_counts sc
     CROSS JOIN enrollment_counts ec
     CROSS JOIN revenue r
     CROSS JOIN quiz_scores qs`,
    values: ['student', 'active', 'completed', 'paid'],
  }),
  getCoursePerformanceReport: (input: { from: string; to: string }) => ({
    text: `WITH course_enrollments AS (
       SELECT course_id, COUNT(*)::integer AS enrollments
       FROM enrollments
       WHERE enrolled_at >= $1 AND enrolled_at < $2
       GROUP BY course_id
     ),
     course_revenue AS (
       SELECT course_id, COALESCE(SUM(amount_cents), 0)::integer AS revenue_cents
       FROM payments
       WHERE status = $3 AND created_at >= $1 AND created_at < $2
       GROUP BY course_id
     ),
     quiz_scores AS (
       SELECT q.course_id, COALESCE(AVG(qs.score), 0)::numeric(5,2) AS average_quiz_score
       FROM quizzes q
       JOIN quiz_submissions qs ON qs.quiz_id = q.id
       WHERE qs.submitted_at >= $1 AND qs.submitted_at < $2
       GROUP BY q.course_id
     ),
     assignment_grades AS (
       SELECT a.course_id, COUNT(*)::integer AS graded_assignments
       FROM assignments a
       JOIN assignment_submissions s ON s.assignment_id = a.id
       WHERE s.graded_at >= $1 AND s.graded_at < $2
       GROUP BY a.course_id
     )
     SELECT
       c.id AS course_id,
       c.title,
       COALESCE(ce.enrollments, 0) AS enrollments,
       COALESCE(cr.revenue_cents, 0) AS revenue_cents,
       COALESCE(qs.average_quiz_score, 0) AS average_quiz_score,
       COALESCE(ag.graded_assignments, 0) AS graded_assignments
     FROM courses c
     LEFT JOIN course_enrollments ce ON ce.course_id = c.id
     LEFT JOIN course_revenue cr ON cr.course_id = c.id
     LEFT JOIN quiz_scores qs ON qs.course_id = c.id
     LEFT JOIN assignment_grades ag ON ag.course_id = c.id
     ORDER BY revenue_cents DESC, enrollments DESC`,
    values: [input.from, input.to, 'paid'],
  }),
};

export const assignmentQueries = {
  submitAssignment: (input: { assignmentId: string; userId: string; content: string }) => ({
    text: `INSERT INTO assignment_submissions (assignment_id, user_id, content)
     VALUES ($1, $2, $3)
     ON CONFLICT (assignment_id, user_id)
     DO UPDATE SET content = $3, submitted_at = now(), grade_points = NULL, feedback = NULL, graded_by = NULL, graded_at = NULL
     RETURNING id, assignment_id, user_id, content, grade_points, feedback, graded_by, submitted_at, graded_at`,
    values: [input.assignmentId, input.userId, input.content],
  }),
  gradeAssignment: (input: { submissionId: string; gradePoints: number; feedback: string | null; gradedBy: string }) => ({
    text: `UPDATE assignment_submissions
     SET grade_points = $2,
         feedback = $3,
         graded_by = $4,
         graded_at = now()
     WHERE id = $1
     RETURNING id, assignment_id, user_id, content, grade_points, feedback, graded_by, submitted_at, graded_at`,
    values: [input.submissionId, input.gradePoints, input.feedback, input.gradedBy],
  }),
};

export const courseQueries = {
  listCourses: (input: { limit: number; offset: number; status?: CourseStatus }) => ({
    text: `SELECT id, instructor_id, title, description, price_cents, status, created_at, updated_at
     FROM courses
     WHERE ($1::text IS NULL OR status = $1)
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    values: [input.status ?? null, input.limit, input.offset],
  }),
  findCourseById: (id: string) => ({
    text: `SELECT id, instructor_id, title, description, price_cents, status, created_at, updated_at
     FROM courses
     WHERE id = $1`,
    values: [id],
  }),
  createCourse: (input: {
    instructorId: string;
    title: string;
    description: string;
    priceCents: number;
    status: CourseStatus;
  }) => ({
    text: `INSERT INTO courses (instructor_id, title, description, price_cents, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, instructor_id, title, description, price_cents, status, created_at, updated_at`,
    values: [input.instructorId, input.title, input.description, input.priceCents, input.status],
  }),
  updateCourse: (
    id: string,
    input: Partial<{
      title: string;
      description: string;
      priceCents: number;
      status: CourseStatus;
    }>,
  ) => ({
    text: `UPDATE courses
     SET title = COALESCE($2, title),
         description = COALESCE($3, description),
         price_cents = COALESCE($4, price_cents),
         status = COALESCE($5, status),
         updated_at = now()
     WHERE id = $1
     RETURNING id, instructor_id, title, description, price_cents, status, created_at, updated_at`,
    values: [id, input.title ?? null, input.description ?? null, input.priceCents ?? null, input.status ?? null],
  }),
  deleteCourse: (id: string) => ({
    text: `DELETE FROM courses
     WHERE id = $1`,
    values: [id],
  }),
};

export const enrollmentQueries = {
  createEnrollment: (input: { userId: string; courseId: string }) => ({
    text: `INSERT INTO enrollments (user_id, course_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, course_id)
     DO UPDATE SET status = 'active'
     RETURNING id, user_id, course_id, status, progress_percent, enrolled_at, completed_at`,
    values: [input.userId, input.courseId],
  }),
  listUserEnrollments: (userId: string) => ({
    text: `SELECT id, user_id, course_id, status, progress_percent, enrolled_at, completed_at
     FROM enrollments
     WHERE user_id = $1
     ORDER BY enrolled_at DESC`,
    values: [userId],
  }),
  findEnrollmentById: (id: string) => ({
    text: `SELECT id, user_id, course_id, status, progress_percent, enrolled_at, completed_at
     FROM enrollments
     WHERE id = $1`,
    values: [id],
  }),
};

export const paymentQueries = {
  createPayment: (input: {
    enrollmentId: string;
    userId: string;
    courseId: string;
    amountCents: number;
    provider: string;
    providerReference: string;
    status: PaymentStatus;
  }) => ({
    text: `INSERT INTO payments (
       enrollment_id, user_id, course_id, amount_cents, provider, provider_reference, status, paid_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $7 = 'paid' THEN now() ELSE NULL END)
     RETURNING id, enrollment_id, user_id, course_id, amount_cents, provider, provider_reference, status, paid_at, created_at`,
    values: [
      input.enrollmentId,
      input.userId,
      input.courseId,
      input.amountCents,
      input.provider,
      input.providerReference,
      input.status,
    ],
  }),
};

export const quizQueries = {
  scoreQuizAnswers: (quizId: string, answers: QuizAnswerInput[]) => ({
    text: `WITH submitted_answers AS (
       SELECT *
       FROM jsonb_to_recordset($2::jsonb)
       AS answer(question_id uuid, selected_option_id uuid)
     ),
     graded AS (
       SELECT
         q.id AS question_id,
         q.points,
         z.passing_score,
         sa.selected_option_id,
         qo.is_correct
       FROM submitted_answers sa
       JOIN quiz_questions q ON q.id = sa.question_id
       JOIN quizzes z ON z.id = q.quiz_id
       JOIN quiz_options qo ON qo.id = sa.selected_option_id AND qo.question_id = q.id
       WHERE z.id = $1
     )
     SELECT question_id, points, passing_score, selected_option_id, is_correct
     FROM graded`,
    values: [quizId, JSON.stringify(answers)],
  }),
  createQuizSubmission: (input: { quizId: string; userId: string; score: number; passed: boolean }) => ({
    text: `INSERT INTO quiz_submissions (quiz_id, user_id, score, passed)
     VALUES ($1, $2, $3, $4)
     RETURNING id, quiz_id, user_id, score, passed, submitted_at`,
    values: [input.quizId, input.userId, input.score, input.passed],
  }),
  createQuizAnswers: (
    submissionId: string,
    answers: Array<QuizAnswerInput & { isCorrect: boolean; pointsAwarded: number }>,
  ) => ({
    text: `INSERT INTO quiz_answers (
       submission_id, question_id, selected_option_id, is_correct, points_awarded
     )
     SELECT $1, question_id, selected_option_id, is_correct, points_awarded
     FROM jsonb_to_recordset($2::jsonb)
     AS answer(question_id uuid, selected_option_id uuid, is_correct boolean, points_awarded integer)`,
    values: [submissionId, JSON.stringify(answers)],
  }),
};

export const userQueries = {
  createUser: (input: { email: string; passwordHash: string; fullName: string; role: Role }) => ({
    text: `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, password_hash, full_name, role, created_at, updated_at`,
    values: [input.email, input.passwordHash, input.fullName, input.role],
  }),
  findUserByEmail: (email: string) => ({
    text: `SELECT id, email, password_hash, full_name, role, created_at, updated_at
     FROM users
     WHERE email = $1`,
    values: [email],
  }),
  findUserById: (id: string) => ({
    text: `SELECT id, email, password_hash, full_name, role, created_at, updated_at
     FROM users
     WHERE id = $1`,
    values: [id],
  }),
};
