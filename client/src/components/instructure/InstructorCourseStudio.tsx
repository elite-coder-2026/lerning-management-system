import { useState } from 'react'
import styled from 'styled-components'
import type { Course, CourseInput, VideoLesson } from '../../api/lms'

type InstructorCourseStudioProps = {
  courses: Course[]
  userId: string
  onCreateCourse: (input: CourseInput) => Promise<void>
  onCreateVideoLesson: (input: {
    courseId: string;
    moduleTitle: string;
    title: string;
    summary: string;
    videoUrl: string;
    durationMinutes: number;
  }) => Promise<VideoLesson | null>
  onUpdateCourse: (id: string, input: Partial<CourseInput>) => Promise<void>
}

const Shell = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 20px;
`

const Card = styled.section`
  display: grid;
  gap: 14px;
  border: 1px solid #d8e0ea;
  border-radius: 8px;
  padding: 18px;
  background: #ffffff;
`

const Title = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 18px;
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
  min-height: 100px;
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

const Button = styled.button`
  border: 1px solid #0f4f8f;
  border-radius: 6px;
  padding: 10px 14px;
  background: #0f4f8f;
  color: #ffffff;
  font-weight: 900;
  cursor: pointer;
`

const SecondaryButton = styled(Button)`
  border-color: #cfd8e3;
  background: #ffffff;
  color: #172033;
`

const List = styled.div`
  display: grid;
  gap: 10px;
`

const Item = styled.article`
  display: grid;
  gap: 8px;
  border: 1px solid #e7edf4;
  border-radius: 8px;
  padding: 14px;
`

const ItemTitle = styled.h3`
  margin: 0;
  color: #172033;
  font-size: 15px;
`

const Meta = styled.p`
  margin: 0;
  color: #667085;
  font-size: 13px;
`

export function InstructorCourseStudio({
  courses,
  userId,
  onCreateCourse,
  onCreateVideoLesson,
  onUpdateCourse,
}: InstructorCourseStudioProps) {
  const authoredCourses = courses.filter((course) => course.instructorId === userId)
  const [courseInput, setCourseInput] = useState<CourseInput>({
    title: '',
    description: '',
    priceCents: 0,
    status: 'draft',
  })
  const [lessonInput, setLessonInput] = useState({
    courseId: authoredCourses[0]?.id ?? '',
    moduleTitle: 'Module 1',
    title: '',
    summary: '',
    videoUrl: '',
    durationMinutes: 0,
  })

  return (
    <Shell>
      <Card>
        <Title>Course builder</Title>
        <Field>
          Course title
          <Input value={courseInput.title} onChange={(event) => setCourseInput((current) => ({ ...current, title: event.target.value }))} />
        </Field>
        <Field>
          Description
          <Textarea value={courseInput.description} onChange={(event) => setCourseInput((current) => ({ ...current, description: event.target.value }))} />
        </Field>
        <Field>
          Price dollars
          <Input type="number" min={0} value={Math.round(courseInput.priceCents / 100)} onChange={(event) => setCourseInput((current) => ({ ...current, priceCents: Number(event.target.value) * 100 }))} />
        </Field>
        <Button type="button" onClick={() => void onCreateCourse(courseInput)}>Create course</Button>
      </Card>

      <Card>
        <Title>Video lesson editor</Title>
        <Field>
          Course
          <Select value={lessonInput.courseId} onChange={(event) => setLessonInput((current) => ({ ...current, courseId: event.target.value }))}>
            <option value="">Select authored course</option>
            {authoredCourses.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </Select>
        </Field>
        <Field>
          Module title
          <Input value={lessonInput.moduleTitle} onChange={(event) => setLessonInput((current) => ({ ...current, moduleTitle: event.target.value }))} />
        </Field>
        <Field>
          Video title
          <Input value={lessonInput.title} onChange={(event) => setLessonInput((current) => ({ ...current, title: event.target.value }))} />
        </Field>
        <Field>
          Summary
          <Textarea value={lessonInput.summary} onChange={(event) => setLessonInput((current) => ({ ...current, summary: event.target.value }))} />
        </Field>
        <Field>
          Video URL
          <Input type="url" value={lessonInput.videoUrl} onChange={(event) => setLessonInput((current) => ({ ...current, videoUrl: event.target.value }))} />
        </Field>
        <Field>
          Duration minutes
          <Input type="number" min={0} value={lessonInput.durationMinutes} onChange={(event) => setLessonInput((current) => ({ ...current, durationMinutes: Number(event.target.value) }))} />
        </Field>
        <Button type="button" onClick={() => void onCreateVideoLesson(lessonInput)}>Save video lesson</Button>
      </Card>

      <Card style={{ gridColumn: '1 / -1' }}>
        <Title>Authored courses</Title>
        <List>
          {authoredCourses.map((course) => (
            <Item key={course.id}>
              <ItemTitle>{course.title}</ItemTitle>
              <Meta>{course.status} / {course.priceCents / 100}</Meta>
              <SecondaryButton type="button" onClick={() => void onUpdateCourse(course.id, { status: course.status === 'published' ? 'archived' : 'published' })}>
                Toggle publish
              </SecondaryButton>
            </Item>
          ))}
        </List>
      </Card>
    </Shell>
  )
}
