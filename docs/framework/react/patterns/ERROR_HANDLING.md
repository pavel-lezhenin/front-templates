# React Error Handling Patterns

> Error Boundaries + TanStack Query implementation. For general concepts see [Error Handling Patterns](../../patterns/ERROR_HANDLING.md)

## Error Boundary Component

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
    // Log to monitoring service (Sentry, etc.)
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

## Route Error Boundary

```tsx
// src/app/RouteErrorBoundary.tsx
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

export function RouteErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <div className="error-page">
          <h1>Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <Link to="/">Go Home</Link>
        </div>
      );
    }

    if (error.status === 401) {
      return (
        <div className="error-page">
          <h1>Unauthorized</h1>
          <p>You need to be logged in to access this page.</p>
          <Link to="/login">Login</Link>
        </div>
      );
    }
  }

  return (
    <div className="error-page">
      <h1>Something went wrong</h1>
      <button onClick={() => window.location.reload()}>Reload</button>
    </div>
  );
}

// Usage in router
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [/* routes */],
  },
]);
```

## TanStack Query Error Handling

```typescript
// src/shared/api/query-client.ts
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { ApiError } from './errors';
import { toast } from '@/shared/ui';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry auth errors
        if (ApiError.isApiError(error) && error.status === 401) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only show toast for background refetch errors
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

## Query Error UI

```tsx
// src/shared/ui/query-error/QueryError.tsx
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

export function QueryErrorBoundary({ children }: { children: ReactNode }) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="query-error">
          <p>Failed to load data: {error.message}</p>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// Usage
<QueryErrorBoundary>
  <ProductList />
</QueryErrorBoundary>
```

## Form Error Handling

```typescript
// src/shared/lib/form-errors.ts
import { FieldErrors, FieldValues, UseFormSetError } from 'react-hook-form';
import { ValidationError } from '@/shared/api';

export function mapApiErrorsToForm<T extends FieldValues>(
  error: ValidationError,
  setError: UseFormSetError<T>
): void {
  Object.entries(error.fields).forEach(([field, messages]) => {
    setError(field as any, {
      type: 'server',
      message: messages[0] ?? 'Invalid value',
    });
  });
}

// Usage in form
const handleSubmit = async (data: FormData) => {
  try {
    await api.submit(data);
  } catch (error) {
    if (error instanceof ValidationError) {
      mapApiErrorsToForm(error, form.setError);
    } else {
      form.setError('root', { message: 'Something went wrong' });
    }
  }
};
```

## Suspense Integration

```tsx
// Combine with Suspense for loading states
import { Suspense } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

function ProductPage() {
  return (
    <ErrorBoundary fallback={<ProductError />}>
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetails />
      </Suspense>
    </ErrorBoundary>
  );
}
```
