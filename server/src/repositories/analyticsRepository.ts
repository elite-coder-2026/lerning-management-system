import type { Queryable } from '../types/db.js';
import type { DashboardAnalytics } from '../types/models.js';
import { toNumber } from '../utils/case.js';
import { analyticsQueries } from './query.js';

type AnalyticsRow = {
  total_students: string;
  active_enrollments: string;
  revenue_cents: string;
  average_quiz_score: string | null;
  completion_rate: string | null;
};

export async function getDashboardAnalytics(db: Queryable): Promise<DashboardAnalytics> {
  const query = analyticsQueries.getDashboardAnalytics();
  const result = await db.query<AnalyticsRow>(query.text, query.values);

  const row = result.rows[0]!;
  return {
    totalStudents: toNumber(row.total_students),
    activeEnrollments: toNumber(row.active_enrollments),
    revenueCents: toNumber(row.revenue_cents),
    averageQuizScore: toNumber(row.average_quiz_score),
    completionRate: toNumber(row.completion_rate),
  };
}

export async function getCoursePerformanceReport(
  db: Queryable,
  input: { from: string; to: string },
): Promise<Array<{
  courseId: string;
  title: string;
  enrollments: number;
  revenueCents: number;
  averageQuizScore: number;
  gradedAssignments: number;
}>> {
  const query = analyticsQueries.getCoursePerformanceReport(input);
  const result = await db.query<{
    course_id: string;
    title: string;
    enrollments: string;
    revenue_cents: string;
    average_quiz_score: string | null;
    graded_assignments: string;
  }>(query.text, query.values);

  return result.rows.map((row) => ({
    courseId: row.course_id,
    title: row.title,
    enrollments: toNumber(row.enrollments),
    revenueCents: toNumber(row.revenue_cents),
    averageQuizScore: toNumber(row.average_quiz_score),
    gradedAssignments: toNumber(row.graded_assignments),
  }));
}

export async function getCohortReport(
  db: Queryable,
  input: { from: string; to: string },
): Promise<Array<{
  cohortMonth: string;
  students: number;
  enrollments: number;
  paidStudents: number;
  revenueCents: number;
  completedEnrollments: number;
  completionRate: number;
  averageQuizScore: number;
}>> {
  const query = analyticsQueries.getCohortReport(input);
  const result = await db.query<{
    cohort_month: string;
    students: string;
    enrollments: string;
    paid_students: string;
    revenue_cents: string;
    completed_enrollments: string;
    completion_rate: string | null;
    average_quiz_score: string | null;
  }>(query.text, query.values);

  return result.rows.map((row) => ({
    cohortMonth: new Date(row.cohort_month).toISOString(),
    students: toNumber(row.students),
    enrollments: toNumber(row.enrollments),
    paidStudents: toNumber(row.paid_students),
    revenueCents: toNumber(row.revenue_cents),
    completedEnrollments: toNumber(row.completed_enrollments),
    completionRate: toNumber(row.completion_rate),
    averageQuizScore: toNumber(row.average_quiz_score),
  }));
}
