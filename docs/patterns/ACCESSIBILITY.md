# Accessibility Patterns

## Overview

WCAG 2.1 AA compliance as minimum standard.

## Semantic HTML

```tsx
// ❌ BAD: Divs for everything
<div onClick={handleClick}>Click me</div>
<div>Navigation</div>
<div>Main content</div>

// ✅ GOOD: Semantic elements
<button onClick={handleClick}>Click me</button>
<nav>Navigation</nav>
<main>Main content</main>
```

## Landmarks

```tsx
function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <header role="banner">
        <nav aria-label="Main navigation">
          {/* Navigation links */}
        </nav>
      </header>
      
      <main role="main" id="main-content">
        {children}
      </main>
      
      <aside aria-label="Related content">
        {/* Sidebar */}
      </aside>
      
      <footer role="contentinfo">
        {/* Footer */}
      </footer>
    </>
  );
}
```

## Headings

```tsx
// ❌ BAD: Skipped heading levels
<h1>Page Title</h1>
<h3>Section</h3>  {/* Skipped h2 */}

// ✅ GOOD: Proper hierarchy
<h1>Page Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
```

## Forms

```tsx
// ✅ Accessible form
function LoginForm() {
  return (
    <form aria-labelledby="form-title">
      <h2 id="form-title">Login</h2>
      
      {/* Input with label */}
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          aria-required="true"
          aria-describedby="email-error"
        />
        <span id="email-error" role="alert">
          Please enter a valid email
        </span>
      </div>
      
      {/* Required indicator */}
      <div>
        <label htmlFor="password">
          Password <span aria-label="required">*</span>
        </label>
        <input
          id="password"
          type="password"
          aria-required="true"
        />
      </div>
      
      {/* Error summary */}
      <div role="alert" aria-live="polite">
        {errors.length > 0 && (
          <ul>
            {errors.map(e => <li key={e.field}>{e.message}</li>)}
          </ul>
        )}
      </div>
      
      <button type="submit">Login</button>
    </form>
  );
}
```

## Images

```tsx
// Informative image
<img src="product.jpg" alt="Red running shoes, side view" />

// Decorative image
<img src="decoration.svg" alt="" aria-hidden="true" />

// Complex image with description
<figure>
  <img src="chart.png" alt="Sales chart" aria-describedby="chart-desc" />
  <figcaption id="chart-desc">
    Sales increased 25% from Q1 to Q2 2024
  </figcaption>
</figure>
```

## Buttons and Links

```tsx
// Button for actions
<button onClick={handleSubmit}>Submit</button>

// Link for navigation
<a href="/products">View products</a>

// ❌ BAD: Link as button
<a href="#" onClick={handleSubmit}>Submit</a>

// Icon-only button
<button aria-label="Close dialog">
  <XIcon aria-hidden="true" />
</button>

// Button with loading state
<button disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? 'Loading...' : 'Save'}
</button>
```

## Focus Management

```tsx
// Skip link
function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
  );
}

// Modal focus trap
function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    }
    
    return () => {
      previousFocus.current?.focus();
    };
  }, [isOpen]);

  return (
    <FocusTrap active={isOpen}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        <h2 id="modal-title">Modal Title</h2>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </FocusTrap>
  );
}

// Focus visible styles
.button:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

## Keyboard Navigation

```tsx
// Roving tabindex for toolbar
function Toolbar({ items }: { items: Item[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
        setActiveIndex((i) => (i + 1) % items.length);
        break;
      case 'ArrowLeft':
        setActiveIndex((i) => (i - 1 + items.length) % items.length);
        break;
    }
  };

  return (
    <div role="toolbar" onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <button
          key={item.id}
          tabIndex={index === activeIndex ? 0 : -1}
          ref={(el) => index === activeIndex && el?.focus()}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
```

## Live Regions

```tsx
// Polite announcement
<div aria-live="polite" aria-atomic="true">
  {message}
</div>

// Assertive announcement (urgent)
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>

// Status updates
<div role="status" aria-live="polite">
  {itemCount} items found
</div>
```

## Color Contrast

```css
/* Minimum contrast ratios (WCAG AA) */
/* Normal text: 4.5:1 */
/* Large text (18pt+): 3:1 */
/* UI components: 3:1 */

/* Don't rely on color alone */
.error {
  color: var(--color-error);
  /* Also use icon or text */
}

.error::before {
  content: '⚠ ';
}
```

## Testing Tools

```bash
# Automated testing
npm install -D axe-core @axe-core/react

# Integration tests
npm install -D jest-axe
```

```typescript
// jest-axe
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Checklist

- [ ] All interactive elements keyboard accessible
- [ ] Focus visible and logical order
- [ ] Images have alt text
- [ ] Forms have labels
- [ ] Color contrast meets AA
- [ ] Skip link present
- [ ] Headings in logical order
- [ ] ARIA used correctly
- [ ] No content flashes
- [ ] Tested with screen reader
