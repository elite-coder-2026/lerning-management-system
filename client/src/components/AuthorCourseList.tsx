import { useMemo, useState } from 'react'
import styled from 'styled-components'
import type { Course } from '../api/lms'
import { formatCurrency } from '../utils/formatters'

type AuthorCourseListProps = {
  courses: Course[]
  enrolledCourseIds?: Set<string>
  onEnroll?: (courseId: string) => Promise<void>
  onSelectCourse?: (course: Course) => void
}

const Wrapper = styled.div`
  display: grid;
`

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eef2f6;

  @media (max-width: 640px) {
    align-items: stretch;
    flex-direction: column;
  }
`

const Label = styled.label`
  color: #475467;
  font-size: 13px;
  font-weight: 800;
`

const Select = styled.select`
  min-width: 260px;
  border: 1px solid #cfd8e3;
  border-radius: 6px;
  padding: 9px 10px;
  background: #ffffff;
  color: #172033;

  @media (max-width: 640px) {
    min-width: 0;
    width: 100%;
  }
`

const AuthorSummary = styled.span`
  color: #667085;
  font-size: 13px;
  font-weight: 700;
`

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  padding: 20px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const Card = styled.article`
  display: grid;
  overflow: hidden;
  border: 1px solid #e3e9f1;
  border-radius: 8px;
  background: #ffffff;
`

const Thumbnail = styled.div<{ $tone: number }>`
  display: grid;
  min-height: 132px;
  padding: 18px;
  align-content: space-between;
  background:
    linear-gradient(135deg, rgba(15, 79, 143, 0.86), rgba(15, 118, 110, 0.76)),
    radial-gradient(circle at ${({ $tone }) => 20 + $tone * 9}% 24%, rgba(255, 255, 255, 0.32), transparent 26%),
    #17324f;
  color: #ffffff;
`

const ThumbnailKicker = styled.span`
  width: fit-content;
  border-radius: 999px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 12px;
  font-weight: 800;
`

const ThumbnailTitle = styled.strong`
  max-width: 220px;
  font-size: 22px;
  line-height: 1.08;
`

const CardBody = styled.div`
  display: grid;
  gap: 14px;
  padding: 16px;
`

const Title = styled.h3`
  margin: 0;
  color: #172033;
  font-size: 17px;
  line-height: 1.25;
`

const Description = styled.p`
  display: -webkit-box;
  overflow: hidden;
  min-height: 48px;
  margin: 0;
  color: #667085;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`

const Detail = styled.div`
  display: grid;
  gap: 2px;
`

const DetailLabel = styled.span`
  color: #667085;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
`

const DetailValue = styled.span`
  color: #172033;
  font-size: 14px;
  font-weight: 800;
`

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`

const Tag = styled.span`
  border-radius: 999px;
  padding: 4px 8px;
  background: #eef6ff;
  color: #0f4f8f;
  font-size: 12px;
  font-weight: 800;
`

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 2px;
`

const Price = styled.span`
  color: #0f766e;
  font-weight: 900;
`

const Status = styled.span`
  color: #667085;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
`

const CardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const ActionButton = styled.button`
  border: 1px solid #cfd8e3;
  border-radius: 6px;
  padding: 8px 10px;
  background: #ffffff;
  color: #172033;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.56;
  }
`

const PrimaryActionButton = styled(ActionButton)`
  border-color: #0f4f8f;
  background: #0f4f8f;
  color: #ffffff;
`

const tagCandidates = [
  'React',
  'Angular',
  'TypeScript',
  'Node.js',
  'PostgreSQL',
  'Testing',
  'Design Systems',
  'APIs',
]

const sampleAuthorNames: Record<string, string> = {
  'author-maya': 'Maya Chen',
  'author-jordan': 'Jordan Ellis',
}

const sampleCourses: Course[] = [
  {
    id: 'sample-react-dashboard',
    instructorId: 'author-maya',
    title: 'React Dashboard Systems',
    description: 'Build production dashboards with reusable cards, filters, charts, and API-backed course data.',
    priceCents: 12900,
    status: 'published',
    createdAt: new Date('2026-01-08T12:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-08T12:00:00.000Z').toISOString(),
  },
  {
    id: 'sample-angular-foundations',
    instructorId: 'author-maya',
    title: 'Angular Course Foundations',
    description: 'Create structured Angular learning paths with modules, services, route guards, and typed forms.',
    priceCents: 9900,
    status: 'published',
    createdAt: new Date('2026-01-09T12:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-09T12:00:00.000Z').toISOString(),
  },
  {
    id: 'sample-node-postgres',
    instructorId: 'author-jordan',
    title: 'Node.js and PostgreSQL APIs',
    description: 'Design raw SQL repositories, transactions, validation, authentication, and analytics endpoints.',
    priceCents: 14900,
    status: 'published',
    createdAt: new Date('2026-01-10T12:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-10T12:00:00.000Z').toISOString(),
  },
]

