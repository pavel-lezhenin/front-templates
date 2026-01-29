# Angular Framework Guide

## Project Structure

Angular projects in this monorepo follow different architectural patterns. Choose structure according to package naming convention.

### Standalone Pattern (Angular 17+)

Modern approach without NgModules. Recommended for new projects.

**Packages:** `angular-standalone-*`

```
src/
├── app/
│   ├── app.component.ts
│   ├── app.config.ts          # ApplicationConfig with providers
│   ├── app.routes.ts          # Lazy-loaded routes
│   └── core/                  # Singleton services, guards, interceptors
│       ├── auth/
│       ├── interceptors/
│       └── guards/
├── pages/                     # Route components (composition only)
│   ├── home/
│   │   └── home.component.ts
│   ├── products/
│   └── dashboard/
├── features/                  # Feature-specific standalone components
│   ├── cart/
│   │   ├── cart.component.ts
│   │   └── cart.service.ts
│   └── checkout/
├── entities/                  # Domain models and data-access
│   ├── user/
│   │   ├── user.model.ts
│   │   └── user.service.ts
│   └── product/
└── shared/                    # Reusable standalone components, directives, pipes
    ├── ui/
    ├── directives/
    ├── pipes/
    └── utils/
```

### Modular Pattern (NgModule-based)

Classic approach with NgModules. Used for legacy projects or specific requirements.

**Packages:** `angular-modular-*`

```
src/
├── app/
│   ├── app.module.ts          # Root NgModule
│   ├── app-routing.module.ts
│   ├── app.component.ts
│   └── core/                  # CoreModule (imported once in AppModule)
│       ├── core.module.ts
│       ├── auth/
│       ├── interceptors/
│       └── guards/
├── features/                  # Feature modules (lazy-loaded)
│   ├── products/
│   │   ├── products.module.ts
│   │   ├── products-routing.module.ts
│   │   ├── pages/
│   │   ├── components/
│   │   └── services/
│   └── dashboard/
│       └── dashboard.module.ts
└── shared/                    # SharedModule (exported reusables)
    ├── shared.module.ts
    ├── components/
    ├── directives/
    ├── pipes/
    └── utils/
```

### Enterprise Layered Pattern

For large-scale monolithic applications (300+ components) with multiple user areas (admin, user cabinet, dashboards) but still a single deployable unit.

**Packages:** `angular-layered-*`

```
src/
├── app/
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts          # Top-level routing to areas
│
├── @core/                     # LAYER: Singleton services (imported once)
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── auth.guard.ts
│   │   └── auth.interceptor.ts
│   ├── api/
│   │   ├── api.service.ts
│   │   └── api.interceptor.ts
│   ├── config/
│   │   └── app-config.service.ts
│   ├── storage/
│   │   └── local-storage.service.ts
│   └── index.ts               # Public API
│
├── @shared/                   # LAYER: Reusable (no business logic)
│   ├── ui/                    # UI Kit
│   │   ├── button/
│   │   ├── input/
│   │   ├── modal/
│   │   ├── table/
│   │   ├── card/
│   │   └── index.ts
│   ├── directives/
│   │   ├── click-outside.directive.ts
│   │   └── index.ts
│   ├── pipes/
│   │   ├── date-format.pipe.ts
│   │   └── index.ts
│   ├── validators/
│   │   └── custom-validators.ts
│   └── helpers/
│       ├── array.utils.ts
│       ├── date.utils.ts
│       └── index.ts
│
├── @domain/                   # LAYER: Business domain models & services
│   ├── user/
│   │   ├── user.model.ts
│   │   ├── user.api.ts
│   │   └── index.ts
│   ├── product/
│   │   ├── product.model.ts
│   │   ├── product.api.ts
│   │   └── index.ts
│   ├── order/
│   └── organization/
│
├── areas/                     # USER AREAS (lazy-loaded)
│   │
│   ├── admin/                 # Admin panel
│   │   ├── admin.routes.ts
│   │   ├── admin-layout.component.ts
│   │   ├── dashboard/
│   │   │   └── admin-dashboard.component.ts
│   │   ├── users-management/
│   │   │   ├── users-list/
│   │   │   ├── user-edit/
│   │   │   └── users-management.routes.ts
│   │   ├── settings/
│   │   └── reports/
│   │
│   ├── cabinet/               # User personal cabinet
│   │   ├── cabinet.routes.ts
│   │   ├── cabinet-layout.component.ts
│   │   ├── profile/
│   │   ├── orders/
│   │   ├── notifications/
│   │   └── settings/
│   │
│   ├── manager/               # Manager dashboard
│   │   ├── manager.routes.ts
│   │   ├── manager-layout.component.ts
│   │   ├── analytics/
│   │   ├── team/
│   │   └── tasks/
│   │
│   └── public/                # Public pages (landing, auth)
│       ├── public.routes.ts
│       ├── landing/
│       ├── login/
│       ├── register/
│       └── password-reset/
│
└── @widgets/                  # Complex reusable blocks (with business logic)
    ├── user-menu/
    ├── notification-bell/
    ├── search-panel/
    ├── data-export/
    └── charts/
```

