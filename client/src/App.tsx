import { useEffect, useState } from 'react'
import {
  createCourse,
  currentUser,
  createVideoLesson,
  enrollInCourse,
  fetchAssignmentSubmissions,
  fetchAssignments,
  fetchCohortReport,
  fetchCourses,
  fetchEnrollments,
  fetchPayments,
  fetchQuizAttempts,
  gradeAssignment,
  login,
  register,
  submitAssignment,
  submitQuiz,
  updateCourse,
  type AssignmentGradeItem,
  type AssignmentWork,
  type AuthResult,
  type CohortReportRow,
  type Course,
  type CourseInput,
  type Enrollment,
  type Payment,
  type QuizAttempt,
  type RegisterInput,
  type VideoLesson,
} from './api/lms'
import { DashboardPage } from './components/DashboardPage'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { LearnHubDemo } from './components/LearnHubDemo'
import { PublicHomePage } from './components/PublicHomePage'
import { AppShell } from './layout/AppShell'
import { GlobalStyles } from './styles/GlobalStyles'

const AUTH_STORAGE_KEY = 'rawsql-lms-auth'

const dashboardAccounts = {
  admin: { email: 'admin@example.com', password: 'password123' },
  instructor: { email: 'instructor1@example.com', password: 'password123' },
  student: { email: 'student1@example.com', password: 'password123' },
} satisfies Record<AuthResult['user']['role'], { email: string; password: string }>

