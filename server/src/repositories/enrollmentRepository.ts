import type { Queryable } from '../types/db.js';
import type { Enrollment } from '../types/models.js';
import { toNumber } from '../utils/case.js';
import { enrollmentQueries } from './query.js';

type EnrollmentRow = {
  id: string;
  user_id: string;
  course_id: string;
  status: Enrollment['status'];
  progress_percent: string;
  enrolled_at: string;
  completed_at: string | null;
};

function mapEnrollment(row: EnrollmentRow): Enrollment {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    status: row.status,
    progressPercent: toNumber(row.progress_percent),
    enrolledAt: new Date(row.enrolled_at).toISOString(),
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
  };
}

export async function createEnrollment(
  db: Queryable,
  input: { userId: string; courseId: string },
): Promise<Enrollment> {
  const query = enrollmentQueries.createEnrollment(input);
  const result = await db.query<EnrollmentRow>(query.text, query.values);

  return mapEnrollment(result.rows[0]!);
}

export async function listUserEnrollments(db: Queryable, userId: string): Promise<Enrollment[]> {
  const query = enrollmentQueries.listUserEnrollments(userId);
  const result = await db.query<EnrollmentRow>(query.text, query.values);

  return result.rows.map(mapEnrollment);
}

export async function listEnrollments(db: Queryable): Promise<Enrollment[]> {
  const query = enrollmentQueries.listEnrollments();
  const result = await db.query<EnrollmentRow>(query.text, query.values);

  return result.rows.map(mapEnrollment);
}

export async function findEnrollmentById(db: Queryable, id: string): Promise<Enrollment | null> {
  const query = enrollmentQueries.findEnrollmentById(id);
  const result = await db.query<EnrollmentRow>(query.text, query.values);

  return result.rows[0] ? mapEnrollment(result.rows[0]) : null;
}
