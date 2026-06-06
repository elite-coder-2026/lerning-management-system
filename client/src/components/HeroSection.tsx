import styled from 'styled-components'
import heroImage from '../assets/hero.png'

type HeroSectionProps = {
  status: string
}

const HeroBand = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.6fr);
  gap: 32px;
  align-items: end;
  width: min(1180px, calc(100% - 48px));
  max-width: 1180px;
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
    width: min(1180px, calc(100% - 40px));
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

const StatusLabel = styled.span`
  font-size: 13px;
  font-weight: 800;
`

const Status = styled.p`
  margin: 0;
  color: #c8d4e5;
  font-size: 13px;
`

export function HeroSection({ status }: HeroSectionProps) {
  return (
    <HeroBand>
      <div>
        <Eyebrow>Raw PostgreSQL LMS</Eyebrow>
        <Title>Learning management dashboard</Title>
        <Copy>
          Courses, enrollments, payments, quizzes, assignments, and analytics are served by
          repository-owned SQL through node-postgres.
        </Copy>
      </div>
      <StatusPanel>
        <StatusLabel>Course catalog</StatusLabel>
        <Status>{status}</Status>
      </StatusPanel>
    </HeroBand>
  )
}
