import { createElement } from 'react';
import { toast } from 'sonner';

import { AppToast, type ToastType } from '@/components/ui/app-toast';
import { ApiError, RuntimeError, type ErrorDetails } from './error-types';

const MAX_TOASTS = 5;
const activeToasts: (string | number)[] = [];

function enforceMaxToasts() {
  if (activeToasts.length >= MAX_TOASTS) {
    const oldestToast = activeToasts.shift();
    if (oldestToast) {
      toast.dismiss(oldestToast);
    }
  }
}

function createErrorDetails(error: unknown): ErrorDetails {
  if (error instanceof ApiError || error instanceof RuntimeError) {
    return error;
  }

  // Convert unknown error to RuntimeError
  if (error instanceof Error) {
    return new RuntimeError({
      message: error.message,
      stack: error.stack,
    });
  }

  // Handle non-Error objects
  return new RuntimeError({
    message: String(error),
  });
}

interface ShowToastOptions {
  type: ToastType;
  message: string;
  details?: string;
  persistent?: boolean;
}

function showToast({ type, message, details, persistent = false }: ShowToastOptions) {
  enforceMaxToasts();

  const toastId = toast.custom(id => createElement(AppToast, { id, type, message, details }), {
    duration: persistent ? Infinity : 5000,
    position: 'top-center',
  });

  activeToasts.push(toastId);

  return toastId;
}

// Public API for all toast types
export function showErrorToast(message: string, details?: string) {
  return showToast({ type: 'error', message, details, persistent: true });
}

export function showSuccessToast(message: string, details?: string) {
  return showToast({ type: 'success', message, details });
}

export function showInfoToast(message: string, details?: string) {
  return showToast({ type: 'info', message, details });
}

export function showWarningToast(message: string, details?: string) {
  return showToast({ type: 'warning', message, details });
}

// Global error handler for React Query and runtime errors
export function handleGlobalError(error: unknown): void {
  const errorDetails = createErrorDetails(error);

  // Skip 401 errors (already handled by redirect to login)
  if (errorDetails.category === 'auth') {
    return;
  }

  showToast({
    type: 'error',
    message: errorDetails.userMessage,
    details: errorDetails.technicalDetails,
    persistent: true,
  });

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('[ErrorHandler]', error);
  }
}

