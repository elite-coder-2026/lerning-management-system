import { createGlobalStyle } from 'styled-components'

export const GlobalStyles = createGlobalStyle`
  :root {
    --page-width: 1180px;
    --page-gutter: 48px;
    font: 16px/1.5 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #172033;
    background: #f6f8fb;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
  }

  html {
    scroll-behavior: smooth;
  }

  [id] {
    scroll-margin-top: 18px;
  }

  @media (max-width: 900px) {
    :root {
      --page-gutter: 40px;
    }
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
  }

  #root {
    min-height: 100vh;
  }
`
