import { pool } from '../db/pool.js';
import * as analytics from '../repositories/analyticsRepository.js';

export function getDashboardAnalytics() {
  return analytics.getDashboardAnalytics(pool);
}

export function getCoursePerformanceReport(input: { from: string; to: string }) {
  return analytics.getCoursePerformanceReport(pool, input);
}
