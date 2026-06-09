import { Component, type ErrorInfo, type PropsWithChildren } from 'react'
import styled from 'styled-components'

type AppErrorBoundaryState = {
  error: Error | null
}

const ErrorFrame = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #f6f8fb;
`

const ErrorPanel = styled.section`
  width: min(100%, 620px);
  border: 1px solid #d8e0ea;
  border-radius: 8px;
  padding: 24px;
  background: #ffffff;
`

const Title = styled.h1`
  margin: 0 0 10px;
  color: #111827;
  font-size: 24px;
`

const Copy = styled.p`
  margin: 0;
  color: #667085;
`

export class AppErrorBoundary extends Component<PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application render failed', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorFrame>
          <ErrorPanel>
            <Title>Application error</Title>
            <Copy>{this.state.error.message}</Copy>
          </ErrorPanel>
        </ErrorFrame>
      )
    }

    return this.props.children
  }
}
