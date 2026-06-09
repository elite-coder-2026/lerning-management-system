import styled from 'styled-components'

export type StatItem = {
  label: string
  value: string
}

type StatsGridProps = {
  stats: StatItem[]
  id?: string
}

const Grid = styled.section`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 1px;
  width: min(var(--page-width), calc(100% - var(--page-gutter)));
  margin: 24px auto 0;
  overflow: hidden;
  border: 1px solid #d8e0ea;
  border-radius: 8px;
  background: #d8e0ea;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

const Card = styled.article`
  display: grid;
  gap: 8px;
  padding: 24px;
  background: #ffffff;
`

const Label = styled.span`
  color: #667085;
  font-size: 13px;
  font-weight: 700;
`

const Value = styled.strong`
  color: #111827;
  font-size: 28px;
`

export function StatsGrid({ stats, id }: StatsGridProps) {
  return (
    <Grid id={id} aria-label="Dashboard analytics">
      {stats.map((item) => (
        <Card key={item.label}>
          <Label>{item.label}</Label>
          <Value>{item.value}</Value>
        </Card>
      ))}
    </Grid>
  )
}