#### Layer Rules

| Layer     | Purpose                              | Can Import              |
| --------- | ------------------------------------ | ----------------------- |
| `@core`   | Singleton services, guards, interceptors | Only external libs   |
| `@shared` | UI kit, pipes, directives, helpers   | Only external libs      |
| `@domain` | Business models, API services        | `@shared`               |
| `@widgets`| Complex reusable blocks              | `@core`, `@shared`, `@domain` |
| `areas/*` | User areas with pages                | All layers              |

#### Path Aliases (tsconfig.json)

```json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["src/@core/*"],
      "@shared/*": ["src/@shared/*"],
      "@domain/*": ["src/@domain/*"],
      "@widgets/*": ["src/@widgets/*"],
      "@areas/*": ["src/areas/*"]
    }
  }
}
```

#### Area Routing Example

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./areas/public/public.routes').then(m => m.PUBLIC_ROUTES),
  },
  {
    path: 'cabinet',
    canActivate: [authGuard],
    loadChildren: () => import('./areas/cabinet/cabinet.routes').then(m => m.CABINET_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./areas/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  {
    path: 'manager',
    canActivate: [authGuard, managerGuard],
    loadChildren: () => import('./areas/manager/manager.routes').then(m => m.MANAGER_ROUTES),
  },
];

// areas/admin/admin.routes.ts
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard',
        loadComponent: () => import('./dashboard/admin-dashboard.component'),
      },
      {
        path: 'users',
        loadChildren: () => import('./users-management/users-management.routes'),
      },
    ],
  },
];
```

#### When to Use

- ✅ 300+ components monolith
- ✅ Multiple user roles (admin, user, manager, etc.)
- ✅ Single deployment unit required
- ✅ Shared domain logic across areas
- ❌ Need independent deployments → use NX
- ❌ Small app (<50 components) → use Standalone

### NX Monorepo Pattern

For large-scale enterprise applications with shared libraries and multiple apps.

**Packages:** `angular-nx-*`

```
├── apps/
│   ├── shell/                     # Main application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── app.component.ts
│   │   │   │   ├── app.config.ts
│   │   │   │   └── app.routes.ts
│   │   │   └── main.ts
│   │   └── project.json           # NX project configuration
│   └── admin/                     # Admin application
│       ├── src/
│       └── project.json
├── libs/
│   ├── shared/
│   │   ├── ui/                    # UI component library
│   │   │   ├── src/
│   │   │   │   ├── lib/
│   │   │   │   │   ├── button/
│   │   │   │   │   └── card/
│   │   │   │   └── index.ts       # Public API
│   │   │   └── project.json
│   │   ├── utils/                 # Utility functions
│   │   └── data-access/           # API services, state
│   ├── features/
│   │   ├── products/              # Feature library
│   │   │   ├── src/
│   │   │   │   ├── lib/
│   │   │   │   │   ├── product-list/
│   │   │   │   │   └── product-detail/
│   │   │   │   └── index.ts
│   │   │   └── project.json
│   │   └── auth/
│   └── entities/
│       └── user/
├── nx.json                        # NX workspace configuration
└── tsconfig.base.json             # Shared TS config with path aliases
```

#### NX Library Types

| Type        | Purpose                          | Example                    |
| ----------- | -------------------------------- | -------------------------- |
| feature     | Smart components, business logic | `libs/features/products`   |
| ui          | Presentational components        | `libs/shared/ui`           |
| data-access | State, API services              | `libs/shared/data-access`  |
| util        | Pure functions, helpers          | `libs/shared/utils`        |
| entity      | Domain models, interfaces        | `libs/entities/user`       |

#### NX Path Aliases

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "paths": {
      "@myorg/shared/ui": ["libs/shared/ui/src/index.ts"],
      "@myorg/shared/utils": ["libs/shared/utils/src/index.ts"],
      "@myorg/features/products": ["libs/features/products/src/index.ts"],
      "@myorg/entities/user": ["libs/entities/user/src/index.ts"]
    }
  }
}
```

#### NX Common Commands

```bash
# Generate new library
npx nx g @nx/angular:library shared/ui --standalone --buildable

# Generate component in library
npx nx g @nx/angular:component button --project=shared-ui --standalone

# Run affected tests (only changed)
npx nx affected:test

# Build affected apps
npx nx affected:build

# Visualize dependency graph
npx nx graph

# Run specific app
npx nx serve shell
npx nx serve admin
```

