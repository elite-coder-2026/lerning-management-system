import type { Queryable } from '../types/db.js';
import type { QuizAttempt, QuizSubmission } from '../types/models.js';
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

type QuizAttemptRow = {
  quiz_id: string;
  course_id: string;
  course_title: string;
  quiz_title: string;
  passing_score: string;
  question_id: string;
  prompt: string;
  sort_order: number;
  points: number;
  option_id: string;
  option_label: string;
  submission_id: string | null;
  submission_user_id: string | null;
  score: string | null;
  passed: boolean | null;
  submitted_at: string | null;
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

export async function listStudentQuizAttempts(db: Queryable, userId: string): Promise<QuizAttempt[]> {
  const query = quizQueries.listStudentQuizAttempts(userId);
  const result = await db.query<QuizAttemptRow>(query.text, query.values);
  const attempts = new Map<string, QuizAttempt>();

  for (const row of result.rows) {
    let attempt = attempts.get(row.quiz_id);

    if (!attempt) {
      attempt = {
        id: row.quiz_id,
        courseId: row.course_id,
        courseTitle: row.course_title,
        title: row.quiz_title,
        passingScore: toNumber(row.passing_score),
        latestSubmission:
          row.submission_id && row.submission_user_id && row.score && row.submitted_at
            ? mapSubmission({
                id: row.submission_id,
                quiz_id: row.quiz_id,
                user_id: row.submission_user_id,
                score: row.score,
                passed: Boolean(row.passed),
                submitted_at: row.submitted_at,
              })
            : null,
        questions: [],
      };
      attempts.set(row.quiz_id, attempt);
    }

    let question = attempt.questions.find((item) => item.id === row.question_id);

    if (!question) {
      question = {
        id: row.question_id,
        quizId: row.quiz_id,
        prompt: row.prompt,
        sortOrder: row.sort_order,
        points: row.points,
        options: [],
      };
      attempt.questions.push(question);
    }

    question.options.push({
      id: row.option_id,
      questionId: row.question_id,
      label: row.option_label,
    });
  }

  return Array.from(attempts.values());
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
