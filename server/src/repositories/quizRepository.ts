import type { Queryable } from '../types/db.js';
import type { QuizSubmission } from '../types/models.js';
import { toNumber } from '../utils/case.js';
import { quizQueries } from './query.js';

export type QuizAnswerInput = {
  questionId: string;
  selectedOptionId: string;
};

type QuizQuestionAnswerRow = {
  question_id: string;
  points: number;
  passing_score: string;
  selected_option_id: string;
  is_correct: boolean;
};

type SubmissionRow = {
  id: string;
  quiz_id: string;
  user_id: string;
  score: string;
  passed: boolean;
  submitted_at: string;
};

function mapSubmission(row: SubmissionRow): QuizSubmission {
  return {
    id: row.id,
    quizId: row.quiz_id,
    userId: row.user_id,
    score: toNumber(row.score),
    passed: row.passed,
    submittedAt: new Date(row.submitted_at).toISOString(),
  };
}

export async function scoreQuizAnswers(
  db: Queryable,
  quizId: string,
  answers: QuizAnswerInput[],
): Promise<{
  score: number;
  passed: boolean;
  passingScore: number;
  scoredAnswers: Array<QuizAnswerInput & { isCorrect: boolean; pointsAwarded: number }>;
}> {
  const query = quizQueries.scoreQuizAnswers(quizId, answers);
  const result = await db.query<QuizQuestionAnswerRow>(query.text, query.values);

  const totalPoints = result.rows.reduce((sum, row) => sum + toNumber(row.points), 0);
  const earnedPoints = result.rows.reduce((sum, row) => sum + (row.is_correct ? toNumber(row.points) : 0), 0);
  const passingScore = toNumber(result.rows[0]?.passing_score);
  const score = totalPoints === 0 ? 0 : Number(((earnedPoints / totalPoints) * 100).toFixed(2));

  return {
    score,
    passed: score >= passingScore,
    passingScore,
    scoredAnswers: result.rows.map((row) => ({
      questionId: row.question_id,
      selectedOptionId: row.selected_option_id,
      isCorrect: row.is_correct,
      pointsAwarded: row.is_correct ? toNumber(row.points) : 0,
    })),
  };
}

export async function createQuizSubmission(
  db: Queryable,
  input: { quizId: string; userId: string; score: number; passed: boolean },
): Promise<QuizSubmission> {
  const query = quizQueries.createQuizSubmission(input);
  const result = await db.query<SubmissionRow>(query.text, query.values);

  return mapSubmission(result.rows[0]!);
}

export async function createQuizAnswers(
  db: Queryable,
  submissionId: string,
  answers: Array<QuizAnswerInput & { isCorrect: boolean; pointsAwarded: number }>,
): Promise<void> {
  const query = quizQueries.createQuizAnswers(submissionId, answers);
  await db.query(query.text, query.values);
}
