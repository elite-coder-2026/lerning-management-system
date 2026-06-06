import { useMemo } from 'react'
import type { AuthUser, CohortReportRow, Course, CourseInput, Enrollment, Payment } from '../api/lms'
import { DashboardContent } from './DashboardContent'
import { HeroSection } from './HeroSection'
import { StatsGrid } from './StatsGrid'
import { formatCurrency } from '../utils/formatters'

type DashboardPageProps = {
  courses: Course[]
  cohortReport: CohortReportRow[]
  enrollments: Enrollment[]
  payments: Payment[]
  status: string
  user: AuthUser
  onLogout: () => void
  onCreateCourse: (input: CourseInput) => Promise<void>
  onEnroll: (courseId: string) => Promise<void>
  onLoadCohortReport: (input: { from: string; to: string }) => Promise<void>
  onPay: (input: { enrollmentId: string; provider: string; providerReference: string }) => Promise<void>
  onUpdateCourse: (id: string, input: Partial<CourseInput>) => Promise<void>
}

export function DashboardPage({
  courses,
  cohortReport,
  enrollments,
  payments,
  status,
  user,
  onLogout,
  onCreateCourse,
  onEnroll,
  onLoadCohortReport,
  onPay,
  onUpdateCourse,
}: DashboardPageProps) {
  const stats = useMemo(
    () => {
      const averagePrice = formatCurrency(
        courses.length === 0
          ? 0
          : Math.round(courses.reduce((total, course) => total + course.priceCents, 0) / courses.length),
      )
      const baseStats = [
        { label: 'Published courses', value: courses.length.toLocaleString() },
        { label: 'Average price', value: averagePrice },
        { label: 'Free courses', value: courses.filter((course) => course.priceCents === 0).length.toLocaleString() },
        { label: 'Paid courses', value: courses.filter((course) => course.priceCents > 0).length.toLocaleString() },
      ]

      if (user.role === 'admin') {
        return [
          ...baseStats,
          { label: 'Enrollments', value: enrollments.length.toLocaleString() },
          { label: 'Payments', value: payments.length.toLocaleString() },
        ]
      }

      if (user.role === 'instructor') {
        const authoredCourses = courses.filter((course) => course.instructorId === user.id).length
        return [
          { label: 'Your courses', value: authoredCourses.toLocaleString() },
          ...baseStats.slice(0, 3),
          { label: 'Workspace', value: 'Instructor' },
        ]
      }

      return [
        { label: 'Available courses', value: courses.length.toLocaleString() },
        { label: 'Your enrollments', value: enrollments.length.toLocaleString() },
        { label: 'Payments', value: payments.length.toLocaleString() },
        { label: 'Free courses', value: courses.filter((course) => course.priceCents === 0).length.toLocaleString() },
      ]
    },
    [courses, enrollments.length, payments.length, user.id, user.role],
  )

  return (
    <>
      <HeroSection status={status} user={user} onLogout={onLogout} />
      <StatsGrid stats={stats} />
      <DashboardContent
        courses={courses}
        cohortReport={cohortReport}
        enrollments={enrollments}
        payments={payments}
        user={user}
        onCreateCourse={onCreateCourse}
        onEnroll={onEnroll}
        onLoadCohortReport={onLoadCohortReport}
        onPay={onPay}
        onUpdateCourse={onUpdateCourse}
      />
    </>
  )
}
