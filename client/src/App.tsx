import { useEffect, useState } from 'react'
import {
  createCourse,
  currentUser,
  enrollInCourse,
  fetchCohortReport,
  fetchCourses,
  fetchEnrollments,
  fetchPayments,
  login,
  payForEnrollment,
  register,
  updateCourse,
  type AuthResult,
  type CohortReportRow,
  type Course,
  type CourseInput,
  type Enrollment,
  type Payment,
  type RegisterInput,
} from './api/lms'
import { DashboardPage } from './components/DashboardPage'
import { PublicHomePage } from './components/PublicHomePage'
import { AppShell } from './layout/AppShell'
import { GlobalStyles } from './styles/GlobalStyles'

const AUTH_STORAGE_KEY = 'rawsql-lms-auth'

function App() {
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [cohortReport, setCohortReport] = useState<CohortReportRow[]>([])
  const [auth, setAuth] = useState<AuthResult | null>(null)
  const [isSessionLoading, setIsSessionLoading] = useState(true)
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
    ] =
      auth.user.role === 'instructor'
        ? [Promise.resolve({ enrollments: [] }), Promise.resolve({ payments: [] })]
        : [fetchEnrollments(auth.token), fetchPayments(auth.token)]

    Promise.all([fetchCourses({ limit: 100, token: auth.token }), ...activityRequests])
      .then(([data, enrollmentData, paymentData]) => {
        setCourses(data.courses)
        setEnrollments(enrollmentData.enrollments)
        setPayments(paymentData.payments)
        setStatus(data.courses.length ? 'Course catalog loaded.' : 'API is reachable. No courses yet.')
      })
      .catch(() => setStatus('Start the API on port 4000 to load courses.'))
  }, [auth])

  useEffect(() => {
    const savedAuth = window.localStorage.getItem(AUTH_STORAGE_KEY)

    if (!savedAuth) {
      setIsSessionLoading(false)
      return
    }

    async function restoreSession() {
      try {
        const parsedAuth = JSON.parse(savedAuth!) as AuthResult
        const result = await currentUser(parsedAuth.token)
        saveAuth({ token: parsedAuth.token, user: result.user })
      } catch {
        clearAuth()
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

  async function handlePay(input: { enrollmentId: string; provider: string; providerReference: string }) {
    if (!auth) {
      return
    }

    const result = await payForEnrollment(input, auth.token)
    setPayments((current) => [result.payment, ...current])
    setStatus('Payment recorded.')
  }

  async function handleLoadCohortReport(input: { from: string; to: string }) {
    if (!auth) {
      return
    }

    const result = await fetchCohortReport(input, auth.token)
    setCohortReport(result.report)
    setStatus('Cohort report loaded.')
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
            onRegister={handleRegister}
          />
        </AppShell>
      </>
    )
  }

  return (
    <>
      <GlobalStyles />
      <AppShell>
        {auth ? (
          <DashboardPage
            courses={courses}
            cohortReport={cohortReport}
            status={status}
            enrollments={enrollments}
            payments={payments}
            user={auth.user}
            onCreateCourse={handleCreateCourse}
            onEnroll={handleEnroll}
            onLoadCohortReport={handleLoadCohortReport}
            onLogout={clearAuth}
            onPay={handlePay}
            onUpdateCourse={handleUpdateCourse}
          />
        ) : (
          <PublicHomePage
            courses={courses}
            status={status}
            loginError={loginError}
            onLogin={handleLogin}
            onRegister={handleRegister}
          />
        )}
      </AppShell>
    </>
  )
}

export default App
