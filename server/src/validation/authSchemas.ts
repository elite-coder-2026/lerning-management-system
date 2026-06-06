import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(120),
  role: z.enum(['admin', 'instructor', 'student']).default('student'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
