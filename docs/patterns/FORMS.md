# Form Patterns

> General form concepts and principles. For framework-specific implementations see:
> - [React Forms](../framework/react/patterns/FORMS.md) - React Hook Form + Zod
> - [Angular Forms](../framework/angular/patterns/FORMS.md) - Reactive Forms + Validators

## Core Principles

### 1. Controlled Inputs
All form inputs should be controlled by form state, not DOM state.

### 2. Schema-First Validation
Define validation schema separately from UI components for:
- Reusability across forms
- Type inference
- Server/client consistency

### 3. Validation Timing

| Event | Use Case |
|-------|----------|
| onChange | Real-time feedback (password strength) |
| onBlur | Standard field validation |
| onSubmit | Final validation, server round-trip |

**Recommendation:** Validate on blur + submit for best UX.

## Validation Patterns

### Client-Side Validation Rules

| Rule | Example |
|------|---------|
| Required | Field must have a value |
| Min/Max Length | Password 8-128 chars |
| Pattern | Email format, phone format |
| Custom | Passwords match, unique username |
| Async | Email availability check |

### Error Message Guidelines

- Be specific: "Password must be at least 8 characters" not "Invalid password"
- Be helpful: Suggest how to fix
- Be accessible: Associate errors with fields via ria-describedby

## Form Architecture

### Simple Forms
Single-level fields, no dynamic sections.

### Complex Forms
- Multi-step wizards
- Dynamic field arrays
- Conditional fields
- Nested objects

### Form State Structure

\\\
FormState {
  values: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  isValid: boolean
}
\\\

## Server-Side Integration

### Validation Error Mapping
Map server validation errors to form field errors:

\\\
Server Response:
{
  "code": "VALIDATION_ERROR",
  "fields": {
    "email": ["Email already taken"],
    "password": ["Too weak"]
  }
}

→ Map to form errors →

Form Errors:
{
  "email": "Email already taken",
  "password": "Too weak"
}
\\\

### Optimistic Updates
For better UX, update UI optimistically and rollback on error.

## Accessibility Checklist

- [ ] Labels associated with inputs (\<label for>\ or wrapping)
- [ ] Required fields marked (\ria-required\)
- [ ] Error states announced (\ria-invalid\, \ole="alert"\)
- [ ] Error messages linked (\ria-describedby\)
- [ ] Focus management (focus first error on submit failure)
- [ ] Keyboard navigation works

## Anti-Patterns

| ❌ Avoid | ✅ Prefer |
|----------|----------|
| Inline validation logic | Schema-based validation |
| Validation on every keystroke | Debounced or blur validation |
| Generic error messages | Specific, actionable messages |
| Disabled submit until valid | Submit with validation feedback |
| Alert dialogs for errors | Inline error messages |

## File Structure

\\\
features/
  user-registration/
    model/
      schema.ts       # Validation schema
      types.ts        # TypeScript types
    ui/
      RegistrationForm.tsx
      FormField.tsx
    api/
      register.ts
\\\
"@
сSet-Content -Path "d:\repos\front-templates\docs\patterns\AUTHENTICATION.md" -Value @"
# Authentication Patterns

> General authentication concepts and security principles. For framework-specific implementations see:
> - [React Authentication](../framework/react/patterns/AUTHENTICATION.md) - Context + Router Guards
> - [Angular Authentication](../framework/angular/patterns/AUTHENTICATION.md) - Signals + Functional Guards

## Core Concepts

### JWT Token Flow

\\\
1. User submits credentials
2. Server validates, returns access + refresh tokens
3. Client stores tokens
4. Client sends access token with API requests
5. Server validates token, returns data
6. On 401, client uses refresh token to get new access token
7. If refresh fails, redirect to login
\\\

### Token Types

| Token | Purpose | Lifetime | Storage |
|-------|---------|----------|---------|
| Access Token | API authorization | 15-60 min | Memory or localStorage |
| Refresh Token | Get new access token | 7-30 days | httpOnly cookie (preferred) |

## Security Principles

### Token Storage Options

| Location | XSS Risk | CSRF Risk | Recommendation |
|----------|----------|-----------|----------------|
| localStorage | ⚠️ High | ✅ None | Acceptable for low-risk apps |
| sessionStorage | ⚠️ High | ✅ None | Better (clears on tab close) |
| httpOnly Cookie | ✅ None | ⚠️ High | Best (with CSRF protection) |
| Memory | ✅ None | ✅ None | Most secure (lost on refresh) |

**Recommendation:** httpOnly cookies for refresh tokens, memory for access tokens.

### Password Security

- Never store plain-text passwords
- Use bcrypt/argon2 on server
- Enforce minimum complexity (8+ chars, mixed case, numbers)
- Implement rate limiting on login attempts
- Consider passwordless options (magic links, OAuth)

## Route Protection

### Guard Types

| Guard | Purpose |
|-------|---------|
| Auth Guard | Requires authenticated user |
| Role Guard | Requires specific role(s) |
| Guest Guard | Only for unauthenticated users |
| Permission Guard | Requires specific permission(s) |

### Protection Flow

\\\
Request → Check Auth State → 
  ├─ Authenticated → Check Role/Permission →
  │   ├─ Authorized → Render Route
  │   └─ Unauthorized → Redirect to /unauthorized
  └─ Not Authenticated → Redirect to /login (save intended URL)
\\\

## Session Management

### Session States

\\\
SessionState {
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
  user: User | null
  permissions: string[]
}
\\\

### Auto-Refresh Pattern

1. Store token expiration time
2. Set timer to refresh before expiration (e.g., 1 minute before)
3. Silently refresh in background
4. On failure, prompt re-authentication

## API Integration

### Request Interceptor

Every authenticated request should:
1. Attach Authorization header
2. Handle 401 responses (trigger refresh)
3. Queue failed requests during refresh
4. Retry queued requests with new token

### Response Handling

| Status | Action |
|--------|--------|
| 200 | Success |
| 401 | Refresh token or redirect to login |
| 403 | Show "access denied" message |

## OAuth/SSO Integration

### Common Providers
- Google
- GitHub  
- Microsoft/Azure AD
- Auth0/Okta

### OAuth Flow
\\\
1. Redirect to provider
2. User authenticates with provider
3. Provider redirects back with code
4. Exchange code for tokens
5. Create local session
\\\

## Security Checklist

- [ ] HTTPS only (no mixed content)
- [ ] Secure token storage
- [ ] CSRF protection (for cookie auth)
- [ ] Rate limiting on auth endpoints
- [ ] Account lockout after failed attempts
- [ ] Secure password reset flow
- [ ] Session invalidation on logout
- [ ] Audit logging for auth events

## Anti-Patterns

| ❌ Avoid | ✅ Prefer |
|----------|----------|
| Storing tokens in URL | Tokens in headers/cookies |
| Long-lived access tokens | Short access + refresh pattern |
| Client-side role checks only | Server validates on every request |
| Plain localStorage for sensitive apps | httpOnly cookies |
| Rolling your own crypto | Established libraries/services |
