import styled from 'styled-components'
import type { Course } from '../api/lms'
import { formatCurrency } from '../utils/formatters'

type CourseListProps = {
  courses: Course[]
  onSelectCourse?: (course: Course) => void
}

const List = styled.div`
  display: grid;
`

const EmptyState = styled.p`
  margin: 0;
  padding: 24px 20px;
  color: #667085;
`

const Row = styled.article`
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 18px 20px;
  border-bottom: 1px solid #eef2f6;

  &:last-child {
    border-bottom: 0;
  }
`

const DetailButton = styled.button`
  border: 1px solid #cfd8e3;
  border-radius: 6px;
  padding: 8px 10px;
  background: #ffffff;
  color: #172033;
  font-weight: 900;
  cursor: pointer;
`

const CourseTitle = styled.h3`
  margin: 0 0 6px;
  color: #172033;
  font-size: 16px;
`

const CourseDescription = styled.p`
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: #667085;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`

const Price = styled.span`
  flex: 0 0 auto;
  color: #0f766e;
  font-weight: 800;
`

export function CourseList({ courses, onSelectCourse }: CourseListProps) {
  if (courses.length === 0) {
    return (
      <List>
        <EmptyState>No courses returned yet. Create one as an instructor and publish it.</EmptyState>
      </List>
    )
  }

  return (
    <List>
      {courses.map((course) => (
        <Row key={course.id}>
          <div>
            <CourseTitle>{course.title}</CourseTitle>
            <CourseDescription>{course.description}</CourseDescription>
          </div>
          {onSelectCourse ? (
            <DetailButton type="button" onClick={() => onSelectCourse(course)}>
              Details
            </DetailButton>
          ) : (
            <Price>{formatCurrency(course.priceCents)}</Price>
          )}
        </Row>
      ))}
    </List>
  )
}
