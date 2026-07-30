import React from "react";
import Error from "./Error";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError() {
    return { hasError: true, message: "Something went wrong. Please refresh." };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <Error message={this.state.message} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

