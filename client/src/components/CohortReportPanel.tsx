import { useState } from 'react'
import styled from 'styled-components'
import type { CohortReportRow } from '../api/lms'
import { formatCurrency } from '../utils/formatters'

type CohortReportPanelProps = {
  report: CohortReportRow[]
  onLoadReport: (input: { from: string; to: string }) => Promise<void>
}

const Wrapper = styled.div`
  display: grid;
`

const Toolbar = styled.form`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
  padding: 16px 20px;
  border-bottom: 1px solid #eef2f6;
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
  padding: 9px 10px;
  color: #172033;
`

const Button = styled.button`
  border: 1px solid #0f4f8f;
  border-radius: 6px;
  padding: 9px 12px;
  background: #0f4f8f;
  color: #ffffff;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.56;
  }
`

const TableWrap = styled.div`
  overflow-x: auto;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const Th = styled.th`
  padding: 12px 14px;
  border-bottom: 1px solid #eef2f6;
  color: #475467;
  font-size: 12px;
  text-align: left;
  text-transform: uppercase;
`

const Td = styled.td`
  padding: 14px;
  border-bottom: 1px solid #eef2f6;
  color: #172033;
  white-space: nowrap;
`

const EmptyState = styled.p`
  margin: 0;
  padding: 20px;
  color: #667085;
`

const ErrorMessage = styled.p`
  margin: 0;
  color: #b42318;
  font-size: 13px;
  font-weight: 800;
`

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
}

const now = new Date()
const defaultFrom = toDateInputValue(addMonths(startOfMonth(now), -5))
const defaultTo = toDateInputValue(addMonths(startOfMonth(now), 1))

export function CohortReportPanel({ report, onLoadReport }: CohortReportPanelProps) {
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await onLoadReport({
        from: new Date(`${from}T00:00:00.000Z`).toISOString(),
        to: new Date(`${to}T00:00:00.000Z`).toISOString(),
      })
    } catch {
      setError('Cohort report could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Wrapper>
      <Toolbar onSubmit={handleSubmit}>
        <Field>
          From
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} required />
        </Field>
        <Field>
          To
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} required />
        </Field>
        <Button type="submit" disabled={isLoading}>
          Load cohorts
        </Button>
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      </Toolbar>

      {report.length === 0 ? (
        <EmptyState>No cohort rows loaded yet.</EmptyState>
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Cohort</Th>
                <Th>Students</Th>
                <Th>Enrollments</Th>
                <Th>Paid</Th>
                <Th>Revenue</Th>
                <Th>Completed</Th>
                <Th>Completion</Th>
                <Th>Avg quiz</Th>
              </tr>
            </thead>
            <tbody>
              {report.map((row) => (
                <tr key={row.cohortMonth}>
                  <Td>{new Date(row.cohortMonth).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</Td>
                  <Td>{row.students.toLocaleString()}</Td>
                  <Td>{row.enrollments.toLocaleString()}</Td>
                  <Td>{row.paidStudents.toLocaleString()}</Td>
                  <Td>{formatCurrency(row.revenueCents)}</Td>
                  <Td>{row.completedEnrollments.toLocaleString()}</Td>
                  <Td>{row.completionRate.toFixed(1)}%</Td>
                  <Td>{row.averageQuizScore.toFixed(1)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}
    </Wrapper>
  )
}
