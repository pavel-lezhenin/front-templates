# Architecture Principles

> General architecture concepts. For framework-specific examples see:
> - [React Patterns](../framework/react/patterns/)
> - [Angular Patterns](../framework/angular/patterns/)

## Core Principle: UI Layer

> **Pages = Orchestration, NOT Logic**

### The Problem

\\\
// ❌ BAD: Page doing everything
Page {
  state: products, loading, cart
  
  onInit() {
    loading = true
    products = fetch('/api/products')
    loading = false
  }
  
  addToCart(product) {
    cart.add(product)
    storage.save('cart', cart)
  }
  
  render() {
    <header>...</header>
    if loading: <Spinner />
    else: 
      for product in products:
        <div class="card">
          <img src={product.image} />
          <h3>{product.name}</h3>
          <button onClick={addToCart}>Add</button>
        </div>
    <footer>...</footer>
  }
}
\\\

### The Solution

\\\
// ✅ GOOD: Page orchestrates
Page {
  render() {
    <MainLayout>
      <ProductCatalog />
      <CartSidebar />
    </MainLayout>
  }
}

// Widget handles its own data
Widget ProductCatalog {
  products, isLoading = useProductsQuery()
  
  if isLoading: return <ProductGridSkeleton />
  
  return <ProductGrid>
    for product in products:
      <ProductCard product={product} />
  </ProductGrid>
}

// Feature handles user interaction
Feature ProductCard {
  input: product
  cartService = inject(CartService)
  
  return <Card>
    <ProductImage src={product.image} />
    <ProductInfo product={product} />
    <AddToCartButton onClick={() => cartService.add(product)} />
  </Card>
}
\\\

### Layer Hierarchy

\\\
┌─────────────────────────────────────────────────────────────────┐
│                           PAGES                                  │
│                     (Orchestration)                              │
│  • Compose widgets and features                                  │
│  • Define layout                                                 │
│  • Handle route params                                           │
│  • NO business logic                                             │
│  • NO direct API calls                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│     WIDGETS       │ │     FEATURES      │ │     ENTITIES      │
│  (Composite UI)   │ │  (User Actions)   │ │    (Domain)       │
│                   │ │                   │ │                   │
│ • Header          │ │ • AddToCart       │ │ • Product         │
│ • Sidebar         │ │ • LoginForm       │ │ • User            │
│ • ProductGrid     │ │ • SearchBar       │ │ • Order           │
│ • UserProfile     │ │ • FilterPanel     │ │ • Cart            │
└───────────────────┘ └───────────────────┘ └───────────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │      SHARED       │
                    │   (Foundation)    │
                    │                   │
                    │ • UI Kit          │
                    │ • Utilities       │
                    │ • API client      │
                    │ • Hooks/Services  │
                    └───────────────────┘
\\\

## SOLID in Frontend

### Single Responsibility

One component = one job.

\\\
// ❌ BAD: Multiple responsibilities
Component UserCard {
  state: isEditing, formData
  // Display logic + Edit logic + Form handling = too much
}

// ✅ GOOD: Separated
Component UserCard {
  render() { <UserInfo user={user} /> }
}

Component UserEditForm {
  // Only form handling
}
\\\

### Open/Closed

Extend via composition, not modification.

\\\
// ✅ GOOD: Composable
Component Button {
  input: variant, size, leftIcon, children
  
  render() {
    <button class={[styles[variant], styles[size]]}>
      if leftIcon: <span class="icon">{leftIcon}</span>
      {children}
    </button>
  }
}

// Usage - extended without modifying Button
<Button variant="primary" leftIcon={<SaveIcon />}>
  Save
</Button>
\\\

### Liskov Substitution

Components with same interface are interchangeable.

\\\
// Both can be used anywhere expecting a Button
<Button onClick={save}>Save</Button>
<IconButton onClick={save} icon={<SaveIcon />} />
\\\

### Interface Segregation

Small, focused prop interfaces.

\\\
// ❌ BAD: Too many props
interface CardProps {
  title, subtitle, image, actions[]
  onEdit, onDelete, onShare
  isEditable, isDeletable
  // ... 20 more props
}

// ✅ GOOD: Composed
interface CardProps {
  children
}

<Card>
  <CardHeader title="Product" />
  <CardImage src={image} />
  <CardActions>
    <EditButton onClick={onEdit} />
    <DeleteButton onClick={onDelete} />
  </CardActions>
</Card>
\\\

### Dependency Inversion

Depend on abstractions (hooks, services), not implementations.

\\\
// ❌ BAD: Direct dependency
Component UserList {
  onInit() {
    users = fetch('/api/users')  // Direct API call
  }
}

// ✅ GOOD: Abstraction
Component UserList {
  users = inject(UserService).getUsers()  // Service handles implementation
  // or: users = useUsersQuery()           // Hook handles implementation
}
\\\

## Other Principles

### DRY (Don't Repeat Yourself)

Extract shared logic into hooks/utilities/services.

\\\
// ✅ Reusable utility for debouncing
function useDebounce(value, delay) {
  state: debouncedValue = value
  
  onValueChange() {
    timer = setTimeout(() => debouncedValue = value, delay)
    cleanup: clearTimeout(timer)
  }
  
  return debouncedValue
}
\\\

### KISS (Keep It Simple)

Simplest solution that works.

\\\
// ❌ Over-engineered
memoizedResult = memoize(
  pipe(filter(filterFn), sort(sortFn), paginate(page, size))(users)
)

// ✅ Simple (unless performance requires optimization)
filteredUsers = users
  .filter(u => u.name.includes(search))
  .slice(0, 10)
\\\

### Immutability

Prefer immutable operations.

\\\
// ❌ Mutation
function addItem(cart, item) {
  cart.items.push(item)  // Mutates original
  return cart
}

// ✅ Immutable
function addItem(cart, item) {
  return {
    ...cart,
    items: [...cart.items, item]
  }
}
\\\

### Composition over Inheritance

Use composition and dependency injection.

\\\
// ✅ Component composition
Component EnhancedButton {
  render() {
    <Tooltip content={tooltip}>
      <Button {...props} />
    </Tooltip>
  }
}

// ✅ Service/Hook composition
function useEnhancedForm() {
  form = useForm()
  validation = useValidation()
  submission = useSubmission()
  
  return { ...form, ...validation, ...submission }
}
\\\

## Applying to Architectures

### FSD (Feature-Sliced Design)

Naturally follows UI Layer principle with explicit layers:
- pages/ → orchestration only
- widgets/ → composite UI blocks
- features/ → user interactions
- entities/ → domain models
- shared/ → foundation

### Modular

Modules contain features. Pages import and compose modules.

### Atomic

Atoms → Molecules → Organisms → Templates → Pages

Pages use Templates, don't build from Atoms directly.

### Smart vs Presentational

| Type | Responsibility | Data |
|------|---------------|------|
| Smart (Container) | Orchestration, data fetching | Knows about state/services |
| Presentational | Pure rendering | Only props/inputs |

Pages = Smart containers that compose Presentational components.
