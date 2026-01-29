# Angular Authentication Patterns

> Signals + Functional Guards implementation. For general concepts see [Authentication Patterns](../../patterns/AUTHENTICATION.md)

## Auth Service

```typescript
// src/app/core/auth/auth.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, of } from 'rxjs';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // State
  private readonly userState = signal<User | null>(null);
  private readonly loadingState = signal(true);

  // Public readonly signals
  readonly user = this.userState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);
  readonly isAdmin = computed(() => this.userState()?.role === 'admin');

  constructor() {
    this.checkAuth();
  }

  private checkAuth(): void {
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.loadingState.set(false);
      return;
    }

    this.http.get<User>('/api/auth/me').pipe(
      catchError(() => {
        this.clearTokens();
        return of(null);
      })
    ).subscribe({
      next: (user) => {
        this.userState.set(user);
        this.loadingState.set(false);
      },
    });
  }

  login(email: string, password: string) {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap(({ accessToken, refreshToken, user }) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        this.userState.set(user);
      })
    );
  }

  logout(): void {
    this.clearTokens();
    this.userState.set(null);
    this.router.navigate(['/login']);
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http.post<{ accessToken: string }>('/api/auth/refresh', { refreshToken }).pipe(
      tap(({ accessToken }) => {
        localStorage.setItem('access_token', accessToken);
      })
    );
  }
}
```

## Functional Guards

```typescript
// src/app/core/guards/auth.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for initial auth check
  if (authService.loading()) {
    return new Promise((resolve) => {
      const checkAuth = setInterval(() => {
        if (!authService.loading()) {
          clearInterval(checkAuth);
          resolve(authService.isAuthenticated() 
            ? true 
            : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })
          );
        }
      }, 50);
    });
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

// Role guard
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/unauthorized']);
};

// Guest only guard (for login page)
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
```

## Route Configuration

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from '@/core/guards';

export const routes: Routes = [
  // Public routes
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component'),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register.component'),
  },

  // Protected routes
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component'),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.component'),
  },

  // Admin routes
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./pages/admin/admin.routes'),
  },

  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found.component') },
];
```

## Auth Interceptor

```typescript
// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = localStorage.getItem('access_token');

  // Add token to request
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        // Try to refresh token
        return authService.refreshToken().pipe(
          switchMap(() => {
            const newToken = localStorage.getItem('access_token');
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
            });
            return next(retryReq);
          }),
          catchError(() => {
            authService.logout();
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
```

## Login Component

```typescript
// src/app/pages/login/login.component.ts
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '@/core/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      @if (error) {
        <div class="error">{{ error }}</div>
      }
      
      <input formControlName="email" type="email" placeholder="Email" />
      <input formControlName="password" type="password" placeholder="Password" />
      
      <button type="submit" [disabled]="form.invalid || isSubmitting">
        {{ isSubmitting ? 'Logging in...' : 'Login' }}
      </button>
    </form>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  isSubmitting = false;
  error: string | null = null;

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isSubmitting = true;
    this.error = null;

    const { email, password } = this.form.getRawValue();

    this.authService.login(email, password).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: () => {
        this.error = 'Invalid credentials';
        this.isSubmitting = false;
      },
    });
  }
}
```
