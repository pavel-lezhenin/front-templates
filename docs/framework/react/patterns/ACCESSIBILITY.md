# React Accessibility Patterns

> React-specific a11y implementation. For general concepts see [Accessibility Patterns](../../patterns/ACCESSIBILITY.md)

## Focus Management

```tsx
// Auto-focus on modal open
function Modal({ isOpen, onClose, children }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button 
        ref={closeButtonRef} 
        onClick={onClose}
        aria-label="Close modal"
      >
        ✕
      </button>
      {children}
    </div>
  );
}
```

## Focus Trap

```tsx
// Keep focus within modal
import { FocusTrap } from 'focus-trap-react';

function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <FocusTrap>
      <div role="dialog" aria-modal="true">
        <button onClick={onClose} aria-label="Close">✕</button>
        {children}
      </div>
    </FocusTrap>
  );
}
```

## Skip Link

```tsx
// src/shared/ui/skip-link/SkipLink.tsx
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-white p-4 rounded"
    >
      Skip to main content
    </a>
  );
}

// In layout
function Layout() {
  return (
    <>
      <SkipLink />
      <Header />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
```

## Accessible Form Components

```tsx
// Input with proper labeling
function FormInput({
  id,
  label,
  error,
  required,
  ...props
}: FormInputProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div>
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={errorId}
        aria-required={required}
        {...props}
      />
      {error && (
        <span id={errorId} role="alert" className="text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}
```

## Live Regions

```tsx
// Announce dynamic content changes
function StatusMessage({ message, type }: StatusProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={type === 'error' ? 'text-red-600' : 'text-green-600'}
    >
      {message}
    </div>
  );
}

// For urgent announcements
function Alert({ message }: AlertProps) {
  return (
    <div role="alert" aria-live="assertive">
      {message}
    </div>
  );
}
```

## Toast Accessibility

```tsx
// Toast with screen reader support
function Toast({ message, type, onDismiss }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="toast"
    >
      <span>{message}</span>
      <button 
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}
```

## Keyboard Navigation

```tsx
// Custom dropdown with keyboard support
function Dropdown({ options, onSelect, label }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0) {
          onSelect(options[activeIndex]);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      <button
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        {label}
      </button>
      {isOpen && (
        <ul role="listbox" aria-label={label}>
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => {
                onSelect(option);
                setIsOpen(false);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Loading States

```tsx
function DataTable({ isLoading, data }: DataTableProps) {
  return (
    <div aria-busy={isLoading} aria-live="polite">
      {isLoading ? (
        <div role="status">
          <Spinner aria-hidden="true" />
          <span className="sr-only">Loading data...</span>
        </div>
      ) : (
        <table>
          {/* table content */}
        </table>
      )}
    </div>
  );
}
```

## Screen Reader Only Text

```tsx
// Tailwind utility class
// .sr-only in globals.css or use @tailwindcss built-in

// Usage for icon buttons
<button aria-label="Delete item">
  <TrashIcon aria-hidden="true" />
</button>

// Additional context
<a href="/products">
  View products
  <span className="sr-only"> (opens in new tab)</span>
</a>
```

## Testing Accessibility

```tsx
// In vitest/jest tests
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

// Playwright e2e
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should pass axe accessibility tests', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```
