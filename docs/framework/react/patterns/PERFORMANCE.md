# React Performance Patterns

> React-specific optimization techniques. For general concepts see [Performance Patterns](../../patterns/PERFORMANCE.md)

## Avoid Unnecessary Re-renders

```tsx
// ❌ BAD: New object every render
<Component style={{ color: 'red' }} />

// ✅ GOOD: Stable reference
const style = useMemo(() => ({ color: 'red' }), []);
<Component style={style} />

// ❌ BAD: Inline function
<List items={items.filter(i => i.active)} />

// ✅ GOOD: Memoized
const activeItems = useMemo(() => items.filter(i => i.active), [items]);
<List items={activeItems} />
```

## memo() Correctly

```tsx
// Only memo when:
// 1. Component renders often with same props
// 2. Component is expensive to render
// 3. Parent renders often

// ✅ GOOD: Expensive list item
const ProductCard = memo(function ProductCard({ product }: Props) {
  return <ExpensiveRender product={product} />;
});

// ❌ UNNECESSARY: Simple component
const Button = memo(function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
});
```

## useCallback/useMemo Guidelines

```tsx
// useCallback for:
// 1. Event handlers passed to memoized children
// 2. Dependencies of useEffect
// 3. Context values

const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// useMemo for:
// 1. Expensive calculations
// 2. Referential equality in deps
// 3. Context values

const sortedItems = useMemo(
  () => [...items].sort((a, b) => a.price - b.price), 
  [items]
);
```

## Code Splitting

```tsx
// Route-based (automatic chunks)
const ProductsPage = lazy(() => import('@/pages/products'));

// Component-based
const HeavyChart = lazy(() => 
  import('./HeavyChart').then((m) => ({ default: m.HeavyChart }))
);

// Named chunks for debugging
const AdminPanel = lazy(() => 
  import(/* webpackChunkName: "admin" */ '@/pages/admin')
);

// With Suspense
function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart data={data} />
    </Suspense>
  );
}
```

## List Virtualization

```tsx
// Large lists (100+ items)
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualItem.start}px)`,
              height: `${virtualItem.size}px`,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## TanStack Query Prefetching

```tsx
function ProductList() {
  const queryClient = useQueryClient();

  const prefetchProduct = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['product', id],
      queryFn: () => getProduct(id),
    });
  };

  return products.map((product) => (
    <div 
      key={product.id}
      onMouseEnter={() => prefetchProduct(product.id)}
    >
      {product.name}
    </div>
  ));
}
```

## Route Prefetching

```tsx
function NavLink({ to, children }: NavLinkProps) {
  const prefetch = () => {
    if (to === '/products') {
      import('@/pages/products');
    }
  };

  return (
    <Link to={to} onMouseEnter={prefetch}>
      {children}
    </Link>
  );
}
```

## Image Optimization

```tsx
// Lazy loading
<img src={src} alt={alt} loading="lazy" />

// Aspect ratio to prevent CLS
<div style={{ aspectRatio: '16/9' }}>
  <img src={src} alt={alt} loading="lazy" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
</div>

// Next.js Image (if using Next)
import Image from 'next/image';
<Image src={src} alt={alt} width={800} height={600} />
```

## Context Optimization

```tsx
// Split contexts to avoid unnecessary re-renders
const UserContext = createContext<User | null>(null);
const UserActionsContext = createContext<UserActions | null>(null);

function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Stable actions object
  const actions = useMemo(
    () => ({
      login: async (credentials: Credentials) => { /* ... */ },
      logout: () => setUser(null),
    }),
    []
  );

  return (
    <UserContext.Provider value={user}>
      <UserActionsContext.Provider value={actions}>
        {children}
      </UserActionsContext.Provider>
    </UserContext.Provider>
  );
}

// Components that only need user data
function UserInfo() {
  const user = useContext(UserContext); // Won't re-render when actions change
}

// Components that only need actions
function LoginButton() {
  const actions = useContext(UserActionsContext); // Won't re-render when user changes
}
```

## Debounced Search

```tsx
function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchApi(debouncedQuery),
    enabled: debouncedQuery.length > 2,
  });

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}

// useDebouncedValue hook
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```
