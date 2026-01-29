# Angular Form Patterns

> Reactive Forms implementation. For general concepts see [Form Patterns](../../patterns/FORMS.md)

## Form Setup

```typescript
// src/app/features/user/user-form.component.ts
import { Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="form-field">
        <label for="email">Email</label>
        <input id="email" formControlName="email" />
        @if (form.get('email')?.errors?.['required'] && form.get('email')?.touched) {
          <span class="error">Email is required</span>
        }
        @if (form.get('email')?.errors?.['email'] && form.get('email')?.touched) {
          <span class="error">Invalid email format</span>
        }
      </div>

      <div class="form-field">
        <label for="password">Password</label>
        <input id="password" type="password" formControlName="password" />
        @if (form.get('password')?.errors?.['required'] && form.get('password')?.touched) {
          <span class="error">Password is required</span>
        }
        @if (form.get('password')?.errors?.['minlength'] && form.get('password')?.touched) {
          <span class="error">Password must be at least 8 characters</span>
        }
      </div>

      <div class="form-field">
        <label for="name">Name</label>
        <input id="name" formControlName="name" />
        @if (form.get('name')?.errors?.['required'] && form.get('name')?.touched) {
          <span class="error">Name is required</span>
        }
      </div>

      <button type="submit" [disabled]="form.invalid || isSubmitting">
        {{ isSubmitting ? 'Submitting...' : 'Submit' }}
      </button>
    </form>
  `,
})
export class UserFormComponent {
  private fb = inject(FormBuilder);

  submitted = output<UserFormData>();
  isSubmitting = false;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  onSubmit() {
    if (this.form.valid) {
      this.submitted.emit(this.form.getRawValue());
    }
  }
}
```

## Reusable Input Component

```typescript
// src/app/shared/ui/input/input.component.ts
import { Component, input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="input-group">
      <label [for]="inputId()">{{ label() }}</label>
      <input
        [id]="inputId()"
        [type]="type()"
        [value]="value"
        [attr.aria-invalid]="!!error()"
        [attr.aria-describedby]="error() ? errorId() : null"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      @if (error()) {
        <span [id]="errorId()" class="error" role="alert">
          {{ error() }}
        </span>
      }
    </div>
  `,
})
export class InputComponent implements ControlValueAccessor {
  label = input.required<string>();
  type = input<string>('text');
  error = input<string | null>(null);

  inputId = computed(() => this.label().toLowerCase().replace(/\s+/g, '-'));
  errorId = computed(() => `${this.inputId()}-error`);

  value = '';
  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.onChange(value);
  }
}
```

## Dynamic Form Arrays

```typescript
// src/app/features/order/order-form.component.ts
import { Component, inject } from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div formArrayName="items">
        @for (item of items.controls; track item; let i = $index) {
          <div [formGroupName]="i" class="item-row">
            <input formControlName="product" placeholder="Product" />
            <input formControlName="quantity" type="number" placeholder="Qty" />
            <button type="button" (click)="removeItem(i)">Remove</button>
          </div>
        }
      </div>
      
      <button type="button" (click)="addItem()">Add Item</button>
      <button type="submit" [disabled]="form.invalid">Submit</button>
    </form>
  `,
})
export class OrderFormComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    items: this.fb.array([this.createItemGroup()]),
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  private createItemGroup() {
    return this.fb.group({
      product: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
    });
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}
```

## Custom Validators

```typescript
// src/app/shared/validators/custom-validators.ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  static passwordMatch(passwordField: string, confirmField: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const password = group.get(passwordField)?.value;
      const confirm = group.get(confirmField)?.value;

      if (password !== confirm) {
        group.get(confirmField)?.setErrors({ passwordMatch: true });
        return { passwordMatch: true };
      }

      return null;
    };
  }

  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) return null;

      const hasUppercase = /[A-Z]/.test(value);
      const hasLowercase = /[a-z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      const hasMinLength = value.length >= 8;

      const valid = hasUppercase && hasLowercase && hasNumber && hasMinLength;

      return valid ? null : { strongPassword: true };
    };
  }
}

// Usage
form = this.fb.group(
  {
    password: ['', [Validators.required, CustomValidators.strongPassword()]],
    confirmPassword: ['', Validators.required],
  },
  { validators: CustomValidators.passwordMatch('password', 'confirmPassword') }
);
```

## Server Error Handling

```typescript
// Map server validation errors to form
handleServerError(error: ValidationError): void {
  Object.entries(error.fields).forEach(([field, messages]) => {
    const control = this.form.get(field);
    if (control) {
      control.setErrors({ server: messages[0] });
    }
  });
}
```
