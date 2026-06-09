import { useState } from 'react'
import styled from 'styled-components'
import type { Course, Enrollment } from '../../api/lms'
import { AuthorCourseList } from '../AuthorCourseList'
import { CourseDetailPage } from '../CourseDetailPage'
import { Panel } from '../Panel'

type StudentDashboardProps = {
  courses: Course[]
  enrollments: Enrollment[]
  onEnroll: (courseId: string) => Promise<void>
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

export function StudentDashboard({
  courses,
  enrollments,
  onEnroll,
}: StudentDashboardProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(courses[0]?.id ?? null)
  const enrolledCourseIds = new Set(enrollments.map((enrollment) => enrollment.courseId))
  const selectedCourse = selectedCourseId ? (courses.find((course) => course.id === selectedCourseId) ?? null) : null

  function selectCourse(course: Course) {
    setSelectedCourseId(course.id)
  }

  return (
    <ContentGrid>
      <WidePanel id="student-available-courses">
        <Panel title="Available courses" meta="student catalog">
          <AuthorCourseList
            courses={courses}
            enrolledCourseIds={enrolledCourseIds}
            onEnroll={onEnroll}
            onSelectCourse={selectCourse}
          />
        </Panel>
      </WidePanel>

      {selectedCourse ? (
        <WidePanel id="student-course-detail">
          <Panel title="Course detail" meta="student preview">
            <CourseDetailPage
              course={selectedCourse}
              isEnrolled={enrolledCourseIds.has(selectedCourse.id)}
              onClose={() => setSelectedCourseId(null)}
              onEnroll={onEnroll}
            />
          </Panel>
        </WidePanel>
      ) : null}
    </ContentGrid>
  )
}
