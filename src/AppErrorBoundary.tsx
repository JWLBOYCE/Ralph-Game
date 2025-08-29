import React from 'react'

type State = { hasError: boolean; error?: any }

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error('App crashed:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error" style={{ padding: 16 }}>
          <div>
            <strong>Something went wrong.</strong>
          </div>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {String(this.state.error || 'Unknown error')}
          </pre>
        </div>
      )
    }
    return this.props.children as any
  }
}