function getAuthorLabel(instructorId: string, index: number) {
  if (sampleAuthorNames[instructorId]) {
    return sampleAuthorNames[instructorId]
  }

  return `Author ${index + 1} (${instructorId.slice(0, 8)})`
}

function getCourseSeed(course: Course) {
  return Array.from(course.id).reduce((total, character) => total + character.charCodeAt(0), 0)
}

function getCourseRuntime(course: Course) {
  const seed = getCourseSeed(course)
  const hours = 2 + (seed % 7)
  const minutes = [0, 15, 30, 45][seed % 4]
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
}

function getCourseTags(course: Course) {
  const haystack = `${course.title} ${course.description}`.toLowerCase()
  const matchedTags = tagCandidates.filter((tag) => haystack.includes(tag.toLowerCase()))

  if (matchedTags.length >= 2) {
    return matchedTags.slice(0, 3)
  }

  const seed = getCourseSeed(course)
  const fallbackTags = [
    tagCandidates[seed % tagCandidates.length],
    tagCandidates[(seed + 3) % tagCandidates.length],
    tagCandidates[(seed + 5) % tagCandidates.length],
  ]

  return Array.from(new Set([...matchedTags, ...fallbackTags])).slice(0, 3)
}

export function AuthorCourseList({ courses, enrolledCourseIds, onEnroll, onSelectCourse }: AuthorCourseListProps) {
  const displayCourses = courses.length > 0 ? courses : sampleCourses

  const authors = useMemo(() => {
    const uniqueIds = Array.from(new Set(displayCourses.map((course) => course.instructorId)))
    return uniqueIds.map((instructorId, index) => ({
      instructorId,
      label: getAuthorLabel(instructorId, index),
    }))
  }, [displayCourses])

  const [selectedAuthorId, setSelectedAuthorId] = useState('')
  const activeAuthorId = selectedAuthorId || authors[0]?.instructorId || ''
  const authorCourses = displayCourses.filter((course) => course.instructorId === activeAuthorId)
  const activeAuthor = authors.find((author) => author.instructorId === activeAuthorId)

  return (
    <Wrapper>
      <Toolbar>
        <div>
          <Label htmlFor="author-course-filter">Author</Label>
          <Select
            id="author-course-filter"
            value={activeAuthorId}
            onChange={(event) => setSelectedAuthorId(event.target.value)}
          >
            {authors.map((author) => (
              <option key={author.instructorId} value={author.instructorId}>
                {author.label}
              </option>
            ))}
          </Select>
        </div>
        <AuthorSummary>
          {authorCourses.length} {authorCourses.length === 1 ? 'course' : 'courses'}
        </AuthorSummary>
      </Toolbar>

      <CardGrid aria-label={activeAuthor ? `${activeAuthor.label} courses` : 'Author courses'}>
        {authorCourses.map((course) => (
          <Card key={course.id}>
            <Thumbnail $tone={getCourseSeed(course) % 8}>
              <ThumbnailKicker>{getCourseTags(course)[0]}</ThumbnailKicker>
              <ThumbnailTitle>{course.title}</ThumbnailTitle>
            </Thumbnail>
            <CardBody>
              <Title>{course.title}</Title>
              <Description>{course.description}</Description>
              <DetailGrid>
                <Detail>
                  <DetailLabel>Running time</DetailLabel>
                  <DetailValue>{getCourseRuntime(course)}</DetailValue>
                </Detail>
                <Detail>
                  <DetailLabel>Author</DetailLabel>
                  <DetailValue>{activeAuthor?.label ?? 'Author'}</DetailValue>
                </Detail>
              </DetailGrid>
              <TagList>
                {getCourseTags(course).map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </TagList>
              <Footer>
                <Price>{formatCurrency(course.priceCents)}</Price>
                <Status>{course.status}</Status>
              </Footer>
              {onSelectCourse || onEnroll ? (
                <CardActions>
                  {onSelectCourse ? (
                    <ActionButton type="button" onClick={() => onSelectCourse(course)}>
                      Details
                    </ActionButton>
                  ) : null}
                  {onEnroll ? (
                    <PrimaryActionButton
                      type="button"
                      disabled={enrolledCourseIds?.has(course.id)}
                      onClick={() => onEnroll(course.id)}
                    >
                      {enrolledCourseIds?.has(course.id) ? 'Enrolled' : 'Enroll'}
                    </PrimaryActionButton>
                  ) : null}
                </CardActions>
              ) : null}
            </CardBody>
          </Card>
        ))}
      </CardGrid>
    </Wrapper>
  )
}
