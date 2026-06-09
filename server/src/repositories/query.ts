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
  getCohortReport: (input: { from: string; to: string }) => ({
    text: `WITH enrollment_base AS (
       SELECT
         e.id AS enrollment_id,
         e.user_id,
         e.course_id,
         e.status,
         e.enrolled_at,
         date_trunc('month', e.enrolled_at)::date AS cohort_month
       FROM enrollments e
       WHERE e.enrolled_at >= $1 AND e.enrolled_at < $2
     ),
     paid_users AS (
       SELECT DISTINCT user_id, course_id
       FROM payments
       WHERE status = $3
     ),
     quiz_scores AS (
       SELECT
         qs.user_id,
         q.course_id,
         AVG(qs.score)::numeric(5,2) AS average_quiz_score
       FROM quiz_submissions qs
       JOIN quizzes q ON q.id = qs.quiz_id
       GROUP BY qs.user_id, q.course_id
     )
     SELECT
       eb.cohort_month,
       COUNT(DISTINCT eb.user_id)::integer AS students,
       COUNT(*)::integer AS enrollments,
       COUNT(DISTINCT eb.user_id) FILTER (WHERE pu.user_id IS NOT NULL)::integer AS paid_students,
       COALESCE(SUM(p.amount_cents) FILTER (WHERE p.status = $3), 0)::integer AS revenue_cents,
       COUNT(*) FILTER (WHERE eb.status = $4)::integer AS completed_enrollments,
       COALESCE(
         COUNT(*) FILTER (WHERE eb.status = $4)::numeric / NULLIF(COUNT(*), 0) * 100,
         0
       )::numeric(5,2) AS completion_rate,
       COALESCE(AVG(qs.average_quiz_score), 0)::numeric(5,2) AS average_quiz_score
     FROM enrollment_base eb
     LEFT JOIN paid_users pu
       ON pu.user_id = eb.user_id AND pu.course_id = eb.course_id
     LEFT JOIN payments p
       ON p.user_id = eb.user_id AND p.course_id = eb.course_id
     LEFT JOIN quiz_scores qs
       ON qs.user_id = eb.user_id AND qs.course_id = eb.course_id
     GROUP BY eb.cohort_month
     ORDER BY eb.cohort_month DESC`,
    values: [input.from, input.to, 'paid', 'completed'],
  }),
};

