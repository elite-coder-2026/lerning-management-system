import styled from 'styled-components'
import type { Course } from '../api/lms'
import { AuthorCourseList } from './AuthorCourseList'
import { CourseList } from './CourseList'
import { Panel } from './Panel'
import { WorkflowEndpoints } from './WorkflowEndpoints'

type DashboardContentProps = {
  courses: Course[]
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

export function DashboardContent({ courses }: DashboardContentProps) {
  return (
    <ContentGrid>
      <WidePanel>
        <Panel title="Author courses" meta="filtered by instructor">
          <AuthorCourseList courses={courses} />
        </Panel>
      </WidePanel>

      <Panel title="Published courses" meta={`${courses.length} loaded`}>
        <CourseList courses={courses} />
      </Panel>

      <Panel title="Workflow endpoints" meta="transactional">
        <WorkflowEndpoints />
      </Panel>
    </ContentGrid>
  )
}
