import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <p className="mb-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            일시적인 오류가 발생했습니다.
          </p>
          <p className="mb-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            페이지를 새로고침해 주세요.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style={{ background: 'var(--color-accent)' }}
          >
            새로고침
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