export const assignmentQueries = {
  listStudentAssignments: (userId: string) => ({
    text: `SELECT
       a.id,
       a.course_id,
       c.title AS course_title,
       a.title,
       a.instructions,
       a.max_points,
       a.due_at,
       s.id AS submission_id,
       s.assignment_id,
       s.user_id,
       s.content,
       s.grade_points,
       s.feedback,
       s.graded_by,
       s.submitted_at,
       s.graded_at
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     JOIN assignments a ON a.course_id = c.id
     LEFT JOIN assignment_submissions s
       ON s.assignment_id = a.id AND s.user_id = e.user_id
     WHERE e.user_id = $1 AND e.status = $2
     ORDER BY COALESCE(a.due_at, a.created_at), a.created_at DESC`,
    values: [userId, 'active'],
  }),
  listSubmissionsForGrading: (input: { userId: string; role: Role }) => ({
    text: `SELECT
       s.id,
       s.assignment_id,
       s.user_id,
       s.content,
       s.grade_points,
       s.feedback,
       s.graded_by,
       s.submitted_at,
       s.graded_at,
       a.title AS assignment_title,
       a.course_id,
       c.title AS course_title,
       a.max_points,
       u.full_name AS student_name,
       u.email AS student_email
     FROM assignment_submissions s
     JOIN assignments a ON a.id = s.assignment_id
     JOIN courses c ON c.id = a.course_id
     JOIN users u ON u.id = s.user_id
     WHERE ($2 = $3 OR c.instructor_id = $1)
     ORDER BY s.graded_at NULLS FIRST, s.submitted_at DESC`,
    values: [input.userId, input.role, 'admin'],
  }),
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
  createVideoLesson: (input: {
    courseId: string;
    moduleTitle: string;
    title: string;
    summary: string;
    videoUrl: string;
    durationSeconds: number;
  }) => ({
    text: `WITH existing_module AS (
       SELECT id, title
       FROM modules
       WHERE course_id = $1 AND lower(title) = lower($2)
       ORDER BY sort_order
       LIMIT 1
     ),
     module_sort AS (
       SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort
       FROM modules
       WHERE course_id = $1
     ),
     created_module AS (
       INSERT INTO modules (course_id, title, sort_order)
       SELECT $1, $2, next_sort
       FROM module_sort
       WHERE NOT EXISTS (SELECT 1 FROM existing_module)
       RETURNING id, title
     ),
     selected_module AS (
       SELECT id, title FROM existing_module
       UNION ALL
       SELECT id, title FROM created_module
       LIMIT 1
     ),
     lesson_sort AS (
       SELECT sm.id AS module_id, COALESCE(MAX(l.sort_order), 0) + 1 AS next_sort
       FROM selected_module sm
       LEFT JOIN lessons l ON l.module_id = sm.id
       GROUP BY sm.id
     )
     INSERT INTO lessons (module_id, title, content, video_url, duration_seconds, sort_order)
     SELECT module_id, $3, $4, $5, $6, next_sort
     FROM lesson_sort
     RETURNING
       id,
       module_id,
       $1::uuid AS course_id,
       (SELECT title FROM selected_module) AS module_title,
       title,
       content,
       video_url,
       duration_seconds,
       sort_order,
       created_at`,
    values: [input.courseId, input.moduleTitle, input.title, input.summary, input.videoUrl, input.durationSeconds],
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
  listEnrollments: () => ({
    text: `SELECT id, user_id, course_id, status, progress_percent, enrolled_at, completed_at
     FROM enrollments
     ORDER BY enrolled_at DESC`,
    values: [],
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
  listPayments: (input?: { userId?: string }) => ({
    text: `SELECT id, enrollment_id, user_id, course_id, amount_cents, provider, provider_reference, status, paid_at, created_at
     FROM payments
     WHERE ($1::uuid IS NULL OR user_id = $1)
     ORDER BY created_at DESC`,
    values: [input?.userId ?? null],
  }),
};

export const quizQueries = {
  listStudentQuizAttempts: (userId: string) => ({
    text: `SELECT
       z.id AS quiz_id,
       z.course_id,
       c.title AS course_title,
       z.title AS quiz_title,
       z.passing_score,
       q.id AS question_id,
       q.prompt,
       q.sort_order,
       q.points,
       o.id AS option_id,
       o.label AS option_label,
       latest.id AS submission_id,
       latest.user_id AS submission_user_id,
       latest.score,
       latest.passed,
       latest.submitted_at
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     JOIN quizzes z ON z.course_id = c.id
     JOIN quiz_questions q ON q.quiz_id = z.id
     JOIN quiz_options o ON o.question_id = q.id
     LEFT JOIN LATERAL (
       SELECT id, user_id, score, passed, submitted_at
       FROM quiz_submissions
       WHERE quiz_id = z.id AND user_id = e.user_id
       ORDER BY submitted_at DESC
       LIMIT 1
     ) latest ON true
     WHERE e.user_id = $1 AND e.status = $2
     ORDER BY c.title, z.created_at DESC, q.sort_order, o.label`,
    values: [userId, 'active'],
  }),
  scoreQuizAnswers: (quizId: string, answers: QuizAnswerInput[]) => ({
    text: `WITH submitted_answers AS (
       SELECT *
       FROM jsonb_to_recordset($2::jsonb)
       AS answer("questionId" uuid, "selectedOptionId" uuid)
     ),
     graded AS (
       SELECT
         q.id AS question_id,
         q.points,
         z.passing_score,
         sa."selectedOptionId" AS selected_option_id,
         qo.is_correct
       FROM submitted_answers sa
       JOIN quiz_questions q ON q.id = sa."questionId"
       JOIN quizzes z ON z.id = q.quiz_id
       JOIN quiz_options qo ON qo.id = sa."selectedOptionId" AND qo.question_id = q.id
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
     AS answer(
       "questionId" uuid,
       "selectedOptionId" uuid,
       "isCorrect" boolean,
       "pointsAwarded" integer
     )
     CROSS JOIN LATERAL (
       SELECT
         answer."questionId" AS question_id,
         answer."selectedOptionId" AS selected_option_id,
         answer."isCorrect" AS is_correct,
         answer."pointsAwarded" AS points_awarded
     ) mapped`,
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
