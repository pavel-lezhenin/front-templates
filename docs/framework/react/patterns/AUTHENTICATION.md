# React Authentication Patterns

> React Context + React Router implementation. For general concepts see [Authentication Patterns](../../patterns/AUTHENTICATION.md)

## Auth Context

```typescript
// src/features/auth/model/auth-context.tsx
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { tokenStorage } from '@/shared/auth';
import { authApi, User } from '@/shared/api';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      authApi.me()
        .then(setUser)
        .catch(() => tokenStorage.clear())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken, refreshToken, user } = await authApi.login(email, password);
    tokenStorage.setAccessToken(accessToken);
    tokenStorage.setRefreshToken(refreshToken);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

## Protected Route

```tsx
// src/features/auth/ui/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../model/auth-context';
import { LoadingSpinner } from '@/shared/ui';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Save intended destination for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
```

## Role-Based Route

```tsx
// src/features/auth/ui/RoleRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../model/auth-context';

interface RoleRouteProps {
  allowedRoles: string[];
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

// Usage in router
{
  element: <RoleRoute allowedRoles={['admin']} />,
  children: [
    { path: 'admin', element: <AdminDashboard /> },
  ],
}
```

## Router Integration

```tsx
// src/app/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute, RoleRoute } from '@/features/auth';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Public routes
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      
      // Protected routes
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'profile', element: <ProfilePage /> },
          
          // Admin only
          {
            element: <RoleRoute allowedRoles={['admin']} />,
            children: [
              { path: 'admin', element: <AdminPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
```

## Axios Interceptor

```typescript
// src/shared/api/interceptors/auth.ts
import axios from 'axios';
import { tokenStorage } from '@/shared/auth';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 and refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = tokenStorage.getRefreshToken();
        const { accessToken } = await authApi.refresh(refreshToken);
        tokenStorage.setAccessToken(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch {
        tokenStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
```

## Login Form

```tsx
// src/pages/auth/login/LoginPage.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { loginSchema, LoginData } from './schema';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const handleSubmit = async (data: LoginData) => {
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (error) {
      form.setError('root', { message: 'Invalid credentials' });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      {form.formState.errors.root && (
        <div className="error">{form.formState.errors.root.message}</div>
      )}
      {/* form fields */}
    </form>
  );
}
```
