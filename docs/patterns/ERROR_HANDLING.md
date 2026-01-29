# Error Handling Patterns

> General error handling concepts and principles. For framework-specific implementations see:
> - [React Error Handling](../framework/react/patterns/ERROR_HANDLING.md) - Error Boundaries + TanStack Query
> - [Angular Error Handling](../framework/angular/patterns/ERROR_HANDLING.md) - HttpInterceptor + Services

## Error Categories

### By Source

| Category | Examples | Handling |
|----------|----------|----------|
| Network | Connection lost, timeout | Retry with backoff, offline mode |
| API | 4xx/5xx responses | Parse error, show message |
| Validation | Invalid input | Show field errors |
| Runtime | Null reference, type error | Error boundary, logging |
| Business | Insufficient funds | User-friendly message |

### By Severity

| Severity | Action | User Impact |
|----------|--------|-------------|
| Fatal | Crash recovery UI | Full page error |
| Error | Show error, allow retry | Component-level error |
| Warning | Show warning, continue | Toast/notification |
| Info | Log only | None |

## Error Response Structure

Standard API error format:

\\\json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "status": 400,
  "details": {
    "fields": {
      "email": ["Email already exists"],
      "password": ["Must be at least 8 characters"]
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_abc123"
}
\\\

## HTTP Status Handling

| Status | Category | User Message | Action |
|--------|----------|--------------|--------|
| 400 | Validation | Show field errors | None |
| 401 | Auth | "Session expired" | Redirect to login |
| 403 | Permission | "Access denied" | Show explanation |
| 404 | Not Found | "Item not found" | Navigate back |
| 429 | Rate Limit | "Too many requests" | Show cooldown |
| 500 | Server | "Something went wrong" | Retry option |
| 503 | Unavailable | "Service maintenance" | Show status page |

## Error Boundary Principles

### Component Tree
\\\
App
├── GlobalErrorBoundary (catches unrecoverable errors)
│   ├── Header
│   ├── Content
│   │   ├── FeatureErrorBoundary (isolates feature errors)
│   │   │   └── Feature Component
│   │   └── FeatureErrorBoundary
│   │       └── Another Feature
│   └── Footer
\\\

### Granularity Guidelines

| Level | Catches | Fallback |
|-------|---------|----------|
| App | Fatal crashes | Full-page error |
| Route | Page errors | Error page |
| Feature | Feature errors | Feature placeholder |
| Component | Render errors | Inline error |

## Retry Strategies

### Exponential Backoff

\\\
Attempt 1: Wait 1s
Attempt 2: Wait 2s
Attempt 3: Wait 4s
Attempt 4: Wait 8s (cap at max)
\\\

### Retry Decision Tree

\\\
Error occurred →
  ├─ Network error → Retry with backoff
  ├─ 5xx error → Retry with backoff
  ├─ 429 error → Wait for Retry-After header
  ├─ 4xx error → Don't retry (client error)
  └─ Timeout → Retry once
\\\

## User Experience

### Error Message Guidelines

- Be specific: What went wrong
- Be helpful: How to fix it
- Be human: No technical jargon
- Provide action: Clear next step

**Bad:** \Error: ECONNREFUSED\
**Good:** "We couldn't reach the server. Please check your connection and try again."

### Loading vs Error States

\\\
Initial → Loading → Success
                 → Error → Retry → Loading → ...
\\\

Always show:
1. What went wrong (briefly)
2. What the user can do (retry, go back, contact support)

## Logging & Monitoring

### What to Log

| Level | Include |
|-------|---------|
| Error | Stack trace, user context, request ID |
| Warning | Message, context |
| Info | Action, result |

### Log Structure

\\\json
{
  "level": "error",
  "message": "Failed to load products",
  "error": { "name": "NetworkError", "message": "..." },
  "context": {
    "userId": "user_123",
    "requestId": "req_456",
    "url": "/api/products",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
\\\

## Anti-Patterns

| ❌ Avoid | ✅ Prefer |
|----------|----------|
| Swallowing errors silently | Log and handle appropriately |
| Technical error messages | User-friendly messages |
| Alert dialogs for all errors | Inline/toast based on severity |
| Crashing entire app | Error boundaries at feature level |
| Retrying 4xx errors | Only retry network/server errors |
