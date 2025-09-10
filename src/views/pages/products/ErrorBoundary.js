// src/components/ErrorBoundary.js
import React from "react";

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary yakaladı:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Bir hata oluştu.</h2>
          <p>{this.state.error?.toString()}</p>
          <button onClick={() => window.location.reload()}>
            Sayfayı Yeniden Yükle
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
