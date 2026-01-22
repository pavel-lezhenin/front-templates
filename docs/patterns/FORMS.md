# Form Patterns

## Overview

Type-safe forms with React Hook Form + Zod validation.

## Schema Definition

```typescript
// src/features/user/model/user-schema.ts
import { z } from 'zod';

export const userSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[0-9]/, 'Password must contain number'),
    confirmPassword: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    age: z.coerce.number().min(18, 'Must be 18 or older').optional(),
    role: z.enum(['admin', 'user', 'guest']),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type UserFormData = z.infer<typeof userSchema>;
```

## Form Component (React)

```tsx
// src/features/user/ui/UserForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema, UserFormData } from '../model/user-schema';
import { Input, Button, Select, Checkbox } from '@/shared/ui';

interface UserFormProps {
  onSubmit: (data: UserFormData) => Promise<void>;
  defaultValues?: Partial<UserFormData>;
}

export function UserForm({ onSubmit, defaultValues }: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues,
  });

  const handleFormSubmit = async (data: UserFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      if (error instanceof ValidationError) {
        // Map server errors to form
        Object.entries(error.fields).forEach(([field, messages]) => {
          setError(field as keyof UserFormData, {
            type: 'server',
            message: messages[0],
          });
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />

      <Input
        label="Password"
        type="password"
        error={errors.password?.message}
        {...register('password')}
      />

      <Input
        label="Confirm Password"
        type="password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <Input label="Name" error={errors.name?.message} {...register('name')} />

      <Input label="Age" type="number" error={errors.age?.message} {...register('age')} />

      <Select label="Role" error={errors.role?.message} {...register('role')}>
        <option value="user">User</option>
        <option value="admin">Admin</option>
        <option value="guest">Guest</option>
      </Select>

      <Checkbox
        label="I accept the terms and conditions"
        error={errors.acceptTerms?.message}
        {...register('acceptTerms')}
      />

      <Button type="submit" isLoading={isSubmitting}>
        Submit
      </Button>
    </form>
  );
}
```

## Reusable Input Component

```tsx
// src/shared/ui/input/Input.tsx
import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
    const errorId = `${inputId}-error`;

    return (
      <div className="input-group">
        <label htmlFor={inputId}>{label}</label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        {error && (
          <span id={errorId} className="error" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

## Dynamic Fields

```tsx
// Array fields with useFieldArray
import { useFieldArray, useForm } from 'react-hook-form';

function OrderForm() {
  const { control, register } = useForm<OrderData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  return (
    <form>
      {fields.map((field, index) => (
        <div key={field.id}>
          <Input label="Product" {...register(`items.${index}.product`)} />
          <Input label="Quantity" type="number" {...register(`items.${index}.quantity`)} />
          <Button type="button" onClick={() => remove(index)}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" onClick={() => append({ product: '', quantity: 1 })}>
        Add Item
      </Button>
    </form>
  );
}
```

## Angular Reactive Forms

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

## Best Practices

1. **Always use validation schemas** - Type-safe, reusable
2. **Show errors on blur/submit** - Not while typing
3. **Mark required fields** - Visual indicator
4. **Accessible errors** - Connected via aria-describedby
5. **Handle server errors** - Map to form fields
6. **Disable submit** - While submitting
