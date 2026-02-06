# Repository Structure

## Overview

```
front-templates/
│
├── .github/
│   ├── workflows/
│   │   └── monorepo-ci.yml         # Affected-based CI
│   └── copilot-instructions.md     # AI agent rules
│
├── packages/                        # Git submodules (independent)
│   ├── react-fsd-starter/
│   ├── react-modular-starter/
│   ├── angular-standalone-starter/
│   └── ...
│
├── templates/                       # Reference configs (copy, don't inherit)
│   └── configs/
│       ├── eslint/
│       ├── tsconfig/
│       ├── prettier/
│       ├── ci/
│       └── docker/
│
├── docs/                            # Knowledge base
│   ├── architecture/
│   ├── agents/
│   ├── patterns/
│   ├── framework/
│   ├── technology/
│   ├── microfrontends/
│   ├── tooling/
│   └── decisions/
│
├── scripts/                         # Automation (Node.js ESM)
│   ├── check-branch.mjs             # Verify not on main
│   ├── create-package.mjs           # Scaffold new package
│   └── submodule-add.mjs            # Add git submodule
│
├── package.json              # Root (only dev tools + git management)
├── pnpm-workspace.yaml       # Empty: packages: [] (submodules NOT workspace)
└── README.md
```

## ⚡ CRITICAL: Git Submodules, NOT pnpm Workspace

**This repository uses GIT SUBMODULES, NOT pnpm workspace.**

Root (`front-templates`) is a git repository that **embeds** other git repositories (packages) as submodules.

### packages/

**Git submodules** — each package is an **independent git repository**.

Each package:
- ✅ Has its own `.git` directory and git history
- ✅ Has its own `pnpm-lock.yaml` (fully independent lockfile)
- ✅ Has its own CI pipeline (`.github/workflows/ci.yml`)
- ✅ Can be cloned, developed, and deployed **independently**
- ✅ Fully autonomous — root does **NOT** provide runtime dependencies

Root's `pnpm-workspace.yaml` must have `packages: []` (empty) because submodules are managed via git, NOT as pnpm workspace.

### templates/

Reference configurations. **Copy, don't inherit.**

Used when creating new packages. Each package gets its own copy that it can modify.

```
templates/configs/
├── eslint/
│   ├── base.js          # Base ESLint rules
│   ├── react.js         # React-specific
│   └── angular.js       # Angular-specific
├── tsconfig/
│   ├── base.json        # Base TypeScript
│   ├── react.json       # React TypeScript
│   └── angular.json     # Angular TypeScript
├── prettier/
│   └── prettier.config.js
├── ci/
│   └── ci.yml           # GitHub Actions template
└── docker/
    ├── Dockerfile
    └── docker-compose.yml
```

### docs/

Knowledge base. Central documentation that packages link to.

```
docs/
├── architecture/        # Architectural principles
│   ├── PRINCIPLES.md    # UI Layer, composition
│   ├── FSD.md           # Feature-Sliced Design
│   ├── MODULAR.md       # Modular Architecture
│   └── ATOMIC.md        # Atomic Design
│
├── agents/              # AI agent definitions
│   ├── OVERVIEW.md
│   ├── ARCHITECT.md
│   ├── DEVELOPER.md
│   ├── TESTER.md
│   └── DESIGN.md
│
├── patterns/            # Reusable patterns
│   ├── ERROR_HANDLING.md
│   ├── AUTHENTICATION.md
│   ├── STATE_MANAGEMENT.md
│   └── ...
│
├── framework/           # Framework guides
│   ├── REACT.md
│   └── ANGULAR.md
│
├── technology/          # Technology guides
│   ├── WEB3.md
│   ├── SSR.md
│   └── FIREBASE.md
│
├── microfrontends/      # MF documentation
│   ├── OVERVIEW.md
│   ├── MODULE_FEDERATION.md
│   └── DEPLOYMENT.md
│
├── tooling/             # Tools and CI/CD
│   ├── VITE.md
│   ├── TESTING.md
│   ├── CI_CD.md
│   └── DEPLOYMENT.md
│
├── decisions/           # Architecture Decision Records
│
├── NAMING.md            # Naming convention
├── VERSIONING.md        # Git tags strategy
└── STRUCTURE.md         # This file
```

### scripts/

Node.js ESM automation scripts:

| Script               | Command                           | Description              |
| -------------------- | --------------------------------- | ------------------------ |
| `check-branch.mjs`   | husky pre-commit                  | Prevents commits to main |
| `create-package.mjs` | `pnpm new <name>`                 | Scaffolds new package    |
| `submodule-add.mjs`  | `pnpm submodule:add <url> <name>` | Adds git submodule       |

## Independence Principle

```
┌─────────────────────────────────────────────────────────────────┐
│                      front-templates (parent)                    │
│                                                                  │
│  Provides:                                                       │
│  • Grouping and organization                                     │
│  • Reference templates (copy, don't inherit)                     │
│  • Documentation                                                 │
│  • CI orchestration                                              │
│                                                                  │
│  Does NOT provide:                                               │
│  • Runtime dependencies                                          │
│  • Shared code (except MF)                                       │
│  • Inherited configurations                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌───────────────────┐ ┌───────────────┐ ┌───────────────┐
│ react-fsd-starter │ │ angular-*     │ │ react-mf-*    │
│                   │ │               │ │               │
│ ✅ Own configs    │ │ ✅ Own configs│ │ ✅ Own configs│
│ ✅ Own CI         │ │ ✅ Own CI     │ │ ✅ Own CI     │
│ ✅ Own deps       │ │ ✅ Own deps   │ │ ✅ Own deps   │
│ ✅ Fully portable │ │ ✅ Portable   │ │ ✅ Portable   │
└───────────────────┘ └───────────────┘ └───────────────┘
```

## Micro-Frontend Structure

MF systems are special — they have shared dependencies:

```
react-mf-shop-shell/        # Host application
react-mf-shop-catalog/      # Remote: product catalog
react-mf-shop-cart/         # Remote: shopping cart
react-mf-shop-shared/       # Shared libraries ← Only MF has shared
react-mf-shop-e2e/          # System E2E tests
```

**Shared packages exist only for MF**, not for regular projects.

## Package Internal Structure

Each package follows its own pattern. Example for FSD:

```
react-fsd-starter/
├── .github/
│   └── workflows/
│       └── ci.yml
├── .vscode/
│   ├── extensions.json
│   └── settings.json
├── src/
│   ├── app/               # Init, providers, styles
│   ├── pages/             # Route entry points
│   ├── widgets/           # Composite UI blocks
│   ├── features/          # User interactions
│   ├── entities/          # Business entities
│   └── shared/            # Reusable, no business logic
├── e2e/                   # Playwright tests
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
├── vite.config.ts
├── package.json
└── README.md
```
