import { Router } from 'express';
import * as learningController from '../controllers/learningController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const learningRoutes = Router();

learningRoutes.post('/quizzes/submissions', authMiddleware, requireRole('student'), asyncHandler(learningController.submitQuiz));
learningRoutes.post('/assignments/submissions', authMiddleware, requireRole('student'), asyncHandler(learningController.submitAssignment));
learningRoutes.post(
  '/assignments/grades',
  authMiddleware,
  requireRole('admin', 'instructor'),
  asyncHandler(learningController.gradeAssignment),
);
