# Performance Patterns

## Core Web Vitals

| Metric | Target | Measures |
|--------|--------|----------|
| LCP | < 2.5s | Largest content paint |
| INP | < 200ms | Interaction to Next Paint |
| CLS | < 0.1 | Cumulative layout shift |

## Bundle Optimization

### Code Splitting

```typescript
// Route-based (automatic chunks)
const ProductsPage = lazy(() => import('@/pages/products'));

// Component-based
const HeavyChart = lazy(() => 
  import('./HeavyChart').then(m => ({ default: m.HeavyChart }))
);

// Named chunks for debugging
const AdminPanel = lazy(() => 
  import(/* webpackChunkName: "admin" */ '@/pages/admin')
);
```

### Tree Shaking

```typescript
// ❌ BAD: Imports entire library
import _ from 'lodash';
_.debounce(fn, 300);

// ✅ GOOD: Named import
import { debounce } from 'lodash-es';
debounce(fn, 300);

// ✅ BEST: Specific import
import debounce from 'lodash-es/debounce';
debounce(fn, 300);
```

### Bundle Analysis

```bash
# Vite
npx vite-bundle-visualizer

# Webpack
npx webpack-bundle-analyzer dist/stats.json
```

## React Performance

### Avoid Unnecessary Re-renders

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

### memo() Correctly

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

### useCallback/useMemo Guidelines

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

## Image Optimization

```tsx
// Lazy loading
<img src={src} alt={alt} loading="lazy" />

// Responsive images
<img
  src={src}
  srcSet={`${src}?w=400 400w, ${src}?w=800 800w`}
  sizes="(max-width: 600px) 400px, 800px"
  alt={alt}
/>

// Next.js Image (automatic optimization)
import Image from 'next/image';
<Image src={src} alt={alt} width={800} height={600} />

// Aspect ratio to prevent CLS
<div style={{ aspectRatio: '16/9' }}>
  <img src={src} alt={alt} loading="lazy" />
</div>
```

## Font Optimization

```css
/* Preload critical fonts */
<link rel="preload" href="/fonts/Inter.woff2" as="font" type="font/woff2" crossorigin>

/* Font display swap */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter.woff2') format('woff2');
  font-display: swap;
}

/* Subset fonts */
/* Use tools like glyphhanger to subset */
```

## Prefetching

```tsx
// Link prefetch
<Link to="/products" prefetch="intent">Products</Link>

// Manual prefetch
function NavLink({ to }: { to: string }) {
  const prefetch = () => {
    // Prefetch route component
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

// TanStack Query prefetch
function ProductList() {
  const queryClient = useQueryClient();

  const prefetchProduct = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['product', id],
      queryFn: () => getProduct(id),
    });
  };

  return (
    <div onMouseEnter={() => prefetchProduct(product.id)}>
      {product.name}
    </div>
  );
}
```

## Angular Performance

```typescript
// OnPush change detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent {}

// trackBy for ngFor
@for (product of products(); track product.id) {
  <app-product-card [product]="product" />
}

// Lazy loading modules
{
  path: 'admin',
  loadChildren: () => import('./admin/admin.routes'),
}
```

## Monitoring

```typescript
// Web Vitals
import { onLCP, onINP, onCLS } from 'web-vitals';

onLCP(console.log);
onINP(console.log);
onCLS(console.log);

// Performance marks
performance.mark('component-start');
// ... render
performance.mark('component-end');
performance.measure('component-render', 'component-start', 'component-end');
```

## Checklist

- [ ] Bundle < 200KB initial JS
- [ ] Code splitting per route
- [ ] Images lazy loaded
- [ ] Fonts optimized
- [ ] Lists virtualized (100+ items)
- [ ] No layout shifts
- [ ] Prefetching implemented
- [ ] Web Vitals monitored
