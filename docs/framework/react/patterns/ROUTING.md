# React Routing Patterns

> React Router v6 implementation. For general concepts see [Routing Patterns](../../patterns/ROUTING.md)

## Router Setup

```typescript
// src/app/router.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/shared/ui';

// Lazy load pages
const HomePage = lazy(() => import('@/pages/home'));
const ProductsPage = lazy(() => import('@/pages/products'));
const ProductDetailPage = lazy(() => import('@/pages/product-detail'));
const NotFoundPage = lazy(() => import('@/pages/not-found'));

// Layouts
import { RootLayout } from '@/widgets/layouts/root-layout';
import { DashboardLayout } from '@/widgets/layouts/dashboard-layout';

// Guards
import { ProtectedRoute } from '@/features/auth';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'products',
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <ProductsPage />
              </Suspense>
            ),
          },
          {
            path: ':id',
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <ProductDetailPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'dashboard',
            element: <DashboardLayout />,
            children: [
              { path: 'orders', element: <OrdersPage /> },
              { path: 'settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

// App.tsx
export function App() {
  return <RouterProvider router={router} />;
}
```

## Type-Safe Params

```typescript
// src/shared/lib/router.ts
import { useParams, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

// Define route params schema
const productParamsSchema = z.object({
  id: z.string().uuid(),
});

export function useProductParams() {
  const params = useParams();
  const result = productParamsSchema.safeParse(params);

  if (!result.success) {
    throw new Error('Invalid product ID');
  }

  return result.data;
}

// Search params
const productFiltersSchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  page: z.coerce.number().default(1),
  sort: z.enum(['price', 'name', 'date']).default('date'),
});

export function useProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = productFiltersSchema.parse(Object.fromEntries(searchParams));

  const setFilters = (updates: Partial<z.infer<typeof productFiltersSchema>>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        newParams.set(key, String(value));
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  return { filters, setFilters };
}
```

## Navigation Utils

```typescript
// src/shared/lib/navigation.ts
import { generatePath, useNavigate } from 'react-router-dom';

export const routes = {
  home: '/',
  products: '/products',
  productDetail: '/products/:id',
  dashboard: '/dashboard',
  orders: '/dashboard/orders',
  settings: '/dashboard/settings',
} as const;

export function useTypedNavigate() {
  const navigate = useNavigate();

  return {
    toHome: () => navigate(routes.home),
    toProducts: () => navigate(routes.products),
    toProduct: (id: string) => navigate(generatePath(routes.productDetail, { id })),
    toDashboard: () => navigate(routes.dashboard),
    back: () => navigate(-1),
  };
}

// Usage
function ProductCard({ product }: { product: Product }) {
  const nav = useTypedNavigate();

  return (
    <div onClick={() => nav.toProduct(product.id)}>
      {product.name}
    </div>
  );
}
```

## Protected Routes

```tsx
// src/features/auth/ui/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../model/auth-context';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
```

## Route-Based Code Splitting

```typescript
// Automatic chunk naming with Vite
const ProductsPage = lazy(() =>
  import(/* webpackChunkName: "products" */ '@/pages/products')
);

// Preload on hover
function NavLink({ to, children }: NavLinkProps) {
  const preload = () => {
    if (to === '/products') {
      import('@/pages/products');
    }
  };

  return (
    <Link to={to} onMouseEnter={preload}>
      {children}
    </Link>
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
        <div>
          <h1>Page Not Found</h1>
          <Link to="/">Go Home</Link>
        </div>
      );
    }
  }

  return (
    <div>
      <h1>Something went wrong</h1>
      <button onClick={() => window.location.reload()}>Reload</button>
    </div>
  );
}
```
