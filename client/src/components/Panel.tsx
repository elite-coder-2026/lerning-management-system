import type { PropsWithChildren } from 'react'
import styled from 'styled-components'

const PanelFrame = styled.section`
  overflow: hidden;
  border: 1px solid #d8e0ea;
  border-radius: 8px;
  background: #ffffff;
`

const Heading = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid #e7edf4;
`

const Title = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 20px;
`

const Meta = styled.span`
  color: #667085;
  font-size: 13px;
  font-weight: 700;
`

type PanelProps = PropsWithChildren<{
  title: string
  meta: string
}>

export function Panel({ title, meta, children }: PanelProps) {
  return (
    <PanelFrame>
      <Heading>
        <Title>{title}</Title>
        <Meta>{meta}</Meta>
      </Heading>
      {children}
    </PanelFrame>
  )
}
