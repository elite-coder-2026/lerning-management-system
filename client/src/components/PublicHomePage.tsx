import { useState } from 'react'
import styled from 'styled-components'
import type { Course, RegisterInput } from '../api/lms'
import { AuthorCourseList } from './AuthorCourseList'

type PublicHomePageProps = {
  courses: Course[]
  status: string
  loginError: string
  onLogin: (input: { email: string; password: string }) => Promise<void>
  onRegister: (input: RegisterInput) => Promise<void>
}

const Page = styled.main`
  min-height: 100vh;
  background: #f6f8fb;
`

const Header = styled.header`
  width: min(1180px, calc(100% - 48px));
  max-width: 1180px;
  margin: 0 auto;
  padding: 22px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  @media (max-width: 720px) {
    width: min(1180px, calc(100% - 40px));
    align-items: flex-start;
    flex-direction: column;
  }
`

const Brand = styled.div`
  display: grid;
  gap: 2px;
`

const BrandName = styled.strong`
  color: #111827;
  font-size: 20px;
`

const BrandMeta = styled.span`
  color: #667085;
  font-size: 13px;
  font-weight: 700;
`

const Nav = styled.nav`
  display: flex;
  gap: 10px;
  align-items: center;
`

const NavLink = styled.a`
  color: #475467;
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
`

const NavTextButton = styled.button`
  border: 0;
  padding: 0;
  background: transparent;
  color: #475467;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
`

const NavButton = styled.button`
  border: 0;
  border-radius: 6px;
  padding: 8px 12px;
  background: #0f4f8f;
  color: #ffffff;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
`

const Hero = styled.section`
  display: block;
  width: min(1180px, calc(100% - 48px));
  max-width: 1180px;
  margin: 0 auto;
  padding: 56px 0 32px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    width: min(1180px, calc(100% - 40px));
    padding-top: 28px;
  }
`

const Eyebrow = styled.p`
  margin: 0 0 14px;
  color: #0f766e;
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`

const Title = styled.h1`
  max-width: 720px;
  margin: 0;
  color: #111827;
  font-size: 56px;
  line-height: 1.02;

  @media (max-width: 900px) {
    font-size: 40px;
  }
`

const Copy = styled.p`
  max-width: 640px;
  margin: 20px 0 0;
  color: #667085;
  font-size: 18px;
`

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
`

const PrimaryButton = styled.button`
  border: 0;
  border-radius: 6px;
  padding: 11px 16px;
  background: #0f4f8f;
  color: #ffffff;
  font-weight: 900;
  cursor: pointer;
`

const PrimaryAction = styled.button`
  border: 0;
  border-radius: 6px;
  padding: 11px 16px;
  background: #0f4f8f;
  color: #ffffff;
  font-weight: 900;
  cursor: pointer;
`

const SecondaryButton = styled.a`
  border: 1px solid #cfd8e3;
  border-radius: 6px;
  padding: 10px 16px;
  background: #ffffff;
  color: #172033;
  font-weight: 900;
  text-decoration: none;
`

const Field = styled.label`
  display: grid;
  gap: 6px;
  color: #475467;
  font-size: 13px;
  font-weight: 800;
`

const Input = styled.input`
  border: 1px solid #cfd8e3;
  border-radius: 6px;
  padding: 10px 12px;
  color: #172033;
`

const Status = styled.p`
  margin: 0;
  color: #667085;
  font-size: 13px;
`

const ErrorMessage = styled.p`
  margin: 0;
  color: #b42318;
  font-size: 13px;
  font-weight: 800;
`

const Section = styled.section`
  width: min(1180px, calc(100% - 48px));
  max-width: 1180px;
  margin: 0 auto;
  padding: 24px 0 56px;

  @media (max-width: 900px) {
    width: min(1180px, calc(100% - 40px));
  }
`

const SectionHeading = styled.div`
  margin-bottom: 16px;
`

const SectionTitle = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 28px;
`

const SectionCopy = styled.p`
  margin: 6px 0 0;
  color: #667085;
`

const CoursePreview = styled.div`
  overflow: hidden;
  border: 1px solid #d8e0ea;
  border-radius: 8px;
  background: #ffffff;
`

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.56);
`

const ModalCard = styled.form`
  width: min(100%, 480px);
  display: grid;
  gap: 16px;
  border-radius: 8px;
  padding: 24px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24);
`

const ModalHeader = styled.div`
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
`

const ModalTitle = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 24px;
`

const ModalCopy = styled.p`
  margin: 6px 0 0;
  color: #667085;
`

const CloseButton = styled.button`
  border: 0;
  border-radius: 6px;
  padding: 6px 10px;
  background: #eef2f6;
  color: #172033;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
`

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
`

const GhostButton = styled.button`
  border: 1px solid #cfd8e3;
  border-radius: 6px;
  padding: 10px 14px;
  background: #ffffff;
  color: #172033;
  font-weight: 900;
  cursor: pointer;
