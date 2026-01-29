# Angular Routing Patterns

> Angular Router implementation. For general concepts see [Routing Patterns](../../patterns/ROUTING.md)

## Route Configuration

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
```

## Nested Routes (Lazy Loading)

```typescript
// src/app/pages/dashboard/dashboard.routes.ts
import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard-layout/dashboard-layout.component'),
    children: [
      { 
        path: '', 
        redirectTo: 'overview', 
        pathMatch: 'full' 
      },
      { 
        path: 'overview', 
        loadComponent: () => import('./overview/overview.component') 
      },
      { 
        path: 'orders', 
        loadComponent: () => import('./orders/orders.component') 
      },
      { 
        path: 'settings', 
        loadComponent: () => import('./settings/settings.component') 
      },
    ],
  },
];

export default dashboardRoutes;
```

## Functional Guards

```typescript
// src/app/core/guards/auth.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Store intended URL for redirect after login
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

// Role-based guard
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasRole('admin')) {
    return true;
  }

  return router.createUrlTree(['/unauthorized']);
};
```

## Route Resolvers

```typescript
// src/app/core/resolvers/product.resolver.ts
import { ResolveFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ProductService } from '@/entities/product';

export const productResolver: ResolveFn<Product | null> = (route) => {
  const productService = inject(ProductService);
  const router = inject(Router);
  const id = route.paramMap.get('id');

  if (!id) {
    router.navigate(['/products']);
    return of(null);
  }

  return productService.getById(id).pipe(
    catchError(() => {
      router.navigate(['/products']);
      return of(null);
    })
  );
};

// Usage in routes
{
  path: ':id',
  loadComponent: () => import('./product-detail.component'),
  resolve: { product: productResolver },
}
```

## Type-Safe Route Params

```typescript
// src/app/shared/lib/route-utils.ts
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { z } from 'zod';

// Schema for product params
const productParamsSchema = z.object({
  id: z.string().uuid(),
});

// Type-safe params observable
export function useTypedParams<T extends z.ZodSchema>(
  route: ActivatedRoute,
  schema: T
) {
  return route.paramMap.pipe(
    map((params) => {
      const obj = Object.fromEntries(
        Array.from(params.keys()).map((key) => [key, params.get(key)])
      );
      return schema.parse(obj) as z.infer<T>;
    })
  );
}

// Usage in component
@Component({...})
export class ProductDetailComponent {
  private route = inject(ActivatedRoute);
  
  params$ = useTypedParams(this.route, productParamsSchema);
}
```

## Navigation Service

```typescript
// src/app/core/services/navigation.service.ts
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private router = inject(Router);

  readonly routes = {
    home: '/',
    products: '/products',
    productDetail: (id: string) => `/products/${id}`,
    dashboard: '/dashboard',
    orders: '/dashboard/orders',
    settings: '/dashboard/settings',
    login: '/login',
  } as const;

  toHome() {
    return this.router.navigate([this.routes.home]);
  }

  toProducts() {
    return this.router.navigate([this.routes.products]);
  }

  toProduct(id: string) {
    return this.router.navigate([this.routes.productDetail(id)]);
  }

  toDashboard() {
    return this.router.navigate([this.routes.dashboard]);
  }

  toLogin(returnUrl?: string) {
    return this.router.navigate([this.routes.login], {
      queryParams: returnUrl ? { returnUrl } : undefined,
    });
  }

  back() {
    window.history.back();
  }
}
```

## Query Params Handling

```typescript
// src/app/shared/lib/query-params.ts
import { ActivatedRoute, Router } from '@angular/router';
import { inject, signal, effect } from '@angular/core';
import { z } from 'zod';

const filtersSchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  page: z.coerce.number().default(1),
  sort: z.enum(['price', 'name', 'date']).default('date'),
});

type Filters = z.infer<typeof filtersSchema>;

@Injectable()
export class ProductFiltersService {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  filters = signal<Filters>(this.parseFilters());

  constructor() {
    this.route.queryParams.subscribe(() => {
      this.filters.set(this.parseFilters());
    });
  }

  private parseFilters(): Filters {
    const params = this.route.snapshot.queryParams;
    return filtersSchema.parse(params);
  }

  updateFilters(updates: Partial<Filters>) {
    const current = this.filters();
    const newFilters = { ...current, ...updates };
    
    this.router.navigate([], {
      queryParams: newFilters,
      queryParamsHandling: 'merge',
    });
  }

  resetFilters() {
    this.router.navigate([], {
      queryParams: {},
    });
  }
}
```

## Preloading Strategy

```typescript
// src/app/core/preloading/selective-preload.ts
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

export class SelectivePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Preload routes marked with data.preload = true
    return route.data?.['preload'] ? load() : of(null);
  }
}

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(SelectivePreloadingStrategy)
    ),
  ],
};

// Mark routes for preloading
{
  path: 'products',
  loadComponent: () => import('./products.component'),
  data: { preload: true },
}
```
