import { useState } from 'react'
import styled from 'styled-components'
import type { AssignmentGradeItem, AssignmentWork, AuthUser, QuizAttempt } from '../api/lms'

type LearningWorkflowPanelProps = {
  assignments: AssignmentWork[]
  assignmentSubmissions: AssignmentGradeItem[]
  quizAttempts: QuizAttempt[]
  user: AuthUser
  onGradeAssignment: (input: { submissionId: string; gradePoints: number; feedback?: string }) => Promise<void>
  onSubmitAssignment: (input: { assignmentId: string; content: string }) => Promise<void>
  onSubmitQuiz: (input: { quizId: string; answers: Array<{ questionId: string; selectedOptionId: string }> }) => Promise<void>
}

const WorkflowGrid = styled.div`
  display: grid;
  gap: 18px;
  padding: 20px;
`

const SplitGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const Stack = styled.div`
  display: grid;
  gap: 12px;
`

const Item = styled.article`
  display: grid;
  gap: 12px;
  border: 1px solid #e3e9f1;
  border-radius: 8px;
  padding: 14px;
  background: #ffffff;
`

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`

const TitleGroup = styled.div`
  display: grid;
  gap: 4px;
`

const Title = styled.h4`
  margin: 0;
  color: #172033;
  font-size: 17px;
  line-height: 1.25;
`

const Meta = styled.span`
  color: #667085;
  font-size: 13px;
  font-weight: 700;
`

const BodyText = styled.p`
  margin: 0;
  color: #475467;
  line-height: 1.55;
`

const StatusPill = styled.span<{ $tone?: 'success' | 'warning' | 'neutral' }>`
  width: fit-content;
  border: 1px solid
    ${({ $tone }) => ($tone === 'success' ? '#9bd8b4' : $tone === 'warning' ? '#f6c66d' : '#cfd8e3')};
  border-radius: 999px;
  padding: 5px 9px;
  background: ${({ $tone }) => ($tone === 'success' ? '#ecfdf3' : $tone === 'warning' ? '#fff7e6' : '#f8fafc')};
  color: ${({ $tone }) => ($tone === 'success' ? '#04713d' : $tone === 'warning' ? '#875800' : '#475467')};
  font-size: 12px;
  font-weight: 900;
`

const QuestionSet = styled.fieldset`
  display: grid;
  gap: 10px;
  margin: 0;
  border: 0;
  padding: 0;
`

const Question = styled.div`
  display: grid;
  gap: 8px;
`

const QuestionPrompt = styled.legend`
  color: #172033;
  font-weight: 900;
`

const OptionLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 9px;
  color: #475467;
  font-size: 14px;
`

const TextArea = styled.textarea`
  min-height: 110px;
  width: 100%;
  resize: vertical;
  border: 1px solid #cfd8e3;
  border-radius: 8px;
  padding: 10px 12px;
  color: #172033;
  font: inherit;
`

const GradeRow = styled.div`
  display: grid;
  grid-template-columns: minmax(92px, 120px) minmax(0, 1fr) auto;
  gap: 10px;
  align-items: end;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`

const InputGroup = styled.label`
  display: grid;
  gap: 6px;
  color: #667085;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
`

const NumberInput = styled.input`
  min-height: 42px;
  border: 1px solid #cfd8e3;
  border-radius: 8px;
  padding: 9px 10px;
  color: #172033;
  font: inherit;
`

const PrimaryButton = styled.button`
  min-height: 42px;
  border: 1px solid #0f4f8f;
  border-radius: 8px;
  padding: 10px 14px;
  background: #0f4f8f;
  color: #ffffff;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.56;
  }
`

const EmptyState = styled.div`
  border: 1px dashed #cfd8e3;
  border-radius: 8px;
  padding: 18px;
  color: #667085;
  background: #f8fafc;
`

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : 'No due date'
}

function scoreTone(passed: boolean | null | undefined) {
  if (passed === true) {
    return 'success'
  }
  if (passed === false) {
    return 'warning'
  }
  return 'neutral'
}

