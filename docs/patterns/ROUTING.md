# Routing Patterns

## Overview

Type-safe routing with route-based code splitting for optimal performance.

## Core Concepts

### Route Structure

Organize routes hierarchically with clear separation:

- **Public routes** - Landing, authentication, marketing pages
- **Protected routes** - Dashboard, user-specific content
- **Layouts** - Shared UI wrappers (header, sidebar)

### Code Splitting Strategy

- **Route-level splitting** - Each page loads on demand
- **Layout persistence** - Avoid re-mounting shared UI
- **Prefetching** - Load likely next routes on hover/focus

### Type-Safe Parameters

Use schema validation for route parameters:

- **Path params** - `:id`, `:slug` validated at runtime
- **Search params** - Filters, pagination with defaults
- **Type inference** - Full TypeScript support

### Navigation Patterns

- **Centralized route definitions** - Single source of truth
- **Type-safe navigation hooks** - Prevent typos in paths
- **Programmatic navigation** - After form submit, auth

## Route Organization

```
routes/
├── public/          # No auth required
│   ├── home
│   ├── products
│   └── auth/
│       ├── login
│       └── register
├── protected/       # Auth required
│   ├── dashboard
│   ├── settings
│   └── orders
└── layouts/
    ├── root         # Header + footer
    └── dashboard    # Sidebar + content
```

## URL State Management

Use URL for shareable state:

| State Type    | Example                    | Store In    |
| ------------- | -------------------------- | ----------- |
| Current page  | Product detail             | Path        |
| Filters       | Category, price range      | Search      |
| Pagination    | Page number, page size     | Search      |
| Sort order    | Price ascending            | Search      |
| Selected item | Active tab                 | Search/Hash |

## Error Handling

- **404 Not Found** - Catch-all route at the end
- **Route-level errors** - Error boundaries per route
- **Redirect on auth fail** - To login with return URL

## Best Practices

1. **Lazy load pages** - Reduce initial bundle size
2. **Validate params with Zod** - Runtime type safety
3. **Centralize route definitions** - Single source of truth
4. **Prefetch on hover** - Improve perceived performance
5. **Use layouts** - Prevent re-mounts of shared UI
6. **Error boundaries per route** - Isolated error handling
7. **Persist URL state** - Filters, pagination shareable

## Framework-Specific Implementation

- **React**: [React Router v6 patterns](../framework/react/patterns/ROUTING.md)
- **Angular**: [Angular Router patterns](../framework/angular/patterns/ROUTING.md)

