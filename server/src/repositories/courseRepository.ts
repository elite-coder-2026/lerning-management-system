import type { Queryable } from '../types/db.js';
import type { Course, CourseStatus, VideoLesson } from '../types/models.js';
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

type VideoLessonRow = {
  id: string;
  module_id: string;
  course_id: string;
  module_title: string;
  title: string;
  content: string;
  video_url: string;
  duration_seconds: number;
  sort_order: number;
  created_at: string;
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

function mapVideoLesson(row: VideoLessonRow): VideoLesson {
  return {
    id: row.id,
    moduleId: row.module_id,
    courseId: row.course_id,
    moduleTitle: row.module_title,
    title: row.title,
    summary: row.content,
    videoUrl: row.video_url,
    durationSeconds: toNumber(row.duration_seconds),
    sortOrder: row.sort_order,
    createdAt: new Date(row.created_at).toISOString(),
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

export async function createVideoLesson(
  db: Queryable,
  input: {
    courseId: string;
    moduleTitle: string;
    title: string;
    summary: string;
    videoUrl: string;
    durationSeconds: number;
  },
): Promise<VideoLesson> {
  const query = courseQueries.createVideoLesson(input);
  const result = await db.query<VideoLessonRow>(query.text, query.values);

  return mapVideoLesson(result.rows[0]!);
}
