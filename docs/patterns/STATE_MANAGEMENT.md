# State Management Patterns

## Overview

Effective state management requires understanding when to use which type of state.

## State Types

| State Type     | Description                           | Examples                          |
| -------------- | ------------------------------------- | --------------------------------- |
| **Server**     | Data from API, cached                 | User profile, products, orders    |
| **Client**     | UI state, not persisted to server     | Modal open, selected tab, theme   |
| **URL**        | Shareable, bookmark-able state        | Filters, pagination, search query |
| **Form**       | Input values, validation errors       | Registration form, checkout       |
| **Computed**   | Derived from other state              | Cart total, filtered list         |

## When to Use What

| State Type     | React                | Angular              |
| -------------- | -------------------- | -------------------- |
| Server data    | TanStack Query       | HttpClient + Signals |
| UI state       | Zustand              | Signals + Services   |
| Form state     | React Hook Form      | Reactive Forms       |
| URL state      | React Router         | Angular Router       |
| Global app     | Zustand              | Injectable Services  |

## Core Principles

### 1. Separate Server and Client State

Server state has different concerns:
- **Caching** - Avoid duplicate requests
- **Staleness** - When to refetch
- **Background updates** - Keep data fresh
- **Optimistic updates** - Better UX

### 2. Minimize Global State

Ask before making state global:
- Is it needed by multiple unrelated components?
- Does it need to survive navigation?
- Could it be derived from other state?

### 3. Colocate State

Keep state as close as possible to where it's used:

```
✅ Component state → useState / signal
✅ Feature state → Feature store / service  
✅ App state → Global store / root service
❌ Everything global → Performance issues
```

### 4. Immutable Updates

Always create new objects/arrays instead of mutating:

```typescript
// ❌ Mutation
state.items.push(newItem);

// ✅ Immutable
state.items = [...state.items, newItem];
```

### 5. Selector Performance

Only subscribe to the state you need:

```typescript
// ❌ Full state subscription - re-renders on any change
const { items, user, settings } = useStore();

// ✅ Selective subscription - re-renders only when total changes
const total = useStore(state => state.total);
```

## State Organization

```
features/
├── cart/
│   └── model/
│       ├── cart-store.ts      # Client state
│       └── types.ts
├── products/
│   └── api/
│       └── use-products.ts    # Server state hooks
└── auth/
    └── model/
        └── auth-store.ts      # Auth state
```

## Computed State

Derive state instead of storing duplicates:

```typescript
// ❌ Storing computed values
state = {
  items: [],
  total: 0,           // Duplicate!
  isEmpty: true,      // Duplicate!
}

// ✅ Computing on read
state = { items: [] }
total = computed(() => items.reduce(...))
isEmpty = computed(() => items.length === 0)
```

## Persistence

For state that survives page refresh:

| Storage          | Use Case                    | Limits        |
| ---------------- | --------------------------- | ------------- |
| localStorage     | Theme, preferences          | 5-10 MB       |
| sessionStorage   | Temporary session data      | 5-10 MB       |
| IndexedDB        | Large datasets, offline     | Large         |
| URL params       | Shareable filters           | ~2000 chars   |

## Best Practices

1. **Separate server and client state** - Different tools for different jobs
2. **Use query keys factory** - Consistent cache invalidation
3. **Selectors for performance** - Avoid unnecessary re-renders
4. **Optimistic updates** - Better perceived performance
5. **Persist important state** - Cart, user preferences
6. **Avoid prop drilling** - Use context/services for deep trees
7. **Keep state normalized** - Avoid nested duplicates

## Framework-Specific Implementation

- **React**: [Zustand + TanStack Query patterns](../framework/react/patterns/STATE_MANAGEMENT.md)
- **Angular**: [Signals + Services patterns](../framework/angular/patterns/STATE_MANAGEMENT.md)
