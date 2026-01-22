# API Mocking Patterns

## Overview

Mock Service Worker (MSW) for request interception in development and testing.

## Setup

```bash
pnpm add -D msw
npx msw init public --save
```

## Handler Definition

```typescript
// src/shared/api/mocks/handlers.ts
import { http, HttpResponse, delay } from 'msw';

export const handlers = [
  // GET request
  http.get('/api/users', async () => {
    await delay(150); // Simulate network
    return HttpResponse.json([
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ]);
  }),

  // GET with params
  http.get('/api/users/:id', async ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      id,
      name: 'John Doe',
      email: 'john@example.com',
    });
  }),

  // POST request
  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: crypto.randomUUID(), ...body }, { status: 201 });
  }),

  // Error response
  http.delete('/api/users/:id', async ({ params }) => {
    if (params.id === 'protected') {
      return HttpResponse.json(
        { code: 'FORBIDDEN', message: 'Cannot delete protected user' },
        { status: 403 }
      );
    }
    return new HttpResponse(null, { status: 204 });
  }),
];
```

## Browser Setup (Development)

```typescript
// src/shared/api/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

// src/main.tsx
async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    const { worker } = await import('@/shared/api/mocks/browser');
    return worker.start({
      onUnhandledRequest: 'bypass',
    });
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(<App />);
});
```

## Node Setup (Testing)

```typescript
// src/shared/api/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// tests/setup.ts
import { server } from '@/shared/api/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Test-Specific Overrides

```typescript
// Component test
import { server } from '@/shared/api/mocks/server';
import { http, HttpResponse } from 'msw';

it('shows error state when API fails', async () => {
  // Override for this test only
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.json(
        { message: 'Server error' },
        { status: 500 }
      );
    })
  );

  render(<UserList />);

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

## Scenarios (Fixtures)

```typescript
// src/shared/api/mocks/scenarios.ts
import { http, HttpResponse } from 'msw';

export const scenarios = {
  emptyState: [
    http.get('/api/users', () => HttpResponse.json([])),
    http.get('/api/orders', () => HttpResponse.json([])),
  ],

  networkError: [http.get('/api/*', () => HttpResponse.error())],

  slowNetwork: [
    http.get('/api/*', async () => {
      await delay(3000);
      return HttpResponse.json({});
    }),
  ],
};

// Usage in Storybook
import { scenarios } from '@/shared/api/mocks/scenarios';

export const EmptyState: Story = {
  parameters: {
    msw: {
      handlers: scenarios.emptyState,
    },
  },
};
```

## Angular MSW Setup

```typescript
// src/app/core/mocks/setup-msw.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export function setupMSW(): Promise<void> {
  if (process.env['NODE_ENV'] === 'development') {
    const worker = setupWorker(...handlers);
    return worker.start({ onUnhandledRequest: 'bypass' });
  }
  return Promise.resolve();
}

// main.ts
import { setupMSW } from '@/core/mocks/setup-msw';

setupMSW().then(() => {
  bootstrapApplication(AppComponent);
});
```

## Best Practices

1. **Keep handlers organized** - Group by feature/domain
2. **Use realistic data** - Helps catch edge cases
3. **Test error states** - Override handlers in tests
4. **Document scenarios** - Create named fixture sets
5. **Bypass external URLs** - Only mock your own API
