# Angular Framework Guide

## Project Structure (Modular)

```
src/
├── app/
│   ├── app.component.ts
│   ├── app.config.ts
│   ├── app.routes.ts
│   └── core/                 # Singleton services, guards, interceptors
│       ├── auth/
│       ├── interceptors/
│       └── guards/
├── pages/                    # Route components (composition only)
│   ├── home/
│   ├── products/
│   └── dashboard/
├── features/                 # Feature-specific components and logic
│   ├── cart/
│   ├── product-filter/
│   └── checkout/
├── entities/                 # Domain models and services
│   ├── user/
│   └── product/
└── shared/                   # Reusable components, directives, pipes
    ├── ui/
    ├── directives/
    ├── pipes/
    └── utils/
```

## Stack Defaults

| Concern | Library            |
| ------- | ------------------ |
| Build   | Angular CLI        |
| Styling | SCSS               |
| State   | Signals + Services |
| Forms   | Reactive Forms     |
| HTTP    | HttpClient         |
| Testing | Jest               |
| E2E     | Playwright         |
| Mocking | MSW                |

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

1. **Not using OnPush** - Performance issues
2. **Forgetting unsubscribe** - Memory leaks
3. **Not using trackBy** - DOM thrashing
4. **Constructor over inject()** - Verbose code
5. **NgModule for new projects** - Use standalone

## Related Patterns

- [Routing](./patterns/ROUTING.md)
- [State Management](./patterns/STATE_MANAGEMENT.md)
- [Forms](./patterns/FORMS.md)
- [Error Handling](./patterns/ERROR_HANDLING.md)
- [Authentication](./patterns/AUTHENTICATION.md)
- [Performance](./patterns/PERFORMANCE.md)
- [API Mocking](./patterns/API_MOCKING.md)
