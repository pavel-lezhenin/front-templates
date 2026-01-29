# React API Mocking Patterns

> MSW + TanStack Query integration. For general concepts see [API Mocking Patterns](../../patterns/API_MOCKING.md)

## MSW Setup

```typescript
// src/shared/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

// src/shared/mocks/server.ts (for tests)
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

## Application Bootstrap

```typescript
// src/main.tsx
async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./shared/mocks/browser');
    return worker.start({
      onUnhandledRequest: 'bypass',
    });
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
```

## Handler Patterns

```typescript
// src/shared/mocks/handlers/auth.ts
import { http, HttpResponse, delay } from 'msw';
import { db } from '../db';

export const authHandlers = [
  // Login
  http.post('/api/auth/login', async ({ request }) => {
    await delay(150);
    
    const { email, password } = await request.json();
    const user = db.user.findFirst({
      where: { email: { equals: email } },
    });

    if (!user || password !== 'password') {
      return HttpResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      token: 'mock-jwt-token',
    });
  }),

  // Get current user
  http.get('/api/auth/me', async ({ request }) => {
    await delay(100);
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      id: '1',
      email: 'user@example.com',
      name: 'Test User',
    });
  }),
];
```

## CRUD Handlers

```typescript
// src/shared/mocks/handlers/products.ts
import { http, HttpResponse, delay } from 'msw';
import { db } from '../db';

export const productHandlers = [
  // List products
  http.get('/api/products', async ({ request }) => {
    await delay(200);
    
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;
    const search = url.searchParams.get('search') || '';

    let products = db.product.getAll();
    
    if (search) {
      products = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = products.length;
    const paginated = products.slice((page - 1) * limit, page * limit);

    return HttpResponse.json({
      data: paginated,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }),

  // Get single product
  http.get('/api/products/:id', async ({ params }) => {
    await delay(100);
    
    const product = db.product.findFirst({
      where: { id: { equals: params.id as string } },
    });

    if (!product) {
      return HttpResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(product);
  }),

  // Create product
  http.post('/api/products', async ({ request }) => {
    await delay(300);
    
    const data = await request.json();
    const product = db.product.create({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });

    return HttpResponse.json(product, { status: 201 });
  }),

  // Update product
  http.patch('/api/products/:id', async ({ params, request }) => {
    await delay(200);
    
    const data = await request.json();
    const product = db.product.update({
      where: { id: { equals: params.id as string } },
      data,
    });

    if (!product) {
      return HttpResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(product);
  }),

  // Delete product
  http.delete('/api/products/:id', async ({ params }) => {
    await delay(200);
    
    const deleted = db.product.delete({
      where: { id: { equals: params.id as string } },
    });

    if (!deleted) {
      return HttpResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),
];
```

## Data Modeling with @mswjs/data

```typescript
// src/shared/mocks/db.ts
import { factory, primaryKey, nullable } from '@mswjs/data';
import { faker } from '@faker-js/faker';

export const db = factory({
  user: {
    id: primaryKey(() => faker.string.uuid()),
    email: () => faker.internet.email(),
    name: () => faker.person.fullName(),
    role: () => faker.helpers.arrayElement(['admin', 'user']),
    createdAt: () => faker.date.past().toISOString(),
  },
  product: {
    id: primaryKey(() => faker.string.uuid()),
    name: () => faker.commerce.productName(),
    price: () => Number(faker.commerce.price()),
    description: () => faker.commerce.productDescription(),
    category: () => faker.commerce.department(),
    imageUrl: () => faker.image.url(),
    stock: () => faker.number.int({ min: 0, max: 100 }),
    createdAt: () => faker.date.past().toISOString(),
  },
});

// Seed initial data
export function seedDatabase() {
  // Create admin user
  db.user.create({
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
  });

  // Create products
  Array.from({ length: 50 }).forEach(() => {
    db.product.create();
  });
}
```

## Test Setup

```typescript
// tests/setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '@/shared/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Test-Specific Handlers

```typescript
// In test file
import { server } from '@/shared/mocks/server';
import { http, HttpResponse } from 'msw';

it('handles server error', async () => {
  server.use(
    http.get('/api/products', () => {
      return HttpResponse.json(
        { message: 'Internal Server Error' },
        { status: 500 }
      );
    })
  );

  render(<ProductList />);
  
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});

it('handles empty state', async () => {
  server.use(
    http.get('/api/products', () => {
      return HttpResponse.json({ data: [], meta: { total: 0 } });
    })
  );

  render(<ProductList />);
  
  await waitFor(() => {
    expect(screen.getByText(/no products/i)).toBeInTheDocument();
  });
});
```

## Integration with TanStack Query

```typescript
// Test utilities
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

export function renderWithProviders(ui: React.ReactElement) {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  );
}
```

## Playwright E2E with MSW

```typescript
// e2e/mocks.ts
// For E2E tests, you can use MSW with Playwright
// See: https://mswjs.io/docs/integrations/browser#playwright

// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```
