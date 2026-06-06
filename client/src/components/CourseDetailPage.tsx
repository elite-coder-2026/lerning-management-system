import styled from 'styled-components'
import type { Course } from '../api/lms'
import { formatCurrency } from '../utils/formatters'

type CourseDetailPageProps = {
  course: Course
  isEnrolled?: boolean
  onEnroll?: (courseId: string) => Promise<void>
  onClose?: () => void
}

const Detail = styled.article`
  display: grid;
  gap: 18px;
  padding: 20px;
`

const Header = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`

const TitleGroup = styled.div`
  display: grid;
  gap: 8px;
`

const Title = styled.h3`
  margin: 0;
  color: #172033;
  font-size: 24px;
  line-height: 1.15;
`

const Description = styled.p`
  max-width: 760px;
  margin: 0;
  color: #667085;
`

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 820px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

const Meta = styled.div`
  display: grid;
  gap: 4px;
  border: 1px solid #e3e9f1;
  border-radius: 8px;
  padding: 12px;
  background: #f8fafc;
`

const Label = styled.span`
  color: #667085;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
`

const Value = styled.span`
  color: #172033;
  font-weight: 900;
`

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const Section = styled.section`
  display: grid;
  gap: 8px;
  border: 1px solid #e3e9f1;
  border-radius: 8px;
  padding: 14px;
`

const SectionTitle = styled.h4`
  margin: 0;
  color: #172033;
  font-size: 15px;
`

const SectionCopy = styled.p`
  margin: 0;
  color: #667085;
  font-size: 13px;
`

const CloseButton = styled.button`
  border: 1px solid #cfd8e3;
  border-radius: 6px;
  padding: 9px 12px;
  background: #ffffff;
  color: #172033;
  font-weight: 900;
  cursor: pointer;
`

const PrimaryButton = styled(CloseButton)`
  border-color: #0f4f8f;
  background: #0f4f8f;
  color: #ffffff;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.56;
  }
`

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

const courseSections = [
  {
    title: 'Modules',
    copy: 'Organize this course into structured units for topic progression.',
  },
  {
    title: 'Lessons',
    copy: 'Add lesson material, exercises, and instructor notes inside modules.',
  },
  {
    title: 'Quizzes',
    copy: 'Attach scored checks that validate learner comprehension.',
  },
  {
    title: 'Assignments',
    copy: 'Collect submissions for instructor review and grading.',
  },
]

export function CourseDetailPage({ course, isEnrolled, onEnroll, onClose }: CourseDetailPageProps) {
  return (
    <Detail>
      <Header>
        <TitleGroup>
          <Title>{course.title}</Title>
          <Description>{course.description}</Description>
        </TitleGroup>
        <ActionRow>
          {onEnroll ? (
            <PrimaryButton type="button" disabled={isEnrolled} onClick={() => onEnroll(course.id)}>
              {isEnrolled ? 'Enrolled' : 'Enroll'}
            </PrimaryButton>
          ) : null}
          {onClose ? (
            <CloseButton type="button" onClick={onClose}>
              Close
            </CloseButton>
          ) : null}
        </ActionRow>
      </Header>

      <MetaGrid>
        <Meta>
          <Label>Status</Label>
          <Value>{course.status}</Value>
        </Meta>
        <Meta>
          <Label>Price</Label>
          <Value>{formatCurrency(course.priceCents)}</Value>
        </Meta>
        <Meta>
          <Label>Created</Label>
          <Value>{new Date(course.createdAt).toLocaleDateString()}</Value>
        </Meta>
        <Meta>
          <Label>Updated</Label>
          <Value>{new Date(course.updatedAt).toLocaleDateString()}</Value>
        </Meta>
      </MetaGrid>

      <SectionGrid>
        {courseSections.map((section) => (
          <Section key={section.title}>
            <SectionTitle>{section.title}</SectionTitle>
            <SectionCopy>{section.copy}</SectionCopy>
          </Section>
        ))}
      </SectionGrid>
    </Detail>
  )
}
