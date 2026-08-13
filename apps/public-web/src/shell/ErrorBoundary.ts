export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export function createErrorBoundaryConfig(error?: Error): ErrorBoundaryState {
  if (error) {
    return {
      hasError: true,
      error,
    };
  }
  return {
    hasError: false,
  };
}
