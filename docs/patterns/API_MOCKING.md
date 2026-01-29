# API Mocking Patterns

> General API mocking concepts and strategies. For framework-specific implementations see:
> - [React API Mocking](../framework/react/patterns/API_MOCKING.md) - MSW + TanStack Query
> - [Angular API Mocking](../framework/angular/patterns/API_MOCKING.md) - MSW + HttpClient

## Why Mock APIs

| Scenario | Benefit |
|----------|---------|
| Development | Work without backend |
| Testing | Predictable, fast tests |
| Demos | Reliable showcases |
| Edge cases | Simulate errors, timeouts |
| Offline | Continue development |

## Mock Service Worker (MSW)

### Why MSW

- Intercepts at network level
- Works in browser and Node.js
- Same handlers for dev and test
- No application code changes needed

### Architecture

\\\
Application → HTTP Request → MSW Intercepts → Mock Handler → Response
                                    ↓
                              (unhandled)
                                    ↓
                             Real Network
\\\

## Handler Patterns

### RESTful Endpoints

| Endpoint | Method | Handler |
|----------|--------|---------|
| \/api/items\ | GET | List items |
| \/api/items/:id\ | GET | Get single item |
| \/api/items\ | POST | Create item |
| \/api/items/:id\ | PATCH/PUT | Update item |
| \/api/items/:id\ | DELETE | Delete item |

### Response Codes

| Status | Use Case |
|--------|----------|
| 200 | Success (GET, PUT, PATCH) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 500 | Server error |

## Data Management

### Approaches

| Approach | Use Case | Persistence |
|----------|----------|-------------|
| Static JSON | Simple, read-only | None |
| Factory functions | Dynamic generation | None |
| In-memory database | CRUD operations | Session |
| IndexedDB | Long-term persistence | Browser |

### @mswjs/data

Benefits:
- Relational data modeling
- Query filtering
- Automatic CRUD
- Seed data generation

## Testing Strategies

### Handler Scoping

| Scope | Purpose |
|-------|---------|
| Global | Default happy path |
| Test file | File-specific scenarios |
| Single test | Error/edge cases |

### Common Test Scenarios

1. **Success** - Default handlers
2. **Empty state** - Return empty array
3. **Error** - Return error status
4. **Loading** - Add delay
5. **Validation** - Return field errors

## Best Practices

### Do

- ✅ Match real API contract exactly
- ✅ Use realistic delays (100-300ms)
- ✅ Generate realistic fake data
- ✅ Test error scenarios
- ✅ Reset state between tests

### Don't

- ❌ Hardcode test-specific logic in handlers
- ❌ Couple mocks to implementation details
- ❌ Skip error scenario testing
- ❌ Use production data in mocks

## Development Workflow

### Environment Setup

\\\
Development:
  - MSW browser worker
  - Seeded mock database
  - Network dev tools work normally

Testing:
  - MSW Node server
  - Fresh database per test
  - Override handlers per test
\\\

### Toggling Mocks

Options for enabling/disabling:
- Environment variable
- URL parameter
- Browser dev tools command
- Build-time flag

## Error Simulation

### Network Errors

- Connection refused
- Timeout
- Network offline

### API Errors

\\\json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid input",
  "fields": {
    "email": ["Invalid email format"]
  }
}
\\\

### Delay Patterns

| Pattern | Use |
|---------|-----|
| Fixed delay | Consistent testing |
| Random delay | Realistic simulation |
| Zero delay | Fast tests |
| Long delay | Loading state testing |

## Seeding Data

### Strategies

| Strategy | Best For |
|----------|----------|
| Minimal seed | Unit tests |
| Representative seed | Integration tests |
| Large seed | Performance testing |
| Edge case seed | Boundary testing |

### Data Generation

Use libraries like \@faker-js/faker\ for:
- Realistic names, emails, addresses
- Dates, numbers, UUIDs
- Images, paragraphs
- Consistent seeds for reproducibility

## Anti-Patterns

| ❌ Avoid | ✅ Prefer |
|----------|----------|
| Mocking at component level | Network-level mocking |
| Different mocks for dev/test | Shared handlers |
| Hardcoded IDs in tests | Dynamic/generated data |
| Skipping cleanup | Reset between tests |
| Ignoring real API changes | Keep mocks in sync |