function LmsApplication() {
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([])
  const [assignments, setAssignments] = useState<AssignmentWork[]>([])
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<AssignmentGradeItem[]>([])
  const [cohortReport, setCohortReport] = useState<CohortReportRow[]>([])
  const [auth, setAuth] = useState<AuthResult | null>(null)
  const [isSessionLoading, setIsSessionLoading] = useState(() => Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY)))
  const [status, setStatus] = useState('Connect the API to load live LMS data.')
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    fetchCourses({ status: 'published', limit: 50 })
      .then((data) => {
        setCourses(data.courses)
        setStatus(data.courses.length ? 'Published courses loaded.' : 'API is reachable. No published courses yet.')
      })
      .catch(() => setStatus('Start the API on port 4000 to load courses.'))
  }, [])

  useEffect(() => {
    if (!auth) {
      return
    }

    const activityRequests: [
      Promise<{ enrollments: Enrollment[] }>,
      Promise<{ payments: Payment[] }>,
      Promise<{ quizzes: QuizAttempt[] }>,
      Promise<{ assignments: AssignmentWork[] }>,
      Promise<{ submissions: AssignmentGradeItem[] }>,
    ] =
      auth.user.role === 'instructor'
        ? [
            Promise.resolve({ enrollments: [] }),
            Promise.resolve({ payments: [] }),
            Promise.resolve({ quizzes: [] }),
            Promise.resolve({ assignments: [] }),
            fetchAssignmentSubmissions(auth.token),
          ]
        : auth.user.role === 'student'
          ? [
              fetchEnrollments(auth.token),
              fetchPayments(auth.token),
              fetchQuizAttempts(auth.token),
              fetchAssignments(auth.token),
              Promise.resolve({ submissions: [] }),
            ]
          : [
              fetchEnrollments(auth.token),
              fetchPayments(auth.token),
              Promise.resolve({ quizzes: [] }),
              Promise.resolve({ assignments: [] }),
              fetchAssignmentSubmissions(auth.token),
            ]

    Promise.all([fetchCourses({ limit: 100, token: auth.token }), ...activityRequests])
      .then(([data, enrollmentData, paymentData, quizData, assignmentData, submissionData]) => {
        setCourses(data.courses)
        setEnrollments(enrollmentData.enrollments)
        setPayments(paymentData.payments)
        setQuizAttempts(quizData.quizzes)
        setAssignments(assignmentData.assignments)
        setAssignmentSubmissions(submissionData.submissions)
        setStatus(data.courses.length ? 'Course catalog loaded.' : 'API is reachable. No courses yet.')
      })
      .catch(() => setStatus('Start the API on port 4000 to load courses.'))
  }, [auth])

  useEffect(() => {
    const savedAuth = window.localStorage.getItem(AUTH_STORAGE_KEY)

    if (!savedAuth) {
      return
    }

    async function restoreSession() {
      try {
        const parsedAuth = JSON.parse(savedAuth!) as AuthResult
        const result = await currentUser(parsedAuth.token)
        saveAuth({ token: parsedAuth.token, user: result.user })
      } catch {
        clearAuth()
        setStatus('Saved session expired. Sign in again.')
        setLoginError('Saved session expired. Sign in again.')
      } finally {
        setIsSessionLoading(false)
      }
    }

    void restoreSession()
  }, [])

  function saveAuth(nextAuth: AuthResult) {
    setAuth(nextAuth)
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth))
  }

  function clearAuth() {
    setAuth(null)
    setEnrollments([])
    setPayments([])
    setQuizAttempts([])
    setAssignments([])
    setAssignmentSubmissions([])
    setCohortReport([])
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  async function handleLogin(input: { email: string; password: string }) {
    setLoginError('')

    try {
      saveAuth(await login(input))
    } catch {
      setLoginError('Login failed. Check your email and password, then try again.')
    }
  }

  async function handleRegister(input: RegisterInput) {
    saveAuth(await register(input))
  }

  async function handleOpenDashboard(role: AuthResult['user']['role']) {
    setLoginError('')
    saveAuth(await login(dashboardAccounts[role]))
  }

  async function handleCreateCourse(input: CourseInput) {
    if (!auth) {
      return
    }

    const result = await createCourse(input, auth.token)
    setCourses((current) => [result.course, ...current])
    setStatus('Course created.')
  }

  async function handleUpdateCourse(id: string, input: Partial<CourseInput>) {
    if (!auth) {
      return
    }

    const result = await updateCourse(id, input, auth.token)
    setCourses((current) => current.map((course) => (course.id === id ? result.course : course)))
    setStatus('Course updated.')
  }

  async function handleCreateVideoLesson(input: {
    courseId: string;
    moduleTitle: string;
    title: string;
    summary: string;
    videoUrl: string;
    durationMinutes: number;
  }): Promise<VideoLesson | null> {
    if (!auth) {
      return null
    }

    const result = await createVideoLesson(input, auth.token)
    setStatus('Video lesson created.')
    return result.lesson
  }

  async function handleEnroll(courseId: string) {
    if (!auth) {
      return
    }

    const result = await enrollInCourse(courseId, auth.token)
    setEnrollments((current) => {
      const existing = current.some((enrollment) => enrollment.id === result.enrollment.id)
      return existing
        ? current.map((enrollment) => (enrollment.id === result.enrollment.id ? result.enrollment : enrollment))
        : [result.enrollment, ...current]
    })
    setStatus('Enrollment created.')
  }

  async function handleLoadCohortReport(input: { from: string; to: string }) {
    if (!auth) {
      return
    }

    const result = await fetchCohortReport(input, auth.token)
    setCohortReport(result.report)
    setStatus('Cohort report loaded.')
  }

  async function handleSubmitQuiz(input: { quizId: string; answers: Array<{ questionId: string; selectedOptionId: string }> }) {
    if (!auth) {
      return
    }

    const result = await submitQuiz(input, auth.token)
    setQuizAttempts((current) =>
      current.map((quiz) => (quiz.id === result.submission.quizId ? { ...quiz, latestSubmission: result.submission } : quiz)),
    )
    setStatus(result.submission.passed ? 'Quiz passed.' : 'Quiz submitted.')
  }

  async function handleSubmitAssignment(input: { assignmentId: string; content: string }) {
    if (!auth) {
      return
    }

    const result = await submitAssignment(input, auth.token)
    setAssignments((current) =>
      current.map((assignment) =>
        assignment.id === result.submission.assignmentId ? { ...assignment, submission: result.submission } : assignment,
      ),
    )
    setStatus('Assignment submitted.')
  }

  async function handleGradeAssignment(input: { submissionId: string; gradePoints: number; feedback?: string }) {
    if (!auth) {
      return
    }

    const result = await gradeAssignment(input, auth.token)
    setAssignmentSubmissions((current) =>
      current.map((submission) =>
        submission.id === result.submission.id
          ? {
              ...submission,
              content: result.submission.content,
              gradePoints: result.submission.gradePoints,
              feedback: result.submission.feedback,
              gradedBy: result.submission.gradedBy,
              gradedAt: result.submission.gradedAt,
            }
          : submission,
      ),
    )
    setStatus('Assignment graded.')
  }

  if (isSessionLoading) {
    return (
      <>
        <GlobalStyles />
        <AppShell>
          <PublicHomePage
            courses={courses}
            status="Validating saved session..."
            loginError={loginError}
            onLogin={handleLogin}
            onOpenDashboard={handleOpenDashboard}
            onRegister={handleRegister}
          />
        </AppShell>
      </>
    )
  }

  return (
    <>
      <GlobalStyles />
      <AppErrorBoundary>
        <AppShell>
          {auth ? (
            <DashboardPage
              courses={courses}
              assignments={assignments}
              assignmentSubmissions={assignmentSubmissions}
              cohortReport={cohortReport}
              status={status}
              enrollments={enrollments}
              payments={payments}
              quizAttempts={quizAttempts}
              user={auth.user}
              onCreateCourse={handleCreateCourse}
              onCreateVideoLesson={handleCreateVideoLesson}
              onEnroll={handleEnroll}
              onGradeAssignment={handleGradeAssignment}
              onLoadCohortReport={handleLoadCohortReport}
              onLogout={clearAuth}
              onOpenDashboard={handleOpenDashboard}
              onSubmitAssignment={handleSubmitAssignment}
              onSubmitQuiz={handleSubmitQuiz}
              onUpdateCourse={handleUpdateCourse}
            />
          ) : (
            <PublicHomePage
              courses={courses}
              status={status}
              loginError={loginError}
              onLogin={handleLogin}
              onOpenDashboard={handleOpenDashboard}
              onRegister={handleRegister}
            />
          )}
        </AppShell>
      </AppErrorBoundary>
    </>
  )
}

function App() {
  const showExistingApp = new URLSearchParams(window.location.search).get('app') === 'legacy'

  if (showExistingApp) {
    return <LmsApplication />
  }

  return (
    <>
      <GlobalStyles />
      <LearnHubDemo />
    </>
  )
}

export default App
