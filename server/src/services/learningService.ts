import { withTransaction } from '../db/transaction.js';
import { pool } from '../db/pool.js';
import * as assignments from '../repositories/assignmentRepository.js';
import * as quizzes from '../repositories/quizRepository.js';
import type { AssignmentGradeItem, AssignmentSubmission, AssignmentWork, QuizAttempt, QuizSubmission } from '../types/models.js';

export async function listStudentQuizAttempts(userId: string): Promise<QuizAttempt[]> {
  return quizzes.listStudentQuizAttempts(pool, userId);
}

export async function listStudentAssignments(userId: string): Promise<AssignmentWork[]> {
  return assignments.listStudentAssignments(pool, userId);
}

export async function listSubmissionsForGrading(input: {
  userId: string;
  role: 'admin' | 'instructor';
}): Promise<AssignmentGradeItem[]> {
  return assignments.listSubmissionsForGrading(pool, input);
}

export async function submitQuiz(input: {
  quizId: string;
  userId: string;
  answers: quizzes.QuizAnswerInput[];
}): Promise<QuizSubmission> {
  return withTransaction(async (client) => {
    const scored = await quizzes.scoreQuizAnswers(client, input.quizId, input.answers);
    if (scored.scoredAnswers.length !== input.answers.length) {
      throw Object.assign(new Error('One or more answers are invalid for this quiz'), { statusCode: 400 });
    }

    const submission = await quizzes.createQuizSubmission(client, {
      quizId: input.quizId,
      userId: input.userId,
      score: scored.score,
      passed: scored.passed,
    });

    await quizzes.createQuizAnswers(client, submission.id, scored.scoredAnswers);
    return submission;
  });
}

export async function submitAssignment(input: {
  assignmentId: string;
  userId: string;
  content: string;
}): Promise<AssignmentSubmission> {
  return withTransaction((client) => assignments.submitAssignment(client, input));
}

export async function gradeAssignment(input: {
  submissionId: string;
  gradePoints: number;
  feedback?: string;
  gradedBy: string;
}): Promise<AssignmentSubmission> {
  return withTransaction(async (client) => {
    const graded = await assignments.gradeAssignment(client, {
      submissionId: input.submissionId,
      gradePoints: input.gradePoints,
      feedback: input.feedback ?? null,
      gradedBy: input.gradedBy,
    });

    if (!graded) {
      throw Object.assign(new Error('Assignment submission not found'), { statusCode: 404 });
    }

    return graded;
  });
}