`

export function PublicHomePage({ courses, status, loginError, onLogin, onRegister }: PublicHomePageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  const [registerError, setRegisterError] = useState('')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void onLogin({ email, password })
  }

  async function handleRegisterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('Passwords do not match.')
      return
    }

    setRegisterError('')

    try {
      await onRegister({
        email: registerEmail,
        password: registerPassword,
        fullName: registerName,
        role: 'student',
      })
      setIsRegisterOpen(false)
    } catch {
      setRegisterError('Registration failed. Check your details and try again.')
    }
  }

  return (
    <Page>
      <Header>
        <Brand>
          <BrandName>RawSQL LMS</BrandName>
          <BrandMeta>PostgreSQL powered learning</BrandMeta>
        </Brand>
        <Nav aria-label="Main navigation">
          <NavLink href="#courses">Courses</NavLink>
          <NavTextButton type="button" onClick={() => setIsLoginOpen(true)}>
            Login
          </NavTextButton>
          <NavButton type="button" onClick={() => setIsRegisterOpen(true)}>
            Register
          </NavButton>
        </Nav>
      </Header>

      <Hero>
        <div>
          <Eyebrow>Learn modern app development</Eyebrow>
          <Title>Courses built for working developers and technical teams.</Title>
          <Copy>
            Browse practical courses by author, topic, runtime, and stack. Sign in to manage enrollments,
            payments, quiz submissions, assignments, and reporting.
          </Copy>
          <ActionRow>
            <PrimaryAction type="button" onClick={() => setIsLoginOpen(true)}>
              Sign in to dashboard
            </PrimaryAction>
            <SecondaryButton href="#courses">Browse courses</SecondaryButton>
          </ActionRow>
        </div>
      </Hero>

      <Section id="courses">
        <SectionHeading>
          <SectionTitle>Author courses</SectionTitle>
          <SectionCopy>Preview course cards before signing in.</SectionCopy>
        </SectionHeading>
        <CoursePreview>
          <AuthorCourseList courses={courses} />
        </CoursePreview>
      </Section>

      {isLoginOpen ? (
        <ModalOverlay
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsLoginOpen(false)
            }
          }}
        >
          <ModalCard aria-labelledby="login-title" onSubmit={handleSubmit}>
            <ModalHeader>
              <div>
                <ModalTitle id="login-title">Member login</ModalTitle>
                <ModalCopy>Sign in to manage courses, enrollments, assignments, and reports.</ModalCopy>
              </div>
              <CloseButton type="button" aria-label="Close login modal" onClick={() => setIsLoginOpen(false)}>
                ×
              </CloseButton>
            </ModalHeader>

            <Field>
              Email
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="student@example.com"
                required
              />
            </Field>
            <Field>
              Password
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </Field>

            <ModalActions>
              <GhostButton type="button" onClick={() => setIsLoginOpen(false)}>
                Cancel
              </GhostButton>
              <PrimaryButton type="submit">Continue</PrimaryButton>
            </ModalActions>
            {loginError ? <ErrorMessage>{loginError}</ErrorMessage> : null}
            <Status>{status}</Status>
          </ModalCard>
        </ModalOverlay>
      ) : null}

      {isRegisterOpen ? (
        <ModalOverlay
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsRegisterOpen(false)
            }
          }}
        >
          <ModalCard aria-labelledby="register-title" onSubmit={handleRegisterSubmit}>
            <ModalHeader>
              <div>
                <ModalTitle id="register-title">Create an account</ModalTitle>
                <ModalCopy>Register as a student to start tracking courses and assignments.</ModalCopy>
              </div>
              <CloseButton type="button" aria-label="Close register modal" onClick={() => setIsRegisterOpen(false)}>
                ×
              </CloseButton>
            </ModalHeader>

            <Field>
              Full name
              <Input
                type="text"
                value={registerName}
                onChange={(event) => setRegisterName(event.target.value)}
                placeholder="Alex Morgan"
                required
              />
            </Field>
            <Field>
              Email
              <Input
                type="email"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                placeholder="alex@example.com"
                required
              />
            </Field>
            <Field>
              Password
              <Input
                type="password"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </Field>
            <Field>
              Confirm password
              <Input
                type="password"
                value={registerConfirmPassword}
                onChange={(event) => setRegisterConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                minLength={8}
                required
              />
            </Field>

            <ModalActions>
              <GhostButton type="button" onClick={() => setIsRegisterOpen(false)}>
                Cancel
              </GhostButton>
              <PrimaryButton type="submit">Create account</PrimaryButton>
            </ModalActions>
            {registerError ? <ErrorMessage>{registerError}</ErrorMessage> : null}
          </ModalCard>
        </ModalOverlay>
      ) : null}
    </Page>
  )
}
