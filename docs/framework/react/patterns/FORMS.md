# React Form Patterns

> React Hook Form + Zod implementation. For general concepts see [Form Patterns](../../patterns/FORMS.md)

## Form Setup

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

## Form with TanStack Query Mutation

```tsx
// src/features/user/ui/CreateUserForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { userApi } from '@/shared/api';

export function CreateUserForm() {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const createUser = useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      form.reset();
      toast.success('User created!');
    },
    onError: (error) => {
      if (error instanceof ValidationError) {
        Object.entries(error.fields).forEach(([field, messages]) => {
          form.setError(field as keyof UserFormData, {
            type: 'server',
            message: messages[0],
          });
        });
      }
    },
  });

  return (
    <form onSubmit={form.handleSubmit((data) => createUser.mutate(data))}>
      {/* form fields */}
      <Button type="submit" isLoading={createUser.isPending}>
        Create
      </Button>
    </form>
  );
}
```

## Controlled Components

```tsx
// When you need full control
import { Controller, useForm } from 'react-hook-form';
import { DatePicker } from '@/shared/ui';

function EventForm() {
  const { control, handleSubmit } = useForm<EventData>();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="startDate"
        control={control}
        rules={{ required: 'Start date is required' }}
        render={({ field, fieldState }) => (
          <DatePicker
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
    </form>
  );
}
```
