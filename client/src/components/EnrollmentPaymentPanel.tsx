import { useState } from 'react'
import styled from 'styled-components'
import type { AuthUser, Course, Enrollment, Payment } from '../api/lms'
import { formatCurrency } from '../utils/formatters'

type EnrollmentPaymentPanelProps = {
  courses: Course[]
  enrollments: Enrollment[]
  payments: Payment[]
  user: AuthUser
  onEnroll: (courseId: string) => Promise<void>
  onPay: (input: { enrollmentId: string; provider: string; providerReference: string }) => Promise<void>
  onSelectCourse: (course: Course) => void
}

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.8fr);
  gap: 0;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`

const Section = styled.section`
  display: grid;
  gap: 0;
  border-right: 1px solid #e7edf4;

  &:last-child {
    border-right: 0;
  }

  @media (max-width: 980px) {
    border-right: 0;
    border-bottom: 1px solid #e7edf4;

    &:last-child {
      border-bottom: 0;
    }
  }
`

const SectionTitle = styled.h3`
  margin: 0;
  padding: 16px 20px;
  border-bottom: 1px solid #eef2f6;
  color: #172033;
  font-size: 16px;
`

const List = styled.div`
  display: grid;
`

const Row = styled.article`
  display: grid;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid #eef2f6;

  &:last-child {
    border-bottom: 0;
  }
`

const RowHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
`

const Title = styled.h4`
  margin: 0 0 4px;
  color: #172033;
  font-size: 15px;
`

const Meta = styled.p`
  margin: 0;
  color: #667085;
  font-size: 13px;
`

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

const Button = styled.button`
  border: 1px solid #cfd8e3;
  border-radius: 6px;
  padding: 8px 10px;
  background: #ffffff;
  color: #172033;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.56;
  }
`

const PrimaryButton = styled(Button)`
  border-color: #0f4f8f;
  background: #0f4f8f;
  color: #ffffff;
`

const Badge = styled.span`
  width: fit-content;
  border-radius: 999px;
  padding: 4px 8px;
  background: #eef6ff;
  color: #0f4f8f;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
`

const Field = styled.label`
  display: grid;
  gap: 6px;
  color: #475467;
  font-size: 13px;
  font-weight: 800;
`

const Input = styled.input`
  border: 1px solid #cfd8e3;
  border-radius: 6px;
  padding: 9px 10px;
  color: #172033;
`

const PaymentForm = styled.form`
  display: grid;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid #eef2f6;
  background: #f8fafc;
`

const EmptyState = styled.p`
  margin: 0;
  padding: 16px 20px;
  color: #667085;
`

const ErrorMessage = styled.p`
  margin: 0;
  color: #b42318;
  font-size: 13px;
  font-weight: 800;
`

function getCourse(courses: Course[], courseId: string) {
  return courses.find((course) => course.id === courseId)
}

