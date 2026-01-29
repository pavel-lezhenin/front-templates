# Angular Accessibility Patterns

> Angular-specific a11y implementation. For general concepts see [Accessibility Patterns](../../patterns/ACCESSIBILITY.md)

## CDK A11y Module

```typescript
// Import Angular CDK accessibility utilities
import { A11yModule } from '@angular/cdk/a11y';

@Component({
  standalone: true,
  imports: [A11yModule],
})
export class AccessibleComponent {}
```

## Focus Management

```typescript
// Auto-focus on modal open
import { FocusMonitor } from '@angular/cdk/a11y';

@Component({
  selector: 'app-modal',
  template: `
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <h2 id="modal-title">{{ title }}</h2>
      <button #closeBtn (click)="close()" aria-label="Close modal">✕</button>
      <ng-content />
    </div>
  `,
})
export class ModalComponent implements AfterViewInit, OnDestroy {
  private focusMonitor = inject(FocusMonitor);
  @ViewChild('closeBtn') closeBtn!: ElementRef<HTMLButtonElement>;

  title = input.required<string>();

  ngAfterViewInit(): void {
    this.focusMonitor.focusVia(this.closeBtn, 'program');
  }

  ngOnDestroy(): void {
    this.focusMonitor.stopMonitoring(this.closeBtn);
  }

  close(): void {
    // emit close event
  }
}
```

## Focus Trap

```typescript
// Keep focus within modal
import { A11yModule } from '@angular/cdk/a11y';

@Component({
  standalone: true,
  imports: [A11yModule],
  template: `
    <div cdkTrapFocus [cdkTrapFocusAutoCapture]="true" role="dialog" aria-modal="true">
      <button (click)="close()" aria-label="Close">✕</button>
      <ng-content />
    </div>
  `,
})
export class ModalComponent {}
```

## Skip Link

```typescript
@Component({
  selector: 'app-skip-link',
  standalone: true,
  template: `
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50"
    >
      Skip to main content
    </a>
  `,
  styles: [`
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }
    .focus\\:not-sr-only:focus {
      position: static;
      width: auto;
      height: auto;
      margin: 0;
      overflow: visible;
      clip: auto;
    }
  `],
})
export class SkipLinkComponent {}
```

## Accessible Form Components

```typescript
@Component({
  selector: 'app-form-input',
  standalone: true,
  template: `
    <div class="form-field">
      <label [for]="id()">
        {{ label() }}
        @if (required()) {
          <span aria-hidden="true"> *</span>
          <span class="sr-only"> (required)</span>
        }
      </label>
      <input
        [id]="id()"
        [attr.aria-invalid]="!!error()"
        [attr.aria-describedby]="error() ? id() + '-error' : null"
        [attr.aria-required]="required()"
        [formControl]="control()"
      />
      @if (error()) {
        <span [id]="id() + '-error'" role="alert" class="error">
          {{ error() }}
        </span>
      }
    </div>
  `,
})
export class FormInputComponent {
  id = input.required<string>();
  label = input.required<string>();
  control = input.required<FormControl>();
  error = input<string | null>(null);
  required = input(false);
}
```

## Live Regions

```typescript
// LiveAnnouncer for dynamic content
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  template: `
    <button (click)="addToCart()">Add to Cart</button>
  `,
})
export class ProductComponent {
  private liveAnnouncer = inject(LiveAnnouncer);

  addToCart(): void {
    // ... add logic
    this.liveAnnouncer.announce('Item added to cart', 'polite');
  }
}

// Declarative live region
@Component({
  template: `
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {{ statusMessage() }}
    </div>
  `,
})
export class StatusComponent {
  statusMessage = input<string>('');
}
```

## Keyboard Navigation

```typescript
// ListKeyManager for custom lists
import { ListKeyManager } from '@angular/cdk/a11y';

@Component({
  template: `
    <ul
      role="listbox"
      [attr.aria-label]="label()"
      (keydown)="onKeydown($event)"
    >
      @for (option of options(); track option.value) {
        <li
          #optionEl
          role="option"
          [attr.aria-selected]="isActive(option)"
          (click)="select(option)"
        >
          {{ option.label }}
        </li>
      }
    </ul>
  `,
})
export class CustomListComponent implements AfterViewInit {
  @ViewChildren('optionEl') optionElements!: QueryList<ElementRef>;
  
  options = input.required<Option[]>();
  label = input.required<string>();

  private keyManager!: ListKeyManager<ElementRef>;

  ngAfterViewInit(): void {
    this.keyManager = new ListKeyManager(this.optionElements)
      .withWrap()
      .withTypeAhead();
  }

  onKeydown(event: KeyboardEvent): void {
    this.keyManager.onKeydown(event);

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const activeIndex = this.keyManager.activeItemIndex;
      if (activeIndex !== null) {
        this.select(this.options()[activeIndex]);
      }
    }
  }

  isActive(option: Option): boolean {
    const activeIndex = this.keyManager.activeItemIndex;
    return activeIndex !== null && this.options()[activeIndex] === option;
  }

  select(option: Option): void {
    // handle selection
  }
}
```

## Loading States

```typescript
@Component({
  template: `
    <div [attr.aria-busy]="loading()" aria-live="polite">
      @if (loading()) {
        <div role="status">
          <app-spinner aria-hidden="true" />
          <span class="sr-only">Loading data...</span>
        </div>
      } @else {
        <ng-content />
      }
    </div>
  `,
})
export class LoadingContainerComponent {
  loading = input(false);
}
```

## High Contrast Mode

```typescript
// Detect high contrast mode
import { HighContrastModeDetector } from '@angular/cdk/a11y';

@Component({
  template: `
    <div [class.high-contrast]="isHighContrast">
      <ng-content />
    </div>
  `,
})
export class ContainerComponent {
  private hcm = inject(HighContrastModeDetector);
  isHighContrast = this.hcm.getHighContrastMode() !== HighContrastMode.NONE;
}
```

## Testing Accessibility

```typescript
// In Playwright e2e tests
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should pass axe accessibility tests', async ({ page }) => {
  await page.goto('/');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

// Unit tests with jest-axe
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/angular';

expect.extend(toHaveNoViolations);

it('should be accessible', async () => {
  const { container } = await render(MyComponent);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```
