import { useMemo } from 'react'
import type {
  AssignmentGradeItem,
  AssignmentWork,
  AuthUser,
  CohortReportRow,
  Course,
  CourseInput,
  Enrollment,
  Payment,
  QuizAttempt,
  VideoLesson,
} from '../api/lms'
import { DashboardContent } from './DashboardContent'
import { HeroSection } from './HeroSection'
import { StatsGrid } from './StatsGrid'
import { VerticalNav, type VerticalNavItem } from './VerticalNav'
import { formatCurrency } from '../utils/formatters'
import styled from 'styled-components'

type DashboardPageProps = {
  courses: Course[]
  assignments: AssignmentWork[]
  assignmentSubmissions: AssignmentGradeItem[]
  cohortReport: CohortReportRow[]
  enrollments: Enrollment[]
  payments: Payment[]
  quizAttempts: QuizAttempt[]
  status: string
  user: AuthUser
  onLogout: () => void
  onCreateCourse: (input: CourseInput) => Promise<void>
  onCreateVideoLesson: (input: {
    courseId: string;
    moduleTitle: string;
    title: string;
    summary: string;
    videoUrl: string;
    durationMinutes: number;
  }) => Promise<VideoLesson | null>
  onEnroll: (courseId: string) => Promise<void>
  onGradeAssignment: (input: { submissionId: string; gradePoints: number; feedback?: string }) => Promise<void>
  onLoadCohortReport: (input: { from: string; to: string }) => Promise<void>
  onOpenDashboard: (role: AuthUser['role']) => Promise<void>
  onSubmitAssignment: (input: { assignmentId: string; content: string }) => Promise<void>
  onSubmitQuiz: (input: { quizId: string; answers: Array<{ questionId: string; selectedOptionId: string }> }) => Promise<void>
  onUpdateCourse: (id: string, input: Partial<CourseInput>) => Promise<void>
}

const PageWithNav = styled.div`
  padding-left: 232px;

  @media (max-width: 1180px) {
    padding-left: 0;
  }
`

const roleNavItems: Record<AuthUser['role'], VerticalNavItem[]> = {
  student: [
    { label: 'Workspace', href: '#workspace' },
    { label: 'Dashboard stats', href: '#dashboard-stats' },
    { label: 'Available courses', href: '#student-available-courses' },
    { label: 'Course detail', href: '#student-course-detail' },
  ],
  instructor: [
    { label: 'Workspace', href: '#workspace' },
    { label: 'Dashboard stats', href: '#dashboard-stats' },
    { label: 'Course management', href: '#instructor-course-management' },
    { label: 'Assignment grading', href: '#instructor-assignment-grading' },
    { label: 'Course detail', href: '#instructor-course-detail' },
  ],
  admin: [
    { label: 'Workspace', href: '#workspace' },
    { label: 'Dashboard stats', href: '#dashboard-stats' },
    { label: 'Platform metrics', href: '#admin-platform-metrics' },
    { label: 'Cohort report', href: '#admin-cohort-report' },
  ],
}

export function DashboardPage({
  assignments,
  assignmentSubmissions,
  courses,
  cohortReport,
  enrollments,
  payments,
  quizAttempts,
  status,
  user,
  onLogout,
  onCreateCourse,
  onCreateVideoLesson,
  onEnroll,
  onGradeAssignment,
  onLoadCohortReport,
  onOpenDashboard,
  onSubmitAssignment,
  onSubmitQuiz,
  onUpdateCourse,
}: DashboardPageProps) {
  const navItems: VerticalNavItem[] = [
    { label: 'Admin dashboard', onClick: () => void onOpenDashboard('admin') },
    { label: 'Instructor dashboard', onClick: () => void onOpenDashboard('instructor') },
    { label: 'Student dashboard', onClick: () => void onOpenDashboard('student') },
    ...roleNavItems[user.role],
  ]

  const stats = useMemo(
    () => {
      if (user.role === 'admin') {
        const enrolledStudents = new Set(enrollments.map((enrollment) => enrollment.userId)).size
        const paidRevenue = payments
          .filter((payment) => payment.status === 'paid')
          .reduce((total, payment) => total + payment.amountCents, 0)

        return [
          { label: 'Total courses', value: courses.length.toLocaleString() },
          { label: 'Published courses', value: courses.filter((course) => course.status === 'published').length.toLocaleString() },
          { label: 'Enrolled students', value: enrolledStudents.toLocaleString() },
          { label: 'Active enrollments', value: enrollments.filter((enrollment) => enrollment.status === 'active').length.toLocaleString() },
          { label: 'Payments', value: payments.length.toLocaleString() },
          { label: 'Revenue', value: formatCurrency(paidRevenue) },
        ]
      }

      if (user.role === 'instructor') {
        const authoredCourses = courses.filter((course) => course.instructorId === user.id).length
        return [
          { label: 'Your courses', value: authoredCourses.toLocaleString() },
          { label: 'To grade', value: assignmentSubmissions.filter((item) => item.gradedAt === null).length.toLocaleString() },
          { label: 'Published courses', value: courses.filter((course) => course.status === 'published').length.toLocaleString() },
          { label: 'Draft courses', value: courses.filter((course) => course.status === 'draft').length.toLocaleString() },
        ]
      }

      return [
        { label: 'Available courses', value: courses.length.toLocaleString() },
        { label: 'Your enrollments', value: enrollments.length.toLocaleString() },
        { label: 'Quizzes', value: quizAttempts.length.toLocaleString() },
        { label: 'Assignments', value: assignments.length.toLocaleString() },
      ]
    },
    [assignmentSubmissions, assignments.length, courses, enrollments, payments, quizAttempts.length, user.id, user.role],
  )

  return (
    <PageWithNav>
      <VerticalNav title={`${user.role} navigation`} items={navItems} />
      <HeroSection status={status} user={user} onLogout={onLogout} />
      <StatsGrid id="dashboard-stats" stats={stats} />
      <DashboardContent
        assignmentSubmissions={assignmentSubmissions}
        courses={courses}
        cohortReport={cohortReport}
        enrollments={enrollments}
        payments={payments}
        user={user}
        onCreateCourse={onCreateCourse}
        onCreateVideoLesson={onCreateVideoLesson}
        onEnroll={onEnroll}
        onGradeAssignment={onGradeAssignment}
        onLoadCohortReport={onLoadCohortReport}
        onSubmitAssignment={onSubmitAssignment}
        onSubmitQuiz={onSubmitQuiz}
        onUpdateCourse={onUpdateCourse}
      />
    </PageWithNav>
  )
}