export function EnrollmentPaymentPanel({
  courses,
  enrollments,
  payments,
  user,
  onEnroll,
  onPay,
  onSelectCourse,
}: EnrollmentPaymentPanelProps) {
  const [activePaymentEnrollmentId, setActivePaymentEnrollmentId] = useState('')
  const [provider, setProvider] = useState('manual')
  const [providerReference, setProviderReference] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const enrolledCourseIds = new Set(enrollments.map((enrollment) => enrollment.courseId))
  const paidEnrollmentIds = new Set(payments.filter((payment) => payment.status === 'paid').map((payment) => payment.enrollmentId))
  const availableCourses = courses.filter((course) => course.status === 'published')
  const canEnroll = user.role === 'student'

  async function handleEnroll(courseId: string) {
    setError('')
    setIsSaving(true)

    try {
      await onEnroll(courseId)
    } catch {
      setError('Enrollment could not be created.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePay(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      await onPay({ enrollmentId: activePaymentEnrollmentId, provider, providerReference })
      setActivePaymentEnrollmentId('')
      setProvider('manual')
      setProviderReference('')
    } catch {
      setError('Payment could not be recorded.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Wrapper>
      <Section>
        <SectionTitle>{canEnroll ? 'Available courses' : 'Enrollment activity'}</SectionTitle>
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
        <List>
          {canEnroll && availableCourses.length === 0 ? <EmptyState>No published courses are available.</EmptyState> : null}
          {canEnroll
            ? availableCourses.map((course) => (
                <Row key={course.id}>
                  <RowHeader>
                    <div>
                      <Title>{course.title}</Title>
                      <Meta>{formatCurrency(course.priceCents)}</Meta>
                    </div>
                    <Badge>{enrolledCourseIds.has(course.id) ? 'enrolled' : course.status}</Badge>
                  </RowHeader>
                  <ActionRow>
                    <Button type="button" onClick={() => onSelectCourse(course)}>
                      Details
                    </Button>
                    <PrimaryButton
                      type="button"
                      disabled={isSaving || enrolledCourseIds.has(course.id)}
                      onClick={() => handleEnroll(course.id)}
                    >
                      {enrolledCourseIds.has(course.id) ? 'Enrolled' : 'Enroll'}
                    </PrimaryButton>
                  </ActionRow>
                </Row>
              ))
            : enrollments.map((enrollment) => {
                const course = getCourse(courses, enrollment.courseId)
                return (
                  <Row key={enrollment.id}>
                    <RowHeader>
                      <div>
                        <Title>{course?.title ?? enrollment.courseId}</Title>
                        <Meta>
                          User {enrollment.userId.slice(0, 8)} · Progress {enrollment.progressPercent}%
                        </Meta>
                      </div>
                      <Badge>{enrollment.status}</Badge>
                    </RowHeader>
                  </Row>
                )
              })}
          {!canEnroll && enrollments.length === 0 ? <EmptyState>No enrollments yet.</EmptyState> : null}
        </List>
      </Section>

      <Section>
        <SectionTitle>{canEnroll ? 'Your enrollments' : 'Payment history'}</SectionTitle>
        {canEnroll && activePaymentEnrollmentId ? (
          <PaymentForm onSubmit={handlePay}>
            <Field>
              Provider
              <Input value={provider} onChange={(event) => setProvider(event.target.value)} required />
            </Field>
            <Field>
              Reference
              <Input
                value={providerReference}
                onChange={(event) => setProviderReference(event.target.value)}
                placeholder="receipt or transaction id"
                required
              />
            </Field>
            <ActionRow>
              <PrimaryButton type="submit" disabled={isSaving}>
                Record payment
              </PrimaryButton>
              <Button type="button" onClick={() => setActivePaymentEnrollmentId('')}>
                Cancel
              </Button>
            </ActionRow>
          </PaymentForm>
        ) : null}
        <List>
          {canEnroll
            ? enrollments.map((enrollment) => {
                const course = getCourse(courses, enrollment.courseId)
                const isPaid = paidEnrollmentIds.has(enrollment.id)
                return (
                  <Row key={enrollment.id}>
                    <RowHeader>
                      <div>
                        <Title>{course?.title ?? enrollment.courseId}</Title>
                        <Meta>
                          {course ? formatCurrency(course.priceCents) : 'Course'} · Enrolled{' '}
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </Meta>
                      </div>
                      <Badge>{isPaid ? 'paid' : enrollment.status}</Badge>
                    </RowHeader>
                    <ActionRow>
                      {course ? (
                        <Button type="button" onClick={() => onSelectCourse(course)}>
                          Details
                        </Button>
                      ) : null}
                      {!isPaid ? (
                        <PrimaryButton type="button" onClick={() => setActivePaymentEnrollmentId(enrollment.id)}>
                          Pay
                        </PrimaryButton>
                      ) : null}
                    </ActionRow>
                  </Row>
                )
              })
            : payments.map((payment) => {
                const course = getCourse(courses, payment.courseId)
                return (
                  <Row key={payment.id}>
                    <RowHeader>
                      <div>
                        <Title>{course?.title ?? payment.courseId}</Title>
                        <Meta>
                          {formatCurrency(payment.amountCents)} · {payment.provider} ·{' '}
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </Meta>
                      </div>
                      <Badge>{payment.status}</Badge>
                    </RowHeader>
                  </Row>
                )
              })}
          {canEnroll && enrollments.length === 0 ? <EmptyState>No enrollments yet.</EmptyState> : null}
          {!canEnroll && payments.length === 0 ? <EmptyState>No payments yet.</EmptyState> : null}
        </List>
      </Section>
    </Wrapper>
  )
}
