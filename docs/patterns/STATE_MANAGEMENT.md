# State Management Patterns

## Overview

Client state with Zustand, server state with TanStack Query.

## Client State (Zustand)

### Basic Store

```typescript
// src/entities/user/model/user-store.ts
import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  updateName: (name: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateName: (name) =>
    set((state) => ({
      user: state.user ? { ...state.user, name } : null,
    })),
}));
```

### Store with Middleware

```typescript
// src/features/cart/model/cart-store.ts
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      immer((set, get) => ({
        items: [],

        addItem: (item) =>
          set((state) => {
            const existing = state.items.find((i) => i.id === item.id);
            if (existing) {
              existing.quantity += 1;
            } else {
              state.items.push({ ...item, quantity: 1 });
            }
          }),

        removeItem: (id) =>
          set((state) => {
            state.items = state.items.filter((i) => i.id !== id);
          }),

        updateQuantity: (id, quantity) =>
          set((state) => {
            const item = state.items.find((i) => i.id === id);
            if (item) {
              item.quantity = quantity;
            }
          }),

        clearCart: () => set({ items: [] }),

        total: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      })),
      { name: 'cart-storage' }
    ),
    { name: 'CartStore' }
  )
);
```

### Selectors

```typescript
// Avoid re-renders with selectors
function CartTotal() {
  // ❌ BAD: Re-renders when any state changes
  const { items } = useCartStore();
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // ✅ GOOD: Only re-renders when total changes
  const total = useCartStore((state) =>
    state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  );

  return <span>{total}</span>;
}

// Shallow comparison for object selection
import { shallow } from 'zustand/shallow';

function UserInfo() {
  const { name, email } = useUserStore(
    (state) => ({ name: state.user?.name, email: state.user?.email }),
    shallow
  );
}
```

## Server State (TanStack Query)

### Query Hook

```typescript
// src/entities/product/api/use-products.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '@/shared/api';

// Keys factory
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

// Query hook
export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => productApi.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Single item
export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productApi.getProduct(id),
    enabled: !!id,
  });
}
```

### Mutation Hook

```typescript
// src/features/product/api/use-create-product.ts
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productApi.createProduct,
    onSuccess: () => {
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

// Optimistic update
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productApi.updateProduct,
    onMutate: async (updated) => {
      // Cancel outgoing fetches
      await queryClient.cancelQueries({ queryKey: productKeys.detail(updated.id) });

      // Snapshot previous
      const previous = queryClient.getQueryData(productKeys.detail(updated.id));

      // Optimistic update
      queryClient.setQueryData(productKeys.detail(updated.id), updated);

      return { previous };
    },
    onError: (_err, variables, context) => {
      // Rollback
      if (context?.previous) {
        queryClient.setQueryData(productKeys.detail(variables.id), context.previous);
      }
    },
    onSettled: (_data, _error, variables) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
    },
  });
}
```

## Angular State (Signals)

```typescript
// src/app/entities/product/product.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private productsSignal = signal<Product[]>([]);
  private selectedIdSignal = signal<string | null>(null);

  // Public readonly signals
  readonly products = this.productsSignal.asReadonly();
  readonly selectedId = this.selectedIdSignal.asReadonly();

  // Computed
  readonly selectedProduct = computed(() => {
    const id = this.selectedIdSignal();
    return this.productsSignal().find((p) => p.id === id) ?? null;
  });

  readonly totalProducts = computed(() => this.productsSignal().length);

  constructor(private http: HttpClient) {}

  loadProducts() {
    this.http.get<Product[]>('/api/products').subscribe({
      next: (products) => this.productsSignal.set(products),
    });
  }

  selectProduct(id: string) {
    this.selectedIdSignal.set(id);
  }

  addProduct(product: Product) {
    this.productsSignal.update((products) => [...products, product]);
  }
}
```

## When to Use What

| State Type  | Tool              | Examples                 |
| ----------- | ----------------- | ------------------------ |
| Server data | TanStack Query    | API responses, user data |
| UI state    | Zustand / Signals | Modal open, selected tab |
| Form state  | React Hook Form   | Form inputs              |
| URL state   | Router            | Filters, pagination      |
| Global app  | Zustand           | Theme, auth, cart        |

## Best Practices

1. **Separate server and client state**
2. **Use query keys factory** - Consistent invalidation
3. **Selectors for performance** - Avoid re-renders
4. **Optimistic updates** - Better UX
5. **Persist important state** - Cart, preferences
