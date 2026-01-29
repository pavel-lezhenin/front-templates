# Performance Patterns

> General performance concepts and metrics. For framework-specific implementations see:
> - [React Performance](../framework/react/patterns/PERFORMANCE.md) - memo, useMemo, Suspense
> - [Angular Performance](../framework/angular/patterns/PERFORMANCE.md) - OnPush, Signals, defer

## Core Web Vitals

| Metric | Target | Measures |
|--------|--------|----------|
| LCP | < 2.5s | Largest Contentful Paint - loading |
| INP | < 200ms | Interaction to Next Paint - responsiveness |
| CLS | < 0.1 | Cumulative Layout Shift - visual stability |

## Bundle Optimization

### Code Splitting

Split your bundle by:
1. **Routes** - Each page in separate chunk
2. **Components** - Heavy components loaded on demand
3. **Vendors** - Third-party libraries in separate chunks

### Tree Shaking

\\\	ypescript
// ❌ BAD: Imports entire library
import _ from 'lodash';

// ✅ GOOD: Named import
import { debounce } from 'lodash-es';

// ✅ BEST: Specific import
import debounce from 'lodash-es/debounce';
\\\

### Bundle Analysis

Monitor bundle size in CI:
- Set budget limits (e.g., main < 200KB)
- Alert on significant increases
- Visualize with bundle analyzers

## Rendering Optimization

### Avoid Unnecessary Re-renders

| Problem | Solution |
|---------|----------|
| New object reference each render | Memoize objects |
| New function reference each render | Memoize callbacks |
| Expensive computation | Cache results |
| Large lists | Virtualization |

### Virtualization

Use virtual scrolling for lists > 100 items:
- Only render visible items
- Recycle DOM nodes
- Maintain scroll position

## Data Fetching

### Caching Strategy

| Data Type | Cache Duration | Invalidation |
|-----------|---------------|--------------|
| User profile | Until logout | On profile update |
| Product list | 5 minutes | On mutation |
| Search results | 1 minute | On new search |
| Static content | 1 hour+ | Rarely |

### Prefetching

Prefetch data user is likely to need:
- On hover (link/button)
- On route transition start
- Based on user behavior patterns

## Image Optimization

### Checklist

- [ ] Use modern formats (WebP, AVIF)
- [ ] Serve responsive sizes (srcset)
- [ ] Lazy load below-fold images
- [ ] Set explicit dimensions (prevent CLS)
- [ ] Use CDN with caching
- [ ] Compress appropriately

### Loading Strategy

| Position | Strategy |
|----------|----------|
| Above fold | Eager load, priority hint |
| Below fold | Lazy load |
| Background | Low priority |

## JavaScript Performance

### Debouncing & Throttling

| Technique | Use Case | Example |
|-----------|----------|---------|
| Debounce | Wait until user stops | Search input |
| Throttle | Limit frequency | Scroll handler |

### Web Workers

Offload heavy computation:
- Data processing
- Image manipulation
- Complex calculations

## Measurement

### Performance Budgets

| Resource | Budget |
|----------|--------|
| HTML | < 50KB |
| CSS | < 100KB |
| JS (initial) | < 200KB |
| Images (above fold) | < 500KB |
| Total page | < 1MB |

### Monitoring

Track in production:
- Core Web Vitals
- Time to Interactive
- First Contentful Paint
- Bundle size over time

## Anti-Patterns

| ❌ Avoid | ✅ Prefer |
|----------|----------|
| Premature optimization | Measure first |
| Memoizing everything | Memoize when needed |
| Inline styles/objects | Stable references |
| Render-blocking resources | Async/defer loading |
| Unoptimized images | Compressed, lazy-loaded |
| Monolithic bundles | Code splitting |

## Performance Checklist

### Initial Load
- [ ] Code splitting by routes
- [ ] Critical CSS inlined
- [ ] Non-critical JS deferred
- [ ] Images optimized and lazy-loaded
- [ ] Fonts preloaded

### Runtime
- [ ] No unnecessary re-renders
- [ ] Lists virtualized (if large)
- [ ] Heavy computation memoized
- [ ] Event handlers debounced/throttled
- [ ] Memory leaks prevented

### Network
- [ ] API responses cached
- [ ] Data prefetched when appropriate
- [ ] Offline support (if needed)
- [ ] CDN for static assets
