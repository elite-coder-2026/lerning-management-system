import type {
  AssignmentGradeItem,
  AuthUser,
  CohortReportRow,
  Course,
  CourseInput,
  Enrollment,
  Payment,
  VideoLesson,
} from '../api/lms'
import { AdminDashboard } from './instructure/AdminDashboard'
import { InstructorDashboard } from './instructure/InstructorDashboard'
import { StudentDashboard } from './user/StudentDashboard'

type DashboardContentProps = {
  assignmentSubmissions: AssignmentGradeItem[]
  courses: Course[]
  cohortReport: CohortReportRow[]
  enrollments: Enrollment[]
  payments: Payment[]
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
  onEnroll: (courseId: string) => Promise<void>
  onGradeAssignment: (input: { submissionId: string; gradePoints: number; feedback?: string }) => Promise<void>
  onLoadCohortReport: (input: { from: string; to: string }) => Promise<void>
  onSubmitAssignment: (input: { assignmentId: string; content: string }) => Promise<void>
  onSubmitQuiz: (input: { quizId: string; answers: Array<{ questionId: string; selectedOptionId: string }> }) => Promise<void>
  onUpdateCourse: (id: string, input: Partial<CourseInput>) => Promise<void>
}

export function DashboardContent({
  assignmentSubmissions,
  courses,
  cohortReport,
  enrollments,
  payments,
  user,
  onCreateCourse,
  onCreateVideoLesson,
  onEnroll,
  onGradeAssignment,
  onLoadCohortReport,
  onSubmitAssignment,
  onSubmitQuiz,
  onUpdateCourse,
}: DashboardContentProps) {
  if (user.role === 'student') {
    return (
      <StudentDashboard
        courses={courses}
        enrollments={enrollments}
        onEnroll={onEnroll}
      />
    )
  }

  if (user.role === 'instructor') {
    return (
      <InstructorDashboard
        assignmentSubmissions={assignmentSubmissions}
        courses={courses}
        user={user}
        onCreateCourse={onCreateCourse}
        onCreateVideoLesson={onCreateVideoLesson}
        onGradeAssignment={onGradeAssignment}
        onSubmitAssignment={onSubmitAssignment}
        onSubmitQuiz={onSubmitQuiz}
        onUpdateCourse={onUpdateCourse}
      />
    )
  }

  return (
    <AdminDashboard
      cohortReport={cohortReport}
      onLoadCohortReport={onLoadCohortReport}
      totalCourses={courses.length}
      publishedCourses={courses.filter((course) => course.status === 'published').length}
      enrolledStudents={new Set(enrollments.map((enrollment) => enrollment.userId)).size}
      activeEnrollments={enrollments.filter((enrollment) => enrollment.status === 'active').length}
      payments={payments.length}
      revenueCents={payments.filter((payment) => payment.status === 'paid').reduce((total, payment) => total + payment.amountCents, 0)}
    />
  )
}
