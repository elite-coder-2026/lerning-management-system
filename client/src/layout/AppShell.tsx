import type { PropsWithChildren } from 'react'
import styled from 'styled-components'

const Shell = styled.main`
  min-height: 100vh;
  background: #f6f8fb;
  color: #172033;
`

export function AppShell({ children }: PropsWithChildren) {
  return <Shell>{children}</Shell>
}
