import { useEffect, useState } from 'react'
import styled from 'styled-components'
import type { AuthUser, CohortReportRow, Course, CourseInput, Enrollment, Payment } from '../api/lms'
import { AuthorCourseList } from './AuthorCourseList'
import { CohortReportPanel } from './CohortReportPanel'
import { CourseDetailPage } from './CourseDetailPage'
import { CourseList } from './CourseList'
import { CourseManagement } from './CourseManagement'
import { EnrollmentPaymentPanel } from './EnrollmentPaymentPanel'
import { Panel } from './Panel'
import { WorkflowEndpoints } from './WorkflowEndpoints'

type DashboardContentProps = {
  courses: Course[]
  cohortReport: CohortReportRow[]
  enrollments: Enrollment[]
  payments: Payment[]
  user: AuthUser
  onCreateCourse: (input: CourseInput) => Promise<void>
  onEnroll: (courseId: string) => Promise<void>
  onLoadCohortReport: (input: { from: string; to: string }) => Promise<void>
  onPay: (input: { enrollmentId: string; provider: string; providerReference: string }) => Promise<void>
  onUpdateCourse: (id: string, input: Partial<CourseInput>) => Promise<void>
}

const rolePanels: Record<AuthUser['role'], { title: string; meta: string; items: string[] }> = {
  admin: {
    title: 'Admin priorities',
    meta: 'platform controls',
    items: ['Review course catalog changes', 'Audit enrollments and payments', 'Monitor analytics and reports'],
  },
  instructor: {
    title: 'Instructor priorities',
    meta: 'teaching workflow',
    items: ['Create and publish courses', 'Grade assignment submissions', 'Review quiz performance'],
  },
  student: {
    title: 'Student priorities',
    meta: 'learning workflow',
    items: ['Enroll in available courses', 'Complete quizzes', 'Submit assignments'],
  },
}

const ContentGrid = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
  gap: 24px;
  max-width: 1180px;
  margin: 0 auto;
  padding: 24px 24px 48px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const WidePanel = styled.div`
  grid-column: 1 / -1;
`

const PriorityList = styled.ul`
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 18px 20px;
  color: #475467;
`

export function DashboardContent({
  courses,
  cohortReport,
  enrollments,
  payments,
  user,
  onCreateCourse,
  onEnroll,
  onLoadCohortReport,
  onPay,
  onUpdateCourse,
}: DashboardContentProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(courses[0] ?? null)
  const rolePanel = rolePanels[user.role]
  const authoredCourses = courses.filter((course) => course.instructorId === user.id)
  const visibleCourses = user.role === 'instructor' && authoredCourses.length > 0 ? authoredCourses : courses
  const canManageCourses = user.role === 'admin' || user.role === 'instructor'
  const canViewEnrollmentPayments = user.role === 'admin' || user.role === 'student'
  const canViewCohortReport = user.role === 'admin' || user.role === 'instructor'
  const enrolledCourseIds = new Set(enrollments.map((enrollment) => enrollment.courseId))
  const studentEnroll = user.role === 'student' ? onEnroll : undefined

  useEffect(() => {
    if (!selectedCourse) {
      return
    }

    setSelectedCourse(courses.find((course) => course.id === selectedCourse.id) ?? null)
  }, [courses, selectedCourse])

  return (
    <ContentGrid>
      <WidePanel>
        <Panel title={user.role === 'student' ? 'Available author courses' : 'Author courses'} meta="filtered by instructor">
          <AuthorCourseList
            courses={visibleCourses}
            enrolledCourseIds={enrolledCourseIds}
            onEnroll={studentEnroll}
            onSelectCourse={setSelectedCourse}
          />
        </Panel>
      </WidePanel>

      {canManageCourses ? (
        <WidePanel>
          <Panel title="Course management" meta={user.role === 'admin' ? 'admin and instructor controls' : 'instructor only'}>
            <CourseManagement
              courses={courses}
              selectedCourseId={selectedCourse?.id}
              user={user}
              onCreateCourse={onCreateCourse}
              onSelectCourse={setSelectedCourse}
              onUpdateCourse={onUpdateCourse}
            />
          </Panel>
        </WidePanel>
      ) : null}

      {selectedCourse ? (
        <WidePanel>
          <Panel title="Course detail" meta="modules, lessons, quizzes, assignments">
            <CourseDetailPage
              course={selectedCourse}
              isEnrolled={enrolledCourseIds.has(selectedCourse.id)}
              onClose={() => setSelectedCourse(null)}
              onEnroll={studentEnroll}
            />
          </Panel>
        </WidePanel>
      ) : null}

      {canViewEnrollmentPayments ? (
        <WidePanel>
          <Panel
            title={user.role === 'student' ? 'Enrollments and payments' : 'Enrollment and payment history'}
            meta={user.role === 'student' ? 'student workflow' : 'admin review'}
          >
            <EnrollmentPaymentPanel
              courses={courses}
              enrollments={enrollments}
              payments={payments}
              user={user}
              onEnroll={onEnroll}
              onPay={onPay}
              onSelectCourse={setSelectedCourse}
            />
          </Panel>
        </WidePanel>
      ) : null}

      {canViewCohortReport ? (
        <WidePanel>
          <Panel title="Cohort report" meta="enrollment cohorts">
            <CohortReportPanel report={cohortReport} onLoadReport={onLoadCohortReport} />
          </Panel>
        </WidePanel>
      ) : null}

      <Panel
        title={user.role === 'instructor' ? 'Your published courses' : 'Published courses'}
        meta={`${visibleCourses.length} loaded`}
      >
        <CourseList courses={visibleCourses} onSelectCourse={setSelectedCourse} />
      </Panel>

      <Panel title={rolePanel.title} meta={rolePanel.meta}>
        <PriorityList>
          {rolePanel.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </PriorityList>
      </Panel>

      <Panel title="Workflow endpoints" meta={user.role === 'student' ? 'student actions' : 'transactional'}>
        <WorkflowEndpoints role={user.role} />
      </Panel>
    </ContentGrid>
  )
}
