import type { Queryable } from '../types/db.js';
import type { Course, CourseStatus } from '../types/models.js';
import { toNumber } from '../utils/case.js';
import { courseQueries } from './query.js';

type CourseRow = {
  id: string;
  instructor_id: string;
  title: string;
  description: string;
  price_cents: number;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
};

function mapCourse(row: CourseRow): Course {
  return {
    id: row.id,
    instructorId: row.instructor_id,
    title: row.title,
    description: row.description,
    priceCents: toNumber(row.price_cents),
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function listCourses(
  db: Queryable,
  input: { limit: number; offset: number; status?: CourseStatus },
): Promise<Course[]> {
  const query = courseQueries.listCourses(input);
  const result = await db.query<CourseRow>(query.text, query.values);

  return result.rows.map(mapCourse);
}

export async function findCourseById(db: Queryable, id: string): Promise<Course | null> {
  const query = courseQueries.findCourseById(id);
  const result = await db.query<CourseRow>(query.text, query.values);

  return result.rows[0] ? mapCourse(result.rows[0]) : null;
}

export async function createCourse(
  db: Queryable,
  input: {
    instructorId: string;
    title: string;
    description: string;
    priceCents: number;
    status: CourseStatus;
  },
): Promise<Course> {
  const query = courseQueries.createCourse(input);
  const result = await db.query<CourseRow>(query.text, query.values);

  return mapCourse(result.rows[0]!);
}

export async function updateCourse(
  db: Queryable,
  id: string,
  input: Partial<Pick<Course, 'title' | 'description' | 'priceCents' | 'status'>>,
): Promise<Course | null> {
  const query = courseQueries.updateCourse(id, input);
  const result = await db.query<CourseRow>(query.text, query.values);

  return result.rows[0] ? mapCourse(result.rows[0]) : null;
}

export async function deleteCourse(db: Queryable, id: string): Promise<boolean> {
  const query = courseQueries.deleteCourse(id);
  const result = await db.query(query.text, query.values);

  return (result.rowCount ?? 0) > 0;
}