export function LearningWorkflowPanel({
  assignments,
  assignmentSubmissions,
  quizAttempts,
  user,
  onGradeAssignment,
  onSubmitAssignment,
  onSubmitQuiz,
}: LearningWorkflowPanelProps) {
  const [quizAnswers, setQuizAnswers] = useState<Record<string, Record<string, string>>>({})
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, string>>({})
  const [gradeDrafts, setGradeDrafts] = useState<Record<string, { gradePoints: string; feedback: string }>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  async function handleQuizSubmit(quiz: QuizAttempt) {
    const selectedAnswers = quizAnswers[quiz.id] ?? {}
    const answers = quiz.questions.map((question) => ({
      questionId: question.id,
      selectedOptionId: selectedAnswers[question.id],
    }))

    if (answers.some((answer) => !answer.selectedOptionId)) {
      return
    }

    setBusyId(quiz.id)
    try {
      await onSubmitQuiz({ quizId: quiz.id, answers })
    } finally {
      setBusyId(null)
    }
  }

  async function handleAssignmentSubmit(assignment: AssignmentWork) {
    const content = assignmentDrafts[assignment.id] ?? assignment.submission?.content ?? ''

    if (!content.trim()) {
      return
    }

    setBusyId(assignment.id)
    try {
      await onSubmitAssignment({ assignmentId: assignment.id, content: content.trim() })
    } finally {
      setBusyId(null)
    }
  }

  async function handleGradeSubmit(submission: AssignmentGradeItem) {
    const draft = gradeDrafts[submission.id]
    const gradePoints = Number(draft?.gradePoints ?? submission.gradePoints ?? 0)

    if (!Number.isFinite(gradePoints) || gradePoints < 0 || gradePoints > submission.maxPoints) {
      return
    }

    setBusyId(submission.id)
    try {
      await onGradeAssignment({
        submissionId: submission.id,
        gradePoints,
        feedback: draft?.feedback.trim() || undefined,
      })
    } finally {
      setBusyId(null)
    }
  }

  if (user.role === 'student') {
    return (
      <WorkflowGrid>
        <SplitGrid>
          <Stack>
            {quizAttempts.length === 0 ? (
              <EmptyState>No quiz attempts are available for your active enrollments.</EmptyState>
            ) : (
              quizAttempts.map((quiz) => {
                const selectedAnswers = quizAnswers[quiz.id] ?? {}
                const isComplete = quiz.questions.every((question) => selectedAnswers[question.id])

                return (
                  <Item key={quiz.id}>
                    <Header>
                      <TitleGroup>
                        <Title>{quiz.title}</Title>
                        <Meta>{quiz.courseTitle} / pass at {quiz.passingScore}%</Meta>
                      </TitleGroup>
                      <StatusPill $tone={scoreTone(quiz.latestSubmission?.passed)}>
                        {quiz.latestSubmission
                          ? `${quiz.latestSubmission.score}% ${quiz.latestSubmission.passed ? 'passed' : 'needs retry'}`
                          : 'Not submitted'}
                      </StatusPill>
                    </Header>

                    <QuestionSet>
                      {quiz.questions.map((question) => (
                        <Question key={question.id}>
                          <QuestionPrompt>
                            {question.sortOrder}. {question.prompt}
                          </QuestionPrompt>
                          {question.options.map((option) => (
                            <OptionLabel key={option.id}>
                              <input
                                type="radio"
                                name={`${quiz.id}-${question.id}`}
                                checked={selectedAnswers[question.id] === option.id}
                                onChange={() =>
                                  setQuizAnswers((current) => ({
                                    ...current,
                                    [quiz.id]: { ...current[quiz.id], [question.id]: option.id },
                                  }))
                                }
                              />
                              <span>{option.label}</span>
                            </OptionLabel>
                          ))}
                        </Question>
                      ))}
                    </QuestionSet>

                    <PrimaryButton type="button" disabled={!isComplete || busyId === quiz.id} onClick={() => handleQuizSubmit(quiz)}>
                      {busyId === quiz.id ? 'Submitting' : quiz.latestSubmission ? 'Submit retry' : 'Submit quiz'}
                    </PrimaryButton>
                  </Item>
                )
              })
            )}
          </Stack>

          <Stack>
            {assignments.length === 0 ? (
              <EmptyState>No assignments are available for your active enrollments.</EmptyState>
            ) : (
              assignments.map((assignment) => {
                const draft = assignmentDrafts[assignment.id] ?? assignment.submission?.content ?? ''
                const gradeLabel =
                  assignment.submission?.gradePoints === null || assignment.submission?.gradePoints === undefined
                    ? 'Awaiting grade'
                    : `${assignment.submission.gradePoints}/${assignment.maxPoints}`

                return (
                  <Item key={assignment.id}>
                    <Header>
                      <TitleGroup>
                        <Title>{assignment.title}</Title>
                        <Meta>{assignment.courseTitle} / due {formatDate(assignment.dueAt)}</Meta>
                      </TitleGroup>
                      <StatusPill $tone={assignment.submission?.gradedAt ? 'success' : 'neutral'}>
                        {assignment.submission ? gradeLabel : 'Not submitted'}
                      </StatusPill>
                    </Header>
                    <BodyText>{assignment.instructions}</BodyText>
                    {assignment.submission?.feedback ? <BodyText>Feedback: {assignment.submission.feedback}</BodyText> : null}
                    <TextArea
                      value={draft}
                      onChange={(event) =>
                        setAssignmentDrafts((current) => ({ ...current, [assignment.id]: event.target.value }))
                      }
                    />
                    <PrimaryButton
                      type="button"
                      disabled={!draft.trim() || busyId === assignment.id}
                      onClick={() => handleAssignmentSubmit(assignment)}
                    >
                      {busyId === assignment.id ? 'Submitting' : assignment.submission ? 'Update submission' : 'Submit assignment'}
                    </PrimaryButton>
                  </Item>
                )
              })
            )}
          </Stack>
        </SplitGrid>
      </WorkflowGrid>
    )
  }

  return (
    <WorkflowGrid>
      {assignmentSubmissions.length === 0 ? (
        <EmptyState>No assignment submissions are waiting for this role.</EmptyState>
      ) : (
        <Stack>
          {assignmentSubmissions.map((submission) => {
            const draft = gradeDrafts[submission.id] ?? {
              gradePoints: submission.gradePoints?.toString() ?? '',
              feedback: submission.feedback ?? '',
            }

            return (
              <Item key={submission.id}>
                <Header>
                  <TitleGroup>
                    <Title>{submission.assignmentTitle}</Title>
                    <Meta>
                      {submission.courseTitle} / {submission.studentName} / {submission.studentEmail}
                    </Meta>
                  </TitleGroup>
                  <StatusPill $tone={submission.gradedAt ? 'success' : 'warning'}>
                    {submission.gradedAt ? `${submission.gradePoints}/${submission.maxPoints}` : 'Ungraded'}
                  </StatusPill>
                </Header>
                <BodyText>{submission.content}</BodyText>
                <GradeRow>
                  <InputGroup>
                    Points
                    <NumberInput
                      type="number"
                      min="0"
                      max={submission.maxPoints}
                      value={draft.gradePoints}
                      onChange={(event) =>
                        setGradeDrafts((current) => ({
                          ...current,
                          [submission.id]: { ...draft, gradePoints: event.target.value },
                        }))
                      }
                    />
                  </InputGroup>
                  <InputGroup>
                    Feedback
                    <NumberInput
                      as="input"
                      value={draft.feedback}
                      onChange={(event) =>
                        setGradeDrafts((current) => ({
                          ...current,
                          [submission.id]: { ...draft, feedback: event.target.value },
                        }))
                      }
                    />
                  </InputGroup>
                  <PrimaryButton type="button" disabled={busyId === submission.id} onClick={() => handleGradeSubmit(submission)}>
                    {busyId === submission.id ? 'Saving' : submission.gradedAt ? 'Update grade' : 'Save grade'}
                  </PrimaryButton>
                </GradeRow>
              </Item>
            )
          })}
        </Stack>
      )}
    </WorkflowGrid>
  )
}
