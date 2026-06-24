"use client";
import { Component } from "react";
import { I18nProvider } from "@/lib/i18n";
import { ToastProvider } from "@/components/Toast";
import { CurrencyProvider } from "@/lib/currency";
import { BuyNowProvider } from "@/components/BuyNowProvider";
import ChatWidget from "@/components/ChatWidget";

// ---------------------------------------------------------------------------
// ErrorBoundary — catches any render-time React error and logs it to stdout
// so it is visible in Railway deploy logs instead of silently crashing.
// ---------------------------------------------------------------------------
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Caught a render error:", error);
    console.error("[ErrorBoundary] Component stack:", info?.componentStack ?? "(unavailable)");
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", fontFamily: "monospace", color: "#c00" }}>
          <h2>Application Error</h2>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// UnhandledRejectionLogger — registers a window listener on mount so that
// any unhandled promise rejection is printed to the console (and therefore
// to Railway stdout) rather than disappearing silently.
// ---------------------------------------------------------------------------
import { useEffect } from "react";

function UnhandledRejectionLogger() {
  useEffect(() => {
    function handleUnhandledRejection(event) {
      console.error(
        "[UnhandledRejection] Unhandled promise rejection:",
        event.reason
      );
    }
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () =>
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  }, []);
  return null;
}

export default function Providers({ children }) {
  return (
    <ErrorBoundary>
      <UnhandledRejectionLogger />
      <I18nProvider>
        <CurrencyProvider>
          <ToastProvider>
            <BuyNowProvider>
              <ChatWidget />
              {children}
            </BuyNowProvider>
          </ToastProvider>
        </CurrencyProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
