import styled from 'styled-components'
import type { CohortReportRow } from '../../api/lms'
import { CohortReportPanel } from '../CohortReportPanel'
import { Panel } from '../Panel'
import { StatsGrid } from '../StatsGrid'

type AdminDashboardProps = {
  cohortReport: CohortReportRow[]
  onLoadCohortReport: (input: { from: string; to: string }) => Promise<void>
  totalCourses: number
  publishedCourses: number
  enrolledStudents: number
  activeEnrollments: number
  payments: number
  revenueCents: number
}

const ContentGrid = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
  gap: 24px;
  width: min(var(--page-width), calc(100% - var(--page-gutter)));
  margin: 24px auto 48px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const WidePanel = styled.div`
  grid-column: 1 / -1;
`

export function AdminDashboard({
  cohortReport,
  onLoadCohortReport,
  totalCourses,
  publishedCourses,
  enrolledStudents,
  activeEnrollments,
  payments,
  revenueCents,
}: AdminDashboardProps) {
  const stats = [
    { label: 'Total courses', value: totalCourses.toLocaleString() },
    { label: 'Published courses', value: publishedCourses.toLocaleString() },
    { label: 'Enrolled students', value: enrolledStudents.toLocaleString() },
    { label: 'Active enrollments', value: activeEnrollments.toLocaleString() },
    { label: 'Payments', value: payments.toLocaleString() },
    { label: 'Revenue', value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(revenueCents / 100) },
  ]

  return (
    <ContentGrid>
      <WidePanel id="admin-platform-metrics">
        <StatsGrid stats={stats} />
      </WidePanel>

      <section id="admin-cohort-report">
        <Panel title="Cohort report" meta="platform analytics">
          <CohortReportPanel report={cohortReport} onLoadReport={onLoadCohortReport} />
        </Panel>
      </section>
    </ContentGrid>
  )
}
