import { RuntimeError } from './error-types';
import { handleGlobalError } from './error-handler';

let isInitialized = false;

export function initErrorListeners(): void {
  if (isInitialized) {
    return;
  }

  // Handle synchronous errors not caught in try/catch
  window.addEventListener('error', (event: ErrorEvent) => {
    // Ignore errors from scripts loaded from other origins
    if (event.filename && !event.filename.includes(window.location.origin)) {
      return;
    }

    // Ignore ResizeObserver errors (common and usually harmless)
    if (event.message?.includes('ResizeObserver')) {
      return;
    }

    handleGlobalError(
      new RuntimeError({
        message: event.message || 'Unknown error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      })
    );
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason;

    // If it's already an ApiError, pass it through
    if (reason?.name === 'ApiError') {
      handleGlobalError(reason);
      return;
    }

    handleGlobalError(
      new RuntimeError({
        message: reason?.message || 'Unhandled promise rejection',
        stack: reason?.stack,
      })
    );
  });

  isInitialized = true;
}
