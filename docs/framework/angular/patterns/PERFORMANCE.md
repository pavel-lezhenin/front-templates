# Angular Performance Patterns

> Angular-specific optimization techniques. For general concepts see [Performance Patterns](../../patterns/PERFORMANCE.md)

## OnPush Change Detection

```typescript
// Always use OnPush for better performance
@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

## Signals for Reactive State

```typescript
// Signals automatically work with OnPush
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>Count: {{ count() }}</p>
    <p>Double: {{ doubleCount() }}</p>
    <button (click)="increment()">+1</button>
  `,
})
export class CounterComponent {
  count = signal(0);
  doubleCount = computed(() => this.count() * 2);

  increment() {
    this.count.update((c) => c + 1);
  }
}
```

## trackBy for Lists

```typescript
// Always use track for @for loops
@Component({
  template: `
    @for (product of products(); track product.id) {
      <app-product-card [product]="product" />
    }
  `,
})
export class ProductListComponent {
  products = input.required<Product[]>();
}

// For ngFor (legacy)
@Component({
  template: `
    <app-product-card 
      *ngFor="let product of products; trackBy: trackById"
      [product]="product"
    />
  `,
})
export class ProductListComponent {
  trackById(index: number, product: Product): string {
    return product.id;
  }
}
```

## Lazy Loading Routes

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
  },
  {
    path: 'products',
    loadComponent: () => import('./products/products.component'),
  },
];
```

## Defer for Heavy Content

```typescript
// Angular 17+ defer blocks
@Component({
  template: `
    <div class="page">
      <header>Always visible</header>
      
      @defer (on viewport) {
        <app-heavy-chart [data]="data()" />
      } @placeholder {
        <div class="chart-placeholder">Loading chart...</div>
      } @loading (minimum 500ms) {
        <app-spinner />
      }
      
      @defer (on interaction) {
        <app-comments [postId]="postId()" />
      } @placeholder {
        <button>Load Comments</button>
      }
    </div>
  `,
})
export class PostComponent {
  data = input.required<ChartData>();
  postId = input.required<string>();
}
```

## Virtual Scrolling

```typescript
// For large lists (100+ items)
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  standalone: true,
  imports: [ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="viewport">
      <div *cdkVirtualFor="let item of items; trackBy: trackById" class="item">
        {{ item.name }}
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .viewport {
      height: 400px;
    }
    .item {
      height: 50px;
    }
  `],
})
export class VirtualListComponent {
  items = input.required<Item[]>();

  trackById(index: number, item: Item): string {
    return item.id;
  }
}
```

## Pure Pipes

```typescript
// Pipes are pure by default - good for performance
@Pipe({
  name: 'filterActive',
  standalone: true,
  pure: true, // default
})
export class FilterActivePipe implements PipeTransform {
  transform(items: Item[]): Item[] {
    return items.filter((item) => item.active);
  }
}

// Usage
@Component({
  template: `
    @for (item of items() | filterActive; track item.id) {
      <app-item [item]="item" />
    }
  `,
})
export class ItemListComponent {}
```

## Avoid Excessive Template Expressions

```typescript
// ❌ BAD: Complex calculation in template
@Component({
  template: `
    <p>Total: {{ items.reduce((sum, i) => sum + i.price, 0) | currency }}</p>
  `,
})

// ✅ GOOD: Use computed signal
@Component({
  template: `<p>Total: {{ total() | currency }}</p>`,
})
export class CartComponent {
  items = input.required<CartItem[]>();
  total = computed(() => 
    this.items().reduce((sum, i) => sum + i.price, 0)
  );
}
```

## Image Optimization

```typescript
// NgOptimizedImage directive
import { NgOptimizedImage } from '@angular/common';

@Component({
  standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <img 
      ngSrc="/images/hero.jpg"
      width="800"
      height="600"
      priority
      alt="Hero image"
    />
    
    <!-- Lazy loaded by default -->
    <img 
      ngSrc="/images/product.jpg"
      width="400"
      height="300"
      alt="Product"
    />
  `,
})
export class HeroComponent {}
```

## Preloading Strategy

```typescript
// Custom preloading strategy
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
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

## Service Worker / PWA

```typescript
// Enable service worker
// app.config.ts
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
```

## Web Workers

```typescript
// Offload heavy computation
if (typeof Worker !== 'undefined') {
  const worker = new Worker(new URL('./heavy.worker', import.meta.url));
  worker.postMessage({ data: largeDataset });
  worker.onmessage = ({ data }) => {
    this.result.set(data);
  };
}

// heavy.worker.ts
addEventListener('message', ({ data }) => {
  const result = performHeavyCalculation(data);
  postMessage(result);
});
```
