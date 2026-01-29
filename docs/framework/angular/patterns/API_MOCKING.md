# Angular API Mocking Patterns

> MSW + HttpClient integration. For general concepts see [API Mocking Patterns](../../patterns/API_MOCKING.md)

## MSW Setup

```typescript
// src/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

// src/mocks/server.ts (for tests)
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

## Application Bootstrap

```typescript
// src/main.ts
async function bootstrap() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass',
    });
  }

  bootstrapApplication(AppComponent, appConfig).catch((err) =>
    console.error(err)
  );
}

bootstrap();
```

## Handler Patterns

```typescript
// src/mocks/handlers/auth.ts
import { http, HttpResponse, delay } from 'msw';
import { db } from '../db';

export const authHandlers = [
  // Login
  http.post('/api/auth/login', async ({ request }) => {
    await delay(150);

    const body = (await request.json()) as { email: string; password: string };
    const user = db.user.findFirst({
      where: { email: { equals: body.email } },
    });

    if (!user || body.password !== 'password') {
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
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
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
// src/mocks/handlers/products.ts
import { http, HttpResponse, delay } from 'msw';
import { db } from '../db';

export const productHandlers = [
  // List products with pagination
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
      where: { id: { equals: params['id'] as string } },
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

    const data = (await request.json()) as Partial<Product>;
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

    const data = (await request.json()) as Partial<Product>;
    const product = db.product.update({
      where: { id: { equals: params['id'] as string } },
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
      where: { id: { equals: params['id'] as string } },
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

## Data Modeling

```typescript
// src/mocks/db.ts
import { factory, primaryKey } from '@mswjs/data';
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
export function seedDatabase(): void {
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
// src/test-setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Test-Specific Handlers

```typescript
// In test file
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/angular';
import { ProductListComponent } from './product-list.component';

it('handles server error', async () => {
  server.use(
    http.get('/api/products', () => {
      return HttpResponse.json(
        { message: 'Internal Server Error' },
        { status: 500 }
      );
    })
  );

  await render(ProductListComponent);

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

  await render(ProductListComponent);

  await waitFor(() => {
    expect(screen.getByText(/no products/i)).toBeInTheDocument();
  });
});
```

## Integration Testing with TestBed

```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), ProductService],
    });
    service = TestBed.inject(ProductService);
  });

  it('should fetch products', async () => {
    service.loadProducts();

    await waitFor(() => {
      expect(service.products().length).toBeGreaterThan(0);
      expect(service.loading()).toBe(false);
    });
  });

  it('should handle errors', async () => {
    server.use(
      http.get('/api/products', () => {
        return HttpResponse.json({ message: 'Error' }, { status: 500 });
      })
    );

    service.loadProducts();

    await waitFor(() => {
      expect(service.error()).toBeTruthy();
    });
  });
});
```

## Network Delay Simulation

```typescript
// Simulate slow network for testing loading states
http.get('/api/products', async () => {
  await delay(2000); // 2 second delay
  return HttpResponse.json(db.product.getAll());
});

// Random delay for realistic testing
http.get('/api/products', async () => {
  await delay(Math.random() * 500 + 100); // 100-600ms
  return HttpResponse.json(db.product.getAll());
});
```

## Playwright E2E Integration

```typescript
// e2e/products.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Products', () => {
  test('displays product list', async ({ page }) => {
    await page.goto('/products');

    // MSW handles the API call
    await expect(page.getByRole('article')).toHaveCount(10);
  });

  test('handles search', async ({ page }) => {
    await page.goto('/products');

    await page.getByPlaceholder('Search products').fill('test');
    await page.waitForResponse('/api/products*');

    // Results filtered by MSW handler
  });
});
```
