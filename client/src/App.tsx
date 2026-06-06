import { useEffect, useState } from 'react'
import { fetchCourses, login, register, type AuthResult, type Course, type RegisterInput } from './api/lms'
import { DashboardPage } from './components/DashboardPage'
import { PublicHomePage } from './components/PublicHomePage'
import { AppShell } from './layout/AppShell'
import { GlobalStyles } from './styles/GlobalStyles'

const AUTH_STORAGE_KEY = 'rawsql-lms-auth'

function App() {
  const [courses, setCourses] = useState<Course[]>([])
  const [auth, setAuth] = useState<AuthResult | null>(() => {
    const savedAuth = window.localStorage.getItem(AUTH_STORAGE_KEY)

    if (!savedAuth) {
      return null
    }

    try {
      return JSON.parse(savedAuth) as AuthResult
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
  })
  const [status, setStatus] = useState('Connect the API to load live LMS data.')
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    fetchCourses()
      .then((data) => {
        setCourses(data.courses)
        setStatus(data.courses.length ? 'Published courses loaded.' : 'API is reachable. No published courses yet.')
      })
      .catch(() => setStatus('Start the API on port 4000 to load courses.'))
  }, [])

  function saveAuth(nextAuth: AuthResult) {
    setAuth(nextAuth)
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth))
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

  return (
    <>
      <GlobalStyles />
      <AppShell>
        {auth ? (
          <DashboardPage courses={courses} status={status} />
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
