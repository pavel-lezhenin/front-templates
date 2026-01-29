# React Framework Guide

## Project Structure (FSD)

```
src/
├── app/                    # Application layer
│   ├── App.tsx
│   ├── router.tsx
│   ├── providers.tsx
│   └── styles/
├── pages/                  # Page components (composition only)
│   ├── home/
│   │   └── index.tsx
│   └── products/
│       └── index.tsx
├── widgets/                # Composite UI blocks
│   ├── header/
│   ├── product-list/
│   └── layouts/
├── features/               # User interactions
│   ├── auth/
│   ├── cart/
│   └── product-filter/
├── entities/               # Business entities
│   ├── user/
│   └── product/
└── shared/                 # Reusable code
    ├── api/
    ├── ui/
    ├── lib/
    └── config/
```

## Stack Defaults

| Concern      | Library               |
| ------------ | --------------------- |
| Build        | Vite                  |
| Styling      | Tailwind CSS          |
| Client State | Zustand               |
| Server State | TanStack Query        |
| Forms        | React Hook Form + Zod |
| Routing      | React Router v6       |
| Testing      | Vitest + RTL          |
| E2E          | Playwright            |
| Mocking      | MSW                   |

## Component Patterns

### Function Components Only

```tsx
// ✅ GOOD
function ProductCard({ product }: ProductCardProps) {
  return <div>{product.name}</div>;
}

// ❌ AVOID: Class components
class ProductCard extends Component {}
```

### Props Interface

```tsx
interface ProductCardProps {
  /** Product data */
  product: Product;
  /** Called when add to cart clicked */
  onAddToCart?: (product: Product) => void;
  /** Visual variant */
  variant?: 'default' | 'compact';
}

export function ProductCard({ product, onAddToCart, variant = 'default' }: ProductCardProps) {
  // ...
}
```

### Composition Pattern

```tsx
// Compound components
function Card({ children }: { children: ReactNode }) {
  return <div className="card">{children}</div>;
}

Card.Header = function CardHeader({ children }: { children: ReactNode }) {
  return <div className="card-header">{children}</div>;
};

Card.Body = function CardBody({ children }: { children: ReactNode }) {
  return <div className="card-body">{children}</div>;
};

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>;
```

## Hooks Patterns

### Custom Hook Structure

```typescript
// src/entities/product/model/use-product.ts
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../api/product-api';

export function useProduct(id: string) {
  const query = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getById(id),
    enabled: !!id,
  });

  return {
    product: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
```

### useEffect Patterns

```tsx
// Cleanup required
useEffect(() => {
  const controller = new AbortController();

  fetchData({ signal: controller.signal });

  return () => controller.abort();
}, []);

// Event listeners
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, [onClose]);
```

## Performance

### Memoization

```tsx
// Memo for expensive renders
const ExpensiveList = memo(function ExpensiveList({ items }: Props) {
  return items.map((item) => <ExpensiveItem key={item.id} item={item} />);
});

// useMemo for expensive calculations
const sortedItems = useMemo(() => items.slice().sort((a, b) => a.price - b.price), [items]);

// useCallback for stable references
const handleClick = useCallback(
  (id: string) => {
    dispatch({ type: 'SELECT', id });
  },
  [dispatch]
);
```

### Code Splitting

```tsx
// Route-level splitting
const ProductsPage = lazy(() => import('@/pages/products'));

// Component-level splitting
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart data={data} />
    </Suspense>
  );
}
```

## Testing

### Component Test

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 100,
  };

  it('renders product name', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('calls onAddToCart when button clicked', async () => {
    const onAddToCart = vi.fn();
    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />);

    await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));

    expect(onAddToCart).toHaveBeenCalledWith(mockProduct);
  });
});
```

### Hook Test

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useProduct } from './use-product';
import { QueryProvider } from '@/test/providers';

describe('useProduct', () => {
  it('fetches product by id', async () => {
    const { result } = renderHook(() => useProduct('123'), {
      wrapper: QueryProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.product).toEqual(
      expect.objectContaining({
        id: '123',
      })
    );
  });
});
```

## File Naming

```
src/
├── features/
│   └── cart/
│       ├── index.ts           # Public API
│       ├── model/
│       │   ├── cart-store.ts  # Zustand store
│       │   └── types.ts       # TypeScript types
│       ├── api/
│       │   └── cart-api.ts    # API calls
│       ├── ui/
│       │   ├── CartButton.tsx # PascalCase components
│       │   └── CartButton.test.tsx
│       └── lib/
│           └── calculate-total.ts  # kebab-case utils
```

## Common Mistakes

1. **Business logic in pages** - Pages only compose
2. **Missing cleanup in useEffect** - Memory leaks
3. **Object/array in deps** - Infinite loops
4. **Not using Error Boundaries** - Crash entire app
5. **Over-memoization** - Premature optimization

## Related Patterns

- [Routing](./patterns/ROUTING.md)
- [State Management](./patterns/STATE_MANAGEMENT.md)
- [Forms](./patterns/FORMS.md)
- [Error Handling](./patterns/ERROR_HANDLING.md)
- [Authentication](./patterns/AUTHENTICATION.md)
- [Performance](./patterns/PERFORMANCE.md)
- [Accessibility](./patterns/ACCESSIBILITY.md)
- [API Mocking](./patterns/API_MOCKING.md)
