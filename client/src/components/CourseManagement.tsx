import { useEffect, useState } from 'react'
import styled from 'styled-components'
import type { AuthUser, Course, CourseInput, CourseStatus } from '../api/lms'
import { formatCurrency } from '../utils/formatters'

type CourseManagementProps = {
  courses: Course[]
  user: AuthUser
  selectedCourseId?: string
  onSelectCourse: (course: Course) => void
  onCreateCourse: (input: CourseInput) => Promise<void>
  onUpdateCourse: (id: string, input: Partial<CourseInput>) => Promise<void>
}

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: minmax(300px, 0.85fr) minmax(0, 1.15fr);
  gap: 0;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`

const Form = styled.form`
  display: grid;
  gap: 12px;
  padding: 18px 20px;
  border-right: 1px solid #e7edf4;

  @media (max-width: 980px) {
    border-right: 0;
    border-bottom: 1px solid #e7edf4;
  }
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

const Textarea = styled.textarea`
  min-height: 112px;
  resize: vertical;
  border: 1px solid #cfd8e3;
  border-radius: 6px;
  padding: 10px 12px;
  color: #172033;
`

const Select = styled.select`
  border: 1px solid #cfd8e3;
  border-radius: 6px;
  padding: 10px 12px;
  background: #ffffff;
  color: #172033;
`

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

const Button = styled.button`
  border: 1px solid #cfd8e3;
  border-radius: 6px;
  padding: 9px 12px;
  background: #ffffff;
  color: #172033;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.56;
  }
`

const PrimaryButton = styled(Button)`
  border-color: #0f4f8f;
  background: #0f4f8f;
  color: #ffffff;
`

const CourseRows = styled.div`
  display: grid;
`

const CourseRow = styled.article<{ $active: boolean }>`
  display: grid;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid #eef2f6;
  background: ${({ $active }) => ($active ? '#f4f8fc' : '#ffffff')};

  &:last-child {
    border-bottom: 0;
  }
`

const RowHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
`

const Title = styled.h3`
  margin: 0 0 4px;
  color: #172033;
  font-size: 16px;
`

const Meta = styled.p`
  margin: 0;
  color: #667085;
  font-size: 13px;
`

const Badge = styled.span`
  width: fit-content;
  border-radius: 999px;
  padding: 4px 8px;
  background: #eef6ff;
  color: #0f4f8f;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
`

const ErrorMessage = styled.p`
  margin: 0;
  color: #b42318;
  font-size: 13px;
  font-weight: 800;
`

const EmptyState = styled.p`
  margin: 0;
  padding: 20px;
  color: #667085;
`

const blankInput: CourseInput = {
  title: '',
  description: '',
  priceCents: 0,
  status: 'draft',
}

function toFormInput(course: Course): CourseInput {
  return {
    title: course.title,
    description: course.description,
    priceCents: course.priceCents,
    status: course.status,
  }
}

export function CourseManagement({
  courses,
  user,
  selectedCourseId,
  onSelectCourse,
  onCreateCourse,
  onUpdateCourse,
}: CourseManagementProps) {
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [formInput, setFormInput] = useState<CourseInput>(blankInput)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const editableCourses = user.role === 'instructor' ? courses.filter((course) => course.instructorId === user.id) : courses
  const editingCourse = editableCourses.find((course) => course.id === editingCourseId)

  useEffect(() => {
    if (editingCourse) {
      setFormInput(toFormInput(editingCourse))
    }
  }, [editingCourse])

  function resetForm() {
    setEditingCourseId(null)
    setFormInput(blankInput)
    setError('')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      if (editingCourseId) {
        await onUpdateCourse(editingCourseId, formInput)
      } else {
        await onCreateCourse(formInput)
      }

      resetForm()
    } catch {
      setError('Course could not be saved. Check the details and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function updateStatus(course: Course, status: CourseStatus) {
    setError('')
    try {
      await onUpdateCourse(course.id, { status })
    } catch {
      setError('Course status could not be updated.')
    }
  }

  return (
    <Wrapper>
      <Form onSubmit={handleSubmit}>
        <Field>
          Title
          <Input
            value={formInput.title}
            onChange={(event) => setFormInput((current) => ({ ...current, title: event.target.value }))}
            required
          />
        </Field>
        <Field>
          Description
          <Textarea
            value={formInput.description}
            onChange={(event) => setFormInput((current) => ({ ...current, description: event.target.value }))}
            required
          />
        </Field>
        <Field>
          Price
          <Input
            min={0}
            step={1}
            type="number"
            value={Math.round(formInput.priceCents / 100)}
            onChange={(event) =>
              setFormInput((current) => ({ ...current, priceCents: Number(event.target.value) * 100 }))
            }
            required
          />
        </Field>
        <Field>
          Status
          <Select
            value={formInput.status}
            onChange={(event) => setFormInput((current) => ({ ...current, status: event.target.value as CourseStatus }))}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </Field>
        <ActionRow>
          <PrimaryButton type="submit" disabled={isSaving}>
            {editingCourseId ? 'Save course' : 'Create course'}
          </PrimaryButton>
          {editingCourseId ? (
            <Button type="button" onClick={resetForm}>
              New course
            </Button>
          ) : null}
        </ActionRow>
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      </Form>

      <CourseRows>
        {editableCourses.length === 0 ? <EmptyState>No editable courses yet.</EmptyState> : null}
        {editableCourses.map((course) => (
          <CourseRow key={course.id} $active={course.id === selectedCourseId}>
            <RowHeader>
              <div>
                <Title>{course.title}</Title>
                <Meta>
                  {formatCurrency(course.priceCents)} · Updated {new Date(course.updatedAt).toLocaleDateString()}
                </Meta>
              </div>
              <Badge>{course.status}</Badge>
            </RowHeader>
            <ActionRow>
              <Button type="button" onClick={() => onSelectCourse(course)}>
                Details
              </Button>
              <Button type="button" onClick={() => setEditingCourseId(course.id)}>
                Edit
              </Button>
              {course.status !== 'published' ? (
                <Button type="button" onClick={() => updateStatus(course, 'published')}>
                  Publish
                </Button>
              ) : null}
              {course.status !== 'archived' ? (
                <Button type="button" onClick={() => updateStatus(course, 'archived')}>
                  Archive
                </Button>
              ) : null}
            </ActionRow>
          </CourseRow>
        ))}
      </CourseRows>
    </Wrapper>
  )
}
