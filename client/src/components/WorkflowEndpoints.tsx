import styled from 'styled-components'

const endpoints = [
  {
    method: 'POST /api/courses/enrollments',
    description: 'Creates or reactivates an enrollment inside a transaction.',
  },
  {
    method: 'POST /api/courses/payments',
    description: 'Records paid course revenue from enrollment and course rows.',
  },
  {
    method: 'POST /api/learning/quizzes/submissions',
    description: 'Scores answers with SQL CTEs and stores answers atomically.',
  },
  {
    method: 'POST /api/learning/assignments/grades',
    description: 'Grades assignment submissions with instructor or admin roles.',
  },
]

const List = styled.ul`
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
`

const Item = styled.li`
  display: grid;
  gap: 8px;
  padding: 18px 20px;
  border-bottom: 1px solid #eef2f6;

  &:last-child {
    border-bottom: 0;
  }
`

const Method = styled.code`
  width: fit-content;
  border-radius: 5px;
  padding: 4px 8px;
  background: #eef6ff;
  color: #0f4f8f;
  font-size: 13px;
`

const Description = styled.span`
  color: #667085;
`

export function WorkflowEndpoints() {
  return (
    <List>
      {endpoints.map((endpoint) => (
        <Item key={endpoint.method}>
          <Method>{endpoint.method}</Method>
          <Description>{endpoint.description}</Description>
        </Item>
      ))}
    </List>
  )
}
