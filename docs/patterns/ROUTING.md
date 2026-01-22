# Routing Patterns

## Overview

Type-safe routing with React Router v6 or Angular Router.

## React Router Setup

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
  
  const filters = productFiltersSchema.parse(
    Object.fromEntries(searchParams)
  );
  
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

## Angular Router

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from '@/core/auth';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component'),
  },
  {
    path: 'products',
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/products/products.component'),
      },
      {
        path: ':id',
        loadComponent: () => import('./pages/product-detail/product-detail.component'),
      },
    ],
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/dashboard/dashboard.routes'),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component'),
  },
];

// dashboard.routes.ts
export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard-layout/dashboard-layout.component'),
    children: [
      { path: 'orders', loadComponent: () => import('./orders/orders.component') },
      { path: 'settings', loadComponent: () => import('./settings/settings.component') },
    ],
  },
];
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

## Best Practices

1. **Lazy load pages** - Reduce initial bundle
2. **Type-safe params** - Validate with Zod
3. **Centralized routes** - Single source of truth
4. **Prefetch on hover** - Improve perceived performance
5. **Use layouts** - Avoid re-mounts
6. **Error boundaries** - Per-route error handling
