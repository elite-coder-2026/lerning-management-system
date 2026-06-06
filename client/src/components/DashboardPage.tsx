import { useMemo } from 'react'
import type { Course } from '../api/lms'
import { DashboardContent } from './DashboardContent'
import { HeroSection } from './HeroSection'
import { StatsGrid } from './StatsGrid'
import { formatCurrency } from '../utils/formatters'

type DashboardPageProps = {
  courses: Course[]
  status: string
}

export function DashboardPage({ courses, status }: DashboardPageProps) {
  const stats = useMemo(
    () => [
      { label: 'Published courses', value: courses.length.toLocaleString() },
      {
        label: 'Average price',
        value: formatCurrency(
          courses.length === 0
            ? 0
            : Math.round(courses.reduce((total, course) => total + course.priceCents, 0) / courses.length),
        ),
      },
      {
        label: 'Free courses',
        value: courses.filter((course) => course.priceCents === 0).length.toLocaleString(),
      },
      {
        label: 'Paid courses',
        value: courses.filter((course) => course.priceCents > 0).length.toLocaleString(),
      },
      { label: 'API status', value: courses.length > 0 ? 'Live' : 'Ready' },
    ],
    [courses],
  )

  return (
    <>
      <HeroSection status={status} />
      <StatsGrid stats={stats} />
      <DashboardContent courses={courses} />
    </>
  )
}
