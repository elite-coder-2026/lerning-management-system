import styled from 'styled-components'
import type { AssignmentGradeItem, AuthUser, Course, CourseInput, VideoLesson } from '../../api/lms'
import { CourseDetailPage } from '../CourseDetailPage'
import { LearningWorkflowPanel } from '../LearningWorkflowPanel'
import { Panel } from '../Panel'
import { InstructorCourseStudio } from './InstructorCourseStudio'

type InstructorDashboardProps = {
  assignmentSubmissions: AssignmentGradeItem[]
  courses: Course[]
  user: AuthUser
  onCreateCourse: (input: CourseInput) => Promise<void>
  onCreateVideoLesson: (input: {
    courseId: string;
    moduleTitle: string;
    title: string;
    summary: string;
    videoUrl: string;
    durationMinutes: number;
  }) => Promise<VideoLesson | null>
  onGradeAssignment: (input: { submissionId: string; gradePoints: number; feedback?: string }) => Promise<void>
  onSubmitAssignment: (input: { assignmentId: string; content: string }) => Promise<void>
  onSubmitQuiz: (input: { quizId: string; answers: Array<{ questionId: string; selectedOptionId: string }> }) => Promise<void>
  onUpdateCourse: (id: string, input: Partial<CourseInput>) => Promise<void>
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

export function InstructorDashboard({
  assignmentSubmissions,
  courses,
  user,
  onCreateCourse,
  onCreateVideoLesson,
  onGradeAssignment,
  onSubmitAssignment,
  onSubmitQuiz,
  onUpdateCourse,
}: InstructorDashboardProps) {
  const instructorCourses = courses.filter((course) => course.instructorId === user.id)
  const selectedCourse = instructorCourses[0] ?? courses[0] ?? null

  return (
    <ContentGrid>
      <WidePanel id="instructor-course-management">
        <InstructorCourseStudio
          courses={courses}
          userId={user.id}
          onCreateCourse={onCreateCourse}
          onCreateVideoLesson={onCreateVideoLesson}
          onUpdateCourse={onUpdateCourse}
        />
      </WidePanel>

      <WidePanel id="instructor-assignment-grading">
        <Panel title="Assignment grading" meta="instructor review">
          <LearningWorkflowPanel
            assignments={[]}
            assignmentSubmissions={assignmentSubmissions}
            quizAttempts={[]}
            user={user}
            onGradeAssignment={onGradeAssignment}
            onSubmitAssignment={onSubmitAssignment}
            onSubmitQuiz={onSubmitQuiz}
          />
        </Panel>
      </WidePanel>

      {selectedCourse ? (
        <WidePanel id="instructor-course-detail">
          <Panel title="Course detail" meta="instructor view">
            <CourseDetailPage course={selectedCourse} />
          </Panel>
        </WidePanel>
      ) : null}
    </ContentGrid>
  )
}
