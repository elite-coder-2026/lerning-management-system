import styled from 'styled-components'
import type { AuthUser } from '../api/lms'
import heroImage from '../assets/hero.png'

type HeroSectionProps = {
  status: string
  user: AuthUser
  onLogout: () => void
}

const roleCopy: Record<AuthUser['role'], { eyebrow: string; title: string; copy: string }> = {
  admin: {
    eyebrow: 'Admin workspace',
    title: 'Manage the full learning platform.',
    copy: 'Review catalog health, enrollment activity, payments, learning submissions, and analytics from one operational view.',
  },
  instructor: {
    eyebrow: 'Instructor workspace',
    title: 'Manage courses and learner progress.',
    copy: 'Track your published courses, review enrollments, grade assignments, and monitor quiz performance.',
  },
  student: {
    eyebrow: 'Student workspace',
    title: 'Continue your learning path.',
    copy: 'Browse available courses, manage enrollments, complete quizzes, submit assignments, and track progress.',
  },
}

const HeroBand = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.6fr);
  gap: 32px;
  align-items: end;
  width: min(var(--page-width), calc(100% - var(--page-gutter)));
  margin: 24px auto 0;
  padding: 48px;
  overflow: hidden;
  border-radius: 8px;
  background:
    linear-gradient(rgba(16, 24, 40, 0.58), rgba(16, 24, 40, 0.76)),
    url(${heroImage}) center / cover;
  color: #ffffff;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    padding: 32px 20px;
  }
`

const Eyebrow = styled.p`
  margin: 0 0 12px;
  color: #b9d6ff;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`

const Title = styled.h1`
  max-width: 780px;
  margin: 0;
  color: #ffffff;
  font-size: 48px;
  line-height: 1.02;

  @media (max-width: 900px) {
    font-size: 36px;
  }
`

const Copy = styled.p`
  max-width: 680px;
  margin: 20px 0 0;
  color: #e8eef8;
  font-size: 18px;
`

const StatusPanel = styled.div`
  display: grid;
  gap: 10px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 8px;
  background: rgba(11, 18, 32, 0.72);
`

const UserPanel = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
`

const UserMeta = styled.div`
  display: grid;
  gap: 3px;
`

const StatusLabel = styled.span`
  font-size: 13px;
  font-weight: 800;
`

const Status = styled.p`
  margin: 0;
  color: #c8d4e5;
  font-size: 13px;
`

const LogoutButton = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 6px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-weight: 900;
  cursor: pointer;
`

export function HeroSection({ status, user, onLogout }: HeroSectionProps) {
  const content = roleCopy[user.role]

  return (
    <HeroBand id="workspace">
      <div>
        <Eyebrow>{content.eyebrow}</Eyebrow>
        <Title>{content.title}</Title>
        <Copy>{content.copy}</Copy>
      </div>
      <StatusPanel>
        <UserPanel>
          <UserMeta>
            <StatusLabel>{user.fullName}</StatusLabel>
            <Status>{user.email}</Status>
          </UserMeta>
          <LogoutButton type="button" onClick={onLogout}>
            Logout
          </LogoutButton>
        </UserPanel>
        <StatusLabel>Course catalog</StatusLabel>
        <Status>{status}</Status>
      </StatusPanel>
    </HeroBand>
  )
}
