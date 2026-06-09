import { Router } from 'express';
import * as courseController from '../controllers/courseController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const courseRoutes = Router();

courseRoutes.get('/', asyncHandler(courseController.listCourses));
courseRoutes.get('/enrollments', authMiddleware, requireRole('admin', 'student'), asyncHandler(courseController.listEnrollments));
courseRoutes.get('/payments', authMiddleware, requireRole('admin', 'student'), asyncHandler(courseController.listPayments));
courseRoutes.get('/:id', asyncHandler(courseController.getCourse));
courseRoutes.post('/', authMiddleware, requireRole('admin', 'instructor'), asyncHandler(courseController.createCourse));
courseRoutes.post('/video-lessons', authMiddleware, requireRole('admin', 'instructor'), asyncHandler(courseController.createVideoLesson));
courseRoutes.patch('/:id', authMiddleware, requireRole('admin', 'instructor'), asyncHandler(courseController.updateCourse));
courseRoutes.delete('/:id', authMiddleware, requireRole('admin'), asyncHandler(courseController.deleteCourse));
courseRoutes.post('/enrollments', authMiddleware, requireRole('admin', 'student'), asyncHandler(courseController.enroll));
courseRoutes.post('/payments', authMiddleware, requireRole('admin', 'student'), asyncHandler(courseController.pay));
