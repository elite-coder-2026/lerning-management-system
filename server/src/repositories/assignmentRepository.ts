import type { Queryable } from '../types/db.js';
import type { AssignmentGradeItem, AssignmentSubmission, AssignmentWork } from '../types/models.js';
import { assignmentQueries } from './query.js';

type AssignmentSubmissionRow = {
  id: string;
  assignment_id: string;
  user_id: string;
  content: string;
  grade_points: number | null;
  feedback: string | null;
  graded_by: string | null;
  submitted_at: string;
  graded_at: string | null;
};

type AssignmentWorkRow = {
  id: string;
  course_id: string;
  course_title: string;
  title: string;
  instructions: string;
  max_points: number;
  due_at: string | null;
} & {
  submission_id: string | null;
  assignment_id: string | null;
  user_id: string | null;
  content: string | null;
  grade_points: number | null;
  feedback: string | null;
  graded_by: string | null;
  submitted_at: string | null;
  graded_at: string | null;
};

type AssignmentGradeRow = AssignmentSubmissionRow & {
  assignment_title: string;
  course_id: string;
  course_title: string;
  max_points: number;
  student_name: string;
  student_email: string;
};

function mapSubmission(row: AssignmentSubmissionRow): AssignmentSubmission {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    userId: row.user_id,
    content: row.content,
    gradePoints: row.grade_points,
    feedback: row.feedback,
    gradedBy: row.graded_by,
    submittedAt: new Date(row.submitted_at).toISOString(),
    gradedAt: row.graded_at ? new Date(row.graded_at).toISOString() : null,
  };
}

function mapOptionalSubmission(row: AssignmentWorkRow): AssignmentSubmission | null {
  if (!row.submission_id || !row.assignment_id || !row.user_id || !row.content || !row.submitted_at) {
    return null;
  }

  return mapSubmission({
    id: row.submission_id,
    assignment_id: row.assignment_id,
    user_id: row.user_id,
    content: row.content,
    grade_points: row.grade_points,
    feedback: row.feedback,
    graded_by: row.graded_by,
    submitted_at: row.submitted_at,
    graded_at: row.graded_at,
  });
}

function mapAssignmentWork(row: AssignmentWorkRow): AssignmentWork {
  return {
    id: row.id,
    courseId: row.course_id,
    courseTitle: row.course_title,
    title: row.title,
    instructions: row.instructions,
    maxPoints: row.max_points,
    dueAt: row.due_at ? new Date(row.due_at).toISOString() : null,
    submission: mapOptionalSubmission(row),
  };
}

function mapGradeItem(row: AssignmentGradeRow): AssignmentGradeItem {
  return {
    ...mapSubmission(row),
    assignmentTitle: row.assignment_title,
    courseId: row.course_id,
    courseTitle: row.course_title,
    maxPoints: row.max_points,
    studentName: row.student_name,
    studentEmail: row.student_email,
  };
}

export async function listStudentAssignments(db: Queryable, userId: string): Promise<AssignmentWork[]> {
  const query = assignmentQueries.listStudentAssignments(userId);
  const result = await db.query<AssignmentWorkRow>(query.text, query.values);

  return result.rows.map(mapAssignmentWork);
}

export async function listSubmissionsForGrading(
  db: Queryable,
  input: { userId: string; role: 'admin' | 'instructor' },
): Promise<AssignmentGradeItem[]> {
  const query = assignmentQueries.listSubmissionsForGrading(input);
  const result = await db.query<AssignmentGradeRow>(query.text, query.values);

  return result.rows.map(mapGradeItem);
}

export async function submitAssignment(
  db: Queryable,
  input: { assignmentId: string; userId: string; content: string },
): Promise<AssignmentSubmission> {
  const query = assignmentQueries.submitAssignment(input);
  const result = await db.query<AssignmentSubmissionRow>(query.text, query.values);

  return mapSubmission(result.rows[0]!);
}

export async function gradeAssignment(
  db: Queryable,
  input: { submissionId: string; gradePoints: number; feedback: string | null; gradedBy: string },
): Promise<AssignmentSubmission | null> {
  const query = assignmentQueries.gradeAssignment(input);
  const result = await db.query<AssignmentSubmissionRow>(query.text, query.values);

  return result.rows[0] ? mapSubmission(result.rows[0]) : null;
}
