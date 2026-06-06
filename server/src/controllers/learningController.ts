import type { Request, Response } from 'express';
import * as learningService from '../services/learningService.js';
import { assignmentGradeSchema, assignmentSubmissionSchema, quizSubmissionSchema } from '../validation/learningSchemas.js';
import { validate } from '../validation/shared.js';

export async function submitQuiz(req: Request, res: Response) {
  const input = validate(quizSubmissionSchema, req.body);
  const submission = await learningService.submitQuiz({
    quizId: input.quizId,
    userId: req.user!.id,
    answers: input.answers,
  });
  return res.status(201).json({ submission });
}

export async function submitAssignment(req: Request, res: Response) {
  const input = validate(assignmentSubmissionSchema, req.body);
  const submission = await learningService.submitAssignment({
    assignmentId: input.assignmentId,
    userId: req.user!.id,
    content: input.content,
  });
  return res.status(201).json({ submission });
}

export async function gradeAssignment(req: Request, res: Response) {
  const input = validate(assignmentGradeSchema, req.body);
  const submission = await learningService.gradeAssignment({
    submissionId: input.submissionId,
    gradePoints: input.gradePoints,
    feedback: input.feedback,
    gradedBy: req.user!.id,
  });
  return res.json({ submission });
}
