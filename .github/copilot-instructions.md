# Copilot Instructions

## Language Rules

- **STRICT: English only** — all code, comments, JSDoc, commits
- No transliteration, no mixed languages
- camelCase for variables/functions, PascalCase for components/classes

## Trunk-Based Development

- **STRICT: Never work in `main` branch**
- **STRICT: Before ANY work** — verify branch is NOT `main`
- **Branch naming:** `feature/<description>` (kebab-case)

```bash
git branch --show-current  # Must NOT be main
```

**If in `main`:** STOP and create feature branch before proceeding.

## Project Hierarchy

```
packages/{framework}-{pattern}-{project}[-{role}]
```

- **Framework**: react, angular
- **Pattern**: fsd, modular, atomic, standalone, ngrx, nx
- **Technology**: web3, mf, next, firebase
- **Role**: shell, remote, shared, e2e (MF only)

## Git Submodules

Each package is independent git submodule.

**Workflow:**

1. Work in submodule, commit & push
2. Return to parent, update reference
3. Commit parent

**Before parent commit:**

```bash
pnpm submodule:check
```

## TypeScript Standards

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

- Prefer `interface` over `type` for objects
- Use `readonly` for immutable data
- Explicit return types on public functions

## UI Layer Principle

> **Pages = orchestration, NOT logic**

```
Page → Widgets/Features → Entities → Shared
```

Pages compose components, they don't implement business logic.

## Framework Defaults

### React

| Aspect       | Default                     |
| ------------ | --------------------------- |
| Build        | Vite                        |
| Styling      | Tailwind CSS                |
| State        | Zustand                     |
| Server State | TanStack Query              |
| Forms        | React Hook Form + Zod       |
| Routing      | React Router v6             |
| Testing      | Jest or Vitest + React Testing Library|
| E2E          | Playwright                  |
| Mocking      | MSW                         |

### Angular

| Aspect       | Default              |
| ------------ | -------------------- |
| Build        | Angular CLI          |
| Styling      | SCSS                 |
| State        | Signals + Services   |
| Forms        | Reactive Forms       |
| Routing      | Angular Router       |
| Testing      | Jest or Vitest       |
| E2E          | Playwright           |
| Mocking      | MSW                  |

## Code Style

### Limits (Soft Guidelines)

- **File**: ~300 lines max
- **Function**: ~50 lines max
- **Component props**: ~7 max

### Import Order

```typescript
// 1. Framework/external
import React from 'react';

// 2. Internal aliases (@/)
import { Button } from '@/shared/ui';

// 3. Relative
import { UserCard } from './UserCard';
```

## Security (Mandatory)

Every CI must include:

- **gitleaks** — secret scanning
- **npm audit** — dependency vulnerabilities

```yaml
# Required in every package CI
- uses: gitleaks/gitleaks-action@v2
- run: npm audit --audit-level=high
```

## AI Agents

This repository uses specialized agents:

- **@architect** — structure, layers, dependencies, UI Layer principle
- **@developer** — code quality, TypeScript, SOLID, patterns
- **@tester** — coverage, test quality, edge cases, E2E
- **@design** — UI consistency, tokens, accessibility

See [docs/agents/](../docs/agents/) for detailed rules.

## Testing

### Coverage

- **Minimum**: 80%
- **Target**: 90%

### Test Types

| Type      | Tool                   | Location       |
| --------- | ---------------------- | -------------- |
| Unit      | Jest/Vitest            | `src/**/*.test.ts` |
| Component | Testing Library        | `src/**/*.test.tsx` |
| E2E       | Playwright             | `e2e/`         |

## Documentation

### Every Package Must Have

**README.md:**

- What it is
- When to use / when NOT to use
- Quick start
- Architecture overview

**JSDoc for public APIs:**

```typescript
/**
 * Fetches user by ID.
 * @param id - User identifier
 */
export async function getUser(id: string): Promise<User | null>
```

## Architecture Principles

- **SOLID** — Single responsibility, Open/closed, etc.
- **KISS** — Simplest solution that works
- **DRY** — Extract shared logic
- **Composition over inheritance**
- **Immutability preferred**

## What NOT to Do

- ❌ Hardcode secrets
- ❌ Commit to main directly
- ❌ Create packages manually (use scaffolding)
- ❌ Mix languages (Russian comments, etc.)
- ❌ Skip TypeScript strict mode
- ❌ Skip security checks in CI
- ❌ Ignore test coverage (<80%)
- ❌ Put business logic in Pages
