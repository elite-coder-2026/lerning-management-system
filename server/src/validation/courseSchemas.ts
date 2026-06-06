import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(4000),
  priceCents: z.number().int().min(0),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export const updateCourseSchema = createCourseSchema.partial();

export const enrollmentSchema = z.object({
  userId: z.string().uuid().optional(),
  courseId: z.string().uuid(),
});

export const paymentSchema = z.object({
  enrollmentId: z.string().uuid(),
  provider: z.string().min(1).max(80),
  providerReference: z.string().min(1).max(160),
});
