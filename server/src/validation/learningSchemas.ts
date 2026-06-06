import { z } from 'zod';

export const quizSubmissionSchema = z.object({
  quizId: z.string().uuid(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      selectedOptionId: z.string().uuid(),
    }),
  ).min(1),
});

export const assignmentSubmissionSchema = z.object({
  assignmentId: z.string().uuid(),
  content: z.string().min(1).max(20000),
});

export const assignmentGradeSchema = z.object({
  submissionId: z.string().uuid(),
  gradePoints: z.number().int().min(0),
  feedback: z.string().max(4000).optional(),
});