### Key Differences

| Aspect          | Standalone              | Modular (NgModule)       | Enterprise Layered       | NX Monorepo              |
| --------------- | ----------------------- | ------------------------ | ------------------------ | ------------------------ |
| Bootstrap       | `bootstrapApplication`  | `platformBrowserDynamic` | `bootstrapApplication`   | `bootstrapApplication`   |
| Components      | `standalone: true`      | Declared in NgModule     | Standalone               | Standalone in libs       |
| Organization    | Flat / features         | Feature modules          | Layers + areas           | Apps + libs              |
| Dependencies    | `imports` in component  | Module imports           | Path aliases (@core/*)   | Path aliases (@myorg/*)  |
| Lazy Loading    | `loadComponent()`       | `loadChildren()`         | Areas lazy-loaded        | `loadComponent()` + libs |
| Tree-shaking    | ✅ Better               | ⚠️ Module-level          | ✅ Good                  | ✅ Library-level         |
| Deployment      | Single bundle           | Single bundle            | Single bundle            | Multiple apps            |
| Scale           | <100 components         | 50-200 components        | 200-1000+ components     | Unlimited                |
| Best For        | Small-Medium apps       | Legacy migration         | Large monoliths          | Enterprise, multi-app    |

### When to Use What

| Pattern            | Components | User Areas | Deployment | Team Size |
| ------------------ | ---------- | ---------- | ---------- | --------- |
| **Standalone**     | <100       | 1-2        | Single     | 1-3       |
| **Modular**        | 50-200     | 1-3        | Single     | 2-5       |
| **Enterprise Layered** | 200-1000+ | Multiple (admin, cabinet, manager) | Single | 5-15 |
| **NX Monorepo**    | Unlimited  | Unlimited  | Multiple   | 10+       |

## Stack Defaults

| Concern | Standalone / Modular / Layered | NX Monorepo            |
| ------- | ------------------------------ | ---------------------- |
| Build   | Angular CLI                    | NX CLI + Angular       |
| Styling | SCSS                           | SCSS                   |
| State   | Signals + Services             | Signals + data-access libs |
| Forms   | Reactive Forms                 | Reactive Forms         |
| HTTP    | HttpClient                     | HttpClient             |
| Testing | Jest                           | Jest (affected)        |
| E2E     | Playwright                     | Playwright             |
| Mocking | MSW                            | MSW                    |

## Modern Angular Patterns

### Standalone Components

```typescript
// ✅ GOOD: Standalone by default (Angular 17+)
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="product-card">
      <h3>{{ product().name }}</h3>
      <p>{{ product().price | currency }}</p>
    </div>
  `,
})
export class ProductCardComponent {
  product = input.required<Product>();
}
```

### NX Library Component

```typescript
// libs/shared/ui/src/lib/button/button.component.ts
@Component({
  selector: 'myorg-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button [class]="variant()" [disabled]="disabled()">
      <ng-content />
    </button>
  `,
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  variant = input<'primary' | 'secondary'>('primary');
  disabled = input(false);
}

// libs/shared/ui/src/index.ts (public API)
export * from './lib/button/button.component';
export * from './lib/card/card.component';

// Usage in app
import { ButtonComponent } from '@myorg/shared/ui';

@Component({
  imports: [ButtonComponent],
  template: `<myorg-button variant="primary">Click me</myorg-button>`,
})
export class ProductPageComponent {}
```

### Signals

```typescript
// src/app/entities/product/product.service.ts
import { Injectable, signal, computed, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProductService {
  // Private writable signals
  private readonly productsState = signal<Product[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  // Public readonly signals
  readonly products = this.productsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  // Computed signals
  readonly productCount = computed(() => this.productsState().length);
  readonly hasProducts = computed(() => this.productsState().length > 0);

  constructor() {
    // Side effects
    effect(() => {
      console.log('Products updated:', this.productsState().length);
    });
  }

  async loadProducts(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const products = await this.http.get<Product[]>('/api/products').toPromise();
      this.productsState.set(products ?? []);
    } catch (e) {
      this.errorState.set('Failed to load products');
    } finally {
      this.loadingState.set(false);
    }
  }

  addProduct(product: Product): void {
    this.productsState.update((products) => [...products, product]);
  }
}
```

### New Control Flow

```typescript
// ✅ GOOD: New control flow syntax (Angular 17+)
@Component({
  template: `
    @if (loading()) {
      <app-spinner />
    } @else if (error()) {
      <app-error [message]="error()" />
    } @else {
      @for (product of products(); track product.id) {
        <app-product-card [product]="product" />
      } @empty {
        <p>No products found</p>
      }
    }

    @switch (status()) {
      @case ('pending') {
        <span>Pending...</span>
      }
      @case ('completed') {
        <span>Done!</span>
      }
      @default {
        <span>Unknown</span>
      }
    }
  `,
})
export class ProductListComponent {
  private productService = inject(ProductService);

  products = this.productService.products;
  loading = this.productService.loading;
  error = this.productService.error;
}
```

### Inject Function

```typescript
// ✅ GOOD: inject() function
@Component({...})
export class ProductListComponent {
  private productService = inject(ProductService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
}

// ❌ AVOID: Constructor injection for simple cases
@Component({...})
export class ProductListComponent {
  constructor(
    private productService: ProductService,
    private router: Router,
  ) {}
}
```

### Input/Output Signals

```typescript
// Angular 17.1+
@Component({
  selector: 'app-product-card',
  template: `
    <div (click)="cardClicked.emit(product())">
      {{ product().name }}
    </div>
  `,
})
export class ProductCardComponent {
  // Required input
  product = input.required<Product>();

  // Optional input with default
  variant = input<'default' | 'compact'>('default');

  // Output
  cardClicked = output<Product>();
}
```

## HTTP Patterns

### Functional Interceptors

```typescript
// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withInterceptors([authInterceptor]))],
};
```

### API Service

```typescript
// src/app/entities/product/product-api.service.ts
@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private http = inject(HttpClient);
  private baseUrl = '/api/products';

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseUrl);
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  create(product: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, product);
  }

  update(id: string, product: UpdateProductDto): Observable<Product> {
    return this.http.patch<Product>(`${this.baseUrl}/${id}`, product);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
```

## Routing

### Functional Guards

```typescript
// src/app/core/guards/auth.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

// app.routes.ts
export const routes: Routes = [
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component'),
  },
];
```

## Testing

### Component Test

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductCardComponent } from './product-card.component';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
  });

  it('displays product name', () => {
    fixture.componentRef.setInput('product', { id: '1', name: 'Test', price: 100 });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Test');
  });

  it('emits cardClicked on click', () => {
    const product = { id: '1', name: 'Test', price: 100 };
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();

    const spy = jest.spyOn(component.cardClicked, 'emit');
    fixture.nativeElement.querySelector('div').click();

    expect(spy).toHaveBeenCalledWith(product);
  });
});
```

### Service Test

```typescript
import { TestBed } from '@angular/core/testing';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductService);
  });

  it('starts with empty products', () => {
    expect(service.products()).toEqual([]);
  });

  it('adds product to state', () => {
    const product = { id: '1', name: 'Test', price: 100 };
    service.addProduct(product);

    expect(service.products()).toContain(product);
    expect(service.productCount()).toBe(1);
  });
});
```

### NX Testing Commands

```bash
# Run all tests
npx nx run-many --target=test --all

# Run affected tests only (recommended for CI)
npx nx affected:test

# Test specific library
npx nx test shared-ui

# Test with coverage
npx nx test shared-ui --coverage

# Watch mode for development
npx nx test shared-ui --watch
```

### NX Library Test Example

```typescript
// libs/shared/ui/src/lib/button/button.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
  });

  it('applies primary variant by default', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').className).toContain('primary');
  });

  it('applies secondary variant when specified', () => {
    fixture.componentRef.setInput('variant', 'secondary');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').className).toContain('secondary');
  });
});
```

## Change Detection

```typescript
// OnPush for performance
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ product().name }}`,
})
export class ProductCardComponent {
  product = input.required<Product>();
}
```

## Common Mistakes

### General

1. **Not using OnPush** - Performance issues
2. **Forgetting unsubscribe** - Memory leaks (use `takeUntilDestroyed()`)
3. **Not using track** - DOM thrashing in `@for` loops
4. **Constructor over inject()** - Verbose code
5. **NgModule for new projects** - Use standalone

### NX Specific

1. **Circular dependencies** - Use `nx graph` to visualize and fix
2. **Not using affected** - Running all tests instead of changed only
3. **Missing index.ts exports** - Library public API not exposed
4. **Direct lib imports** - Always use path aliases (`@myorg/*`)
5. **Skipping library boundaries** - Respect NX module boundaries lint rule

## Related Patterns

- [Routing](./patterns/ROUTING.md)
- [State Management](./patterns/STATE_MANAGEMENT.md)
- [Forms](./patterns/FORMS.md)
- [Error Handling](./patterns/ERROR_HANDLING.md)
- [Authentication](./patterns/AUTHENTICATION.md)
- [Performance](./patterns/PERFORMANCE.md)
- [API Mocking](./patterns/API_MOCKING.md)
- [Accessibility](./patterns/ACCESSIBILITY.md)
