import type { Request, Response } from 'express';
import * as courseService from '../services/courseService.js';
import type { CourseStatus } from '../types/models.js';
import { createCourseSchema, enrollmentSchema, paymentSchema, updateCourseSchema } from '../validation/courseSchemas.js';
import { paginationSchema, uuidSchema, validate } from '../validation/shared.js';

export async function listCourses(req: Request, res: Response) {
  const query = validate(paginationSchema.extend({ status: createCourseSchema.shape.status.optional() }), req.query);
  const courses = await courseService.listCourses({
    limit: query.limit,
    offset: query.offset,
    status: query.status as CourseStatus | undefined,
  });
  return res.json({ courses });
}

export async function getCourse(req: Request, res: Response) {
  const id = validate(uuidSchema, req.params.id);
  const course = await courseService.getCourse(id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  return res.json({ course });
}

export async function createCourse(req: Request, res: Response) {
  const input = validate(createCourseSchema, req.body);
  const course = await courseService.createCourse({
    instructorId: req.user!.id,
    ...input,
  });
  return res.status(201).json({ course });
}

export async function updateCourse(req: Request, res: Response) {
  const id = validate(uuidSchema, req.params.id);
  const input = validate(updateCourseSchema, req.body);
  const course = await courseService.updateCourse(id, input);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  return res.json({ course });
}

export async function deleteCourse(req: Request, res: Response) {
  const id = validate(uuidSchema, req.params.id);
  const deleted = await courseService.deleteCourse(id);
  return res.status(deleted ? 204 : 404).send();
}

export async function enroll(req: Request, res: Response) {
  const input = validate(enrollmentSchema, req.body);
  const enrollment = await courseService.enrollStudent({
    userId: input.userId ?? req.user!.id,
    courseId: input.courseId,
  });
  return res.status(201).json({ enrollment });
}

export async function pay(req: Request, res: Response) {
  const input = validate(paymentSchema, req.body);
  const payment = await courseService.recordPayment(input);
  return res.status(201).json({ payment });
}
