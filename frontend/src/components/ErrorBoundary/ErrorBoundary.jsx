import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('화면 렌더링 오류:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error-boundary" role="alert">
          <span className="app-error-boundary__icon" aria-hidden="true">🌿</span>
          <p className="app-error-boundary__eyebrow">REFRESH</p>
          <h1>화면을 불러오지 못했어요</h1>
          <p>잠시 후 다시 시도해주세요.</p>
          <div className="app-error-boundary__actions">
            <button type="button" onClick={this.handleRetry}>다시 시도</button>
            <a href="/menu">대시보드로 이동</a>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
