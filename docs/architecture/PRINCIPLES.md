# Architecture Principles

## Core Principle: UI Layer

> **Pages = Orchestration, NOT Logic**

### The Problem

```typescript
// ❌ BAD: Page doing everything
function ProductPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  const addToCart = (product) => {
    setCart([...cart, product]);
    localStorage.setItem('cart', JSON.stringify([...cart, product]));
  };

  return (
    <div>
      <header>...</header>
      {loading ? <Spinner /> : (
        <div className="grid">
          {products.map(p => (
            <div key={p.id} className="card">
              <img src={p.image} />
              <h3>{p.name}</h3>
              <p>{p.price}</p>
              <button onClick={() => addToCart(p)}>Add</button>
            </div>
          ))}
        </div>
      )}
      <footer>...</footer>
    </div>
  );
}
```

### The Solution

```typescript
// ✅ GOOD: Page orchestrates
function ProductPage() {
  return (
    <MainLayout>
      <ProductCatalog />
      <CartSidebar />
    </MainLayout>
  );
}

// Widget handles its own data
function ProductCatalog() {
  const { products, isLoading } = useProducts();

  if (isLoading) return <ProductGridSkeleton />;

  return (
    <ProductGrid>
      {products.map(p => (
        <ProductCard key={p.id} product={p} />
      ))}
    </ProductGrid>
  );
}

// Feature handles user interaction
function ProductCard({ product }) {
  const { addToCart } = useCart();

  return (
    <Card>
      <ProductImage src={product.image} />
      <ProductInfo product={product} />
      <AddToCartButton onClick={() => addToCart(product)} />
    </Card>
  );
}
```

### Layer Hierarchy

```
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
                    │ • Hooks           │
                    └───────────────────┘
```

## SOLID in Frontend

### Single Responsibility

One component = one job.

```typescript
// ❌ BAD: Multiple responsibilities
function UserCard({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);

  // Display logic + Edit logic + Form handling = too much
}

// ✅ GOOD: Separated
function UserCard({ user }) {
  return <UserInfo user={user} />;
}

function UserEditForm({ user, onSave }) {
  // Only form handling
}
```

### Open/Closed

Extend via composition, not modification.

```typescript
// ✅ GOOD: Composable
function Button({ variant, size, leftIcon, children, ...props }) {
  return (
    <button className={cn(styles[variant], styles[size])} {...props}>
      {leftIcon && <span className={styles.icon}>{leftIcon}</span>}
      {children}
    </button>
  );
}

// Usage - extended without modifying Button
<Button variant="primary" leftIcon={<SaveIcon />}>
  Save
</Button>
```

### Liskov Substitution

Components with same interface are interchangeable.

```typescript
// Both can be used anywhere expecting a Button
<Button onClick={save}>Save</Button>
<IconButton onClick={save} icon={<SaveIcon />} />
```

### Interface Segregation

Small, focused prop interfaces.

```typescript
// ❌ BAD: Too many props
interface CardProps {
  title: string;
  subtitle: string;
  image: string;
  actions: Action[];
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  isEditable: boolean;
  isDeletable: boolean;
  // ... 20 more props
}

// ✅ GOOD: Composed
interface CardProps {
  children: React.ReactNode;
}

<Card>
  <CardHeader title="Product" />
  <CardImage src={image} />
  <CardActions>
    <EditButton onClick={onEdit} />
    <DeleteButton onClick={onDelete} />
  </CardActions>
</Card>
```

### Dependency Inversion

Depend on abstractions (hooks, services).

```typescript
// ❌ BAD: Direct dependency
function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then(setUsers);
  }, []);
}

// ✅ GOOD: Abstraction
function UserList() {
  const { users } = useUsers(); // Hook handles implementation
}
```

## Other Principles

### DRY (Don't Repeat Yourself)

Extract shared logic into hooks/utilities.

```typescript
// ✅ Custom hook for reusable logic
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

### KISS (Keep It Simple)

Simplest solution that works.

```typescript
// ❌ Over-engineered
const memoizedFilteredSortedPaginatedUsers = useMemo(
  () => pipe(filter(filterFn), sort(sortFn), paginate(page, size))(users),
  [users, filterFn, sortFn, page, size]
);

// ✅ Simple (unless performance requires optimization)
const filteredUsers = users.filter((u) => u.name.includes(search)).slice(0, 10);
```

### Immutability

Prefer immutable operations.

```typescript
// ❌ Mutation
function addItem(cart, item) {
  cart.items.push(item);
  return cart;
}

// ✅ Immutable
function addItem(cart, item) {
  return {
    ...cart,
    items: [...cart.items, item],
  };
}
```

### Composition over Inheritance

React: use composition and hooks.
Angular: use services and composition.

```typescript
// ✅ Composition
function EnhancedButton(props) {
  return (
    <Tooltip content={props.tooltip}>
      <Button {...props} />
    </Tooltip>
  );
}

// ✅ Hook composition
function useEnhancedForm() {
  const form = useForm();
  const validation = useValidation();
  const submission = useSubmission();

  return { ...form, ...validation, ...submission };
}
```

## Applying to Architectures

### FSD (Feature-Sliced Design)

Naturally follows UI Layer principle with explicit layers.

### Modular

Modules contain features. Pages import and compose modules.

### Atomic

Atoms → Molecules → Organisms → Templates → Pages
Pages use Templates, don't build from Atoms directly.

### Angular

- Smart containers (Pages) vs Presentational components
- Services handle business logic
- Components compose
