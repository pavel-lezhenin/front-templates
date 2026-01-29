# Angular State Management Patterns

> Signals + Services implementation. For general concepts see [State Management Patterns](../../patterns/STATE_MANAGEMENT.md)

## Signals-Based State

### Basic Service with Signals

```typescript
// src/app/entities/user/user.service.ts
import { Injectable, signal, computed } from '@angular/core';

interface User {
  id: string;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  // Private writable signal
  private readonly userState = signal<User | null>(null);

  // Public readonly signal
  readonly user = this.userState.asReadonly();

  // Computed signals
  readonly isLoggedIn = computed(() => this.userState() !== null);
  readonly userName = computed(() => this.userState()?.name ?? 'Guest');

  setUser(user: User | null): void {
    this.userState.set(user);
  }

  updateName(name: string): void {
    this.userState.update((user) => 
      user ? { ...user, name } : null
    );
  }

  logout(): void {
    this.userState.set(null);
  }
}
```

### Feature Store with Signals

```typescript
// src/app/features/cart/cart.service.ts
import { Injectable, signal, computed, effect } from '@angular/core';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  // State
  private readonly itemsState = signal<CartItem[]>([]);

  // Public readonly
  readonly items = this.itemsState.asReadonly();

  // Computed
  readonly itemCount = computed(() => 
    this.itemsState().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly total = computed(() =>
    this.itemsState().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  readonly isEmpty = computed(() => this.itemsState().length === 0);

  constructor() {
    // Persist to localStorage
    effect(() => {
      localStorage.setItem('cart', JSON.stringify(this.itemsState()));
    });

    // Restore from localStorage
    const saved = localStorage.getItem('cart');
    if (saved) {
      this.itemsState.set(JSON.parse(saved));
    }
  }

  addItem(item: Omit<CartItem, 'quantity'>): void {
    this.itemsState.update((items) => {
      const existing = items.find((i) => i.id === item.id);
      if (existing) {
        return items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...items, { ...item, quantity: 1 }];
    });
  }

  removeItem(id: string): void {
    this.itemsState.update((items) => items.filter((i) => i.id !== id));
  }

  updateQuantity(id: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(id);
      return;
    }
    this.itemsState.update((items) =>
      items.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  }

  clearCart(): void {
    this.itemsState.set([]);
  }
}
```

## Server State with HttpClient

### API Service

```typescript
// src/app/entities/product/product-api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private http = inject(HttpClient);
  private baseUrl = '/api/products';

  getAll(filters?: ProductFilters): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseUrl, { params: filters as any });
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

### State Service with Loading/Error

```typescript
// src/app/entities/product/product.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { ProductApiService } from './product-api.service';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private api = inject(ProductApiService);

  // State signals
  private readonly productsState = signal<Product[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly selectedIdState = signal<string | null>(null);

  // Public readonly
  readonly products = this.productsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly selectedId = this.selectedIdState.asReadonly();

  // Computed
  readonly selectedProduct = computed(() => {
    const id = this.selectedIdState();
    return this.productsState().find((p) => p.id === id) ?? null;
  });

  readonly productCount = computed(() => this.productsState().length);

  async loadProducts(filters?: ProductFilters): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const products = await firstValueFrom(this.api.getAll(filters));
      this.productsState.set(products);
    } catch (e) {
      this.errorState.set('Failed to load products');
      console.error(e);
    } finally {
      this.loadingState.set(false);
    }
  }

  selectProduct(id: string | null): void {
    this.selectedIdState.set(id);
  }

  // Optimistic update
  async updateProduct(id: string, updates: UpdateProductDto): Promise<void> {
    const previous = this.productsState();
    
    // Optimistic update
    this.productsState.update((products) =>
      products.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    try {
      await firstValueFrom(this.api.update(id, updates));
    } catch (e) {
      // Rollback on error
      this.productsState.set(previous);
      this.errorState.set('Failed to update product');
    }
  }
}
```

## Component Usage

```typescript
// src/app/pages/products/products.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { ProductService } from '@/entities/product';
import { CartService } from '@/features/cart';

@Component({
  selector: 'app-products',
  standalone: true,
  template: `
    @if (productService.loading()) {
      <app-spinner />
    } @else if (productService.error()) {
      <app-error [message]="productService.error()" />
    } @else {
      <div class="products-grid">
        @for (product of productService.products(); track product.id) {
          <app-product-card 
            [product]="product"
            (addToCart)="cartService.addItem($event)"
          />
        }
      </div>
    }

    <app-cart-summary [total]="cartService.total()" />
  `,
})
export class ProductsComponent implements OnInit {
  productService = inject(ProductService);
  cartService = inject(CartService);

  ngOnInit(): void {
    this.productService.loadProducts();
  }
}
```

## RxJS Interop

```typescript
import { toSignal, toObservable } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private route = inject(ActivatedRoute);
  
  // Convert Observable to Signal
  readonly searchQuery = toSignal(
    this.route.queryParams.pipe(
      map(params => params['q'] ?? '')
    ),
    { initialValue: '' }
  );
  
  // Convert Signal to Observable (for HTTP requests)
  readonly searchResults$ = toObservable(this.searchQuery).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(query => this.api.search(query))
  );
}
```

## State Organization

```
entities/
├── user/
│   ├── user.service.ts        # State + computed
│   └── user-api.service.ts    # HTTP calls
├── product/
│   ├── product.service.ts
│   └── product-api.service.ts
features/
├── cart/
│   └── cart.service.ts        # Feature-specific state
└── auth/
    └── auth.service.ts
```
