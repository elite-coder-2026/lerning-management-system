import type { Queryable } from '../types/db.js';
import type { AssignmentSubmission } from '../types/models.js';
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
