# React State Management Patterns

> Zustand + TanStack Query implementation. For general concepts see [State Management Patterns](../../patterns/STATE_MANAGEMENT.md)

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

### Query Keys Factory

```typescript
// src/entities/product/api/product-keys.ts
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};
```

### Query Hook

```typescript
// src/entities/product/api/use-products.ts
import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/shared/api';
import { productKeys } from './product-keys';

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => productApi.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productApi.getProduct(id),
    enabled: !!id,
  });
}
```

### Mutation with Optimistic Updates

```typescript
// src/features/product/api/use-update-product.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '@/shared/api';
import { productKeys } from '@/entities/product';

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productApi.updateProduct,
    
    onMutate: async (updated) => {
      // Cancel outgoing fetches
      await queryClient.cancelQueries({ 
        queryKey: productKeys.detail(updated.id) 
      });

      // Snapshot previous value
      const previous = queryClient.getQueryData(
        productKeys.detail(updated.id)
      );

      // Optimistic update
      queryClient.setQueryData(
        productKeys.detail(updated.id), 
        updated
      );

      return { previous };
    },
    
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(
          productKeys.detail(variables.id), 
          context.previous
        );
      }
    },
    
    onSettled: (_data, _error, variables) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: productKeys.detail(variables.id) 
      });
    },
  });
}
```

### Mutation with Cache Invalidation

```typescript
// src/features/product/api/use-create-product.ts
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productApi.createProduct,
    onSuccess: () => {
      // Invalidate all list queries
      queryClient.invalidateQueries({ 
        queryKey: productKeys.lists() 
      });
    },
  });
}
```

## Query Provider Setup

```tsx
// src/app/providers/query-provider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## Combining Zustand + Query

```typescript
// Server state: TanStack Query
const { data: products, isLoading } = useProducts(filters);

// Client state: Zustand
const { selectedIds, toggleSelect } = useSelectionStore();

// Derived
const selectedProducts = products?.filter(p => selectedIds.includes(p.id));
```
