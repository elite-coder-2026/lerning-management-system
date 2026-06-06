import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const analyticsRoutes = Router();

analyticsRoutes.get('/dashboard', authMiddleware, requireRole('admin', 'instructor'), asyncHandler(analyticsController.dashboard));
analyticsRoutes.get(
  '/courses/performance',
  authMiddleware,
  requireRole('admin', 'instructor'),
  asyncHandler(analyticsController.coursePerformance),
);
