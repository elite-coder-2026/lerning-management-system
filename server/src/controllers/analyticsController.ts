import type { Request, Response } from 'express';
import { z } from 'zod';
import * as analyticsService from '../services/analyticsService.js';
import { validate } from '../validation/shared.js';

const reportQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export async function dashboard(req: Request, res: Response) {
  const analytics = await analyticsService.getDashboardAnalytics();
  return res.json({ analytics });
}

export async function coursePerformance(req: Request, res: Response) {
  const query = validate(reportQuerySchema, req.query);
  const report = await analyticsService.getCoursePerformanceReport(query);
  return res.json({ report });
}
