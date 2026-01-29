# Angular Error Handling Patterns

> HttpInterceptor + Services implementation. For general concepts see [Error Handling Patterns](../../patterns/ERROR_HANDLING.md)

## Error Interceptor

```typescript
// src/app/core/interceptors/error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '@/shared/ui';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 400:
          // Validation errors - let the component handle
          break;
        case 401:
          toast.error('Session expired. Please login again.');
          router.navigate(['/login']);
          break;
        case 403:
          toast.error('You do not have permission to perform this action.');
          router.navigate(['/unauthorized']);
          break;
        case 404:
          toast.error('Resource not found.');
          break;
        case 500:
        case 502:
        case 503:
          toast.error('Server error. Please try again later.');
          break;
        default:
          if (!navigator.onLine) {
            toast.error('No internet connection.');
          } else {
            toast.error('An unexpected error occurred.');
          }
      }

      return throwError(() => error);
    })
  );
};

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([errorInterceptor])),
  ],
};
```

## Global Error Handler

```typescript
// src/app/core/error-handler/global-error-handler.ts
import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ToastService } from '@/shared/ui';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private toast = inject(ToastService);

  handleError(error: unknown): void {
    console.error('Unhandled error:', error);

    // Log to monitoring service
    // this.monitoringService.captureError(error);

    // Show user-friendly message
    if (error instanceof Error) {
      this.toast.error('An unexpected error occurred. Please try again.');
    }
  }
}

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};
```

## Error Service

```typescript
// src/app/core/errors/error.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private readonly errorState = signal<AppError | null>(null);

  readonly error = this.errorState.asReadonly();

  setError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      this.errorState.set({
        message: error.error?.message ?? 'Server error',
        code: error.error?.code,
        status: error.status,
        details: error.error?.details,
      });
    } else if (error instanceof Error) {
      this.errorState.set({
        message: error.message,
      });
    } else {
      this.errorState.set({
        message: 'Unknown error occurred',
      });
    }
  }

  clearError(): void {
    this.errorState.set(null);
  }

  isValidationError(error: HttpErrorResponse): boolean {
    return error.status === 400 && error.error?.code === 'VALIDATION_ERROR';
  }

  getValidationErrors(error: HttpErrorResponse): Record<string, string[]> {
    return error.error?.details?.fields ?? {};
  }
}
```

## Component Error Handling

```typescript
// src/app/pages/products/products.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { ProductService } from '@/entities/product';

@Component({
  selector: 'app-products',
  standalone: true,
  template: `
    @if (productService.loading()) {
      <app-spinner />
    } @else if (productService.error()) {
      <div class="error-container" role="alert">
        <h2>Failed to load products</h2>
        <p>{{ productService.error() }}</p>
        <button (click)="retry()">Try Again</button>
      </div>
    } @else {
      @for (product of productService.products(); track product.id) {
        <app-product-card [product]="product" />
      } @empty {
        <p>No products found</p>
      }
    }
  `,
})
export class ProductsComponent implements OnInit {
  productService = inject(ProductService);

  ngOnInit(): void {
    this.productService.loadProducts();
  }

  retry(): void {
    this.productService.loadProducts();
  }
}
```

## Service with Error Handling

```typescript
// src/app/entities/product/product.service.ts
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap, finalize, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  private readonly productsState = signal<Product[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly products = this.productsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  loadProducts(): void {
    this.loadingState.set(true);
    this.errorState.set(null);

    this.http.get<Product[]>('/api/products').pipe(
      tap((products) => this.productsState.set(products)),
      catchError((error: HttpErrorResponse) => {
        this.errorState.set(this.getErrorMessage(error));
        return of([]);
      }),
      finalize(() => this.loadingState.set(false))
    ).subscribe();
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Unable to connect to server. Check your internet connection.';
    }
    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }
    return error.error?.message ?? 'Failed to load products';
  }
}
```

## Form Validation Errors

```typescript
// Map server validation errors to form controls
handleServerErrors(error: HttpErrorResponse, form: FormGroup): void {
  if (error.status === 400 && error.error?.fields) {
    Object.entries(error.error.fields as Record<string, string[]>).forEach(
      ([field, messages]) => {
        const control = form.get(field);
        if (control) {
          control.setErrors({ serverError: messages[0] });
        }
      }
    );
  }
}
```

## Retry Mechanism

```typescript
// src/app/shared/lib/retry.ts
import { Observable, timer } from 'rxjs';
import { retry, retryWhen, scan, delayWhen } from 'rxjs/operators';

export function retryWithBackoff<T>(maxRetries = 3, delayMs = 1000) {
  return (source: Observable<T>) =>
    source.pipe(
      retryWhen((errors) =>
        errors.pipe(
          scan((retryCount, error) => {
            if (retryCount >= maxRetries) {
              throw error;
            }
            return retryCount + 1;
          }, 0),
          delayWhen((retryCount) => timer(delayMs * Math.pow(2, retryCount)))
        )
      )
    );
}

// Usage
this.http.get('/api/data').pipe(retryWithBackoff(3, 1000)).subscribe();
```
