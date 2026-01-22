# Error Handling Patterns

## Overview

Centralized error handling for consistent user experience.

## Error Boundaries (React)

```tsx
// src/shared/ui/error-boundary/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
    // Log to monitoring service
    console.error('Error caught:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

function DefaultErrorFallback({ error }: { error: Error | null }) {
  return (
    <div role="alert" className="error-container">
      <h2>Something went wrong</h2>
      <pre>{error?.message}</pre>
      <button onClick={() => window.location.reload()}>Reload page</button>
    </div>
  );
}
```

## API Error Handling

```typescript
// src/shared/api/errors.ts
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network error') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends ApiError {
  constructor(
    public readonly fields: Record<string, string[]>
  ) {
    super(400, 'VALIDATION_ERROR', 'Validation failed', { fields });
    this.name = 'ValidationError';
  }
}
```

## TanStack Query Error Handling

```typescript
// src/shared/api/query-client.ts
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toast } from '@/shared/ui';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (ApiError.isApiError(error) && error.status === 401) {
          return false; // Don't retry auth errors
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only show toast for queries that have data
      // (background refetch errors)
      if (query.state.data !== undefined) {
        toast.error(`Background update failed: ${error.message}`);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error(error.message);
    },
  }),
});
```

## Form Error Handling

```typescript
// src/shared/lib/form-errors.ts
import { FieldErrors, FieldValues } from 'react-hook-form';
import { ValidationError } from '@/shared/api';

export function mapApiErrorsToForm<T extends FieldValues>(
  error: ValidationError
): FieldErrors<T> {
  const errors: Record<string, { type: string; message: string }> = {};
  
  for (const [field, messages] of Object.entries(error.fields)) {
    errors[field] = {
      type: 'server',
      message: messages[0] ?? 'Invalid value',
    };
  }
  
  return errors as FieldErrors<T>;
}
```

## Angular Error Handling

```typescript
// src/app/core/interceptors/error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '@/shared/ui';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Handle unauthorized
      } else if (error.status >= 500) {
        toast.error('Server error. Please try again later.');
      }
      
      return throwError(() => error);
    })
  );
};
```

## Best Practices

1. **Always type errors** - Use custom error classes
2. **User-friendly messages** - Don't expose technical details
3. **Recoverable actions** - Provide retry or alternative
4. **Log for debugging** - Send to monitoring service
5. **Graceful degradation** - App should continue working
