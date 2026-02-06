# Front-Templates

> **Production-ready frontend templates** — architecture patterns, best practices, enterprise standards

## 🎯 Purpose

A curated collection of **enterprise-grade templates** with proven architecture patterns:

- **Architecture patterns** — FSD, Modular, Atomic, Clean
- **Frameworks** — React 18+, Angular 17+
- **Technologies** — Web3, SSR (Next.js), Micro-frontends
- **Best practices** — TypeScript strict mode, 80%+ test coverage, security-first
- **AI-Powered** — Specialized coding agents for architecture validation
- **CI/CD Ready** — Automated testing, security scanning, deployment

Each template is **battle-tested**, fully independent, and ready for production use.

## 📦 Structure

```
packages/
├── react-fsd-starter/          # React + Feature-Sliced Design
├── react-modular-starter/      # React + Modular Architecture
├── react-web3-wagmi-starter/   # React + Web3 (wagmi)
├── react-mf-shop-shell/        # Micro-frontend shell
├── react-mf-shop-catalog/      # Micro-frontend remote
├── angular-standalone-starter/ # Angular Standalone
├── angular-ngrx-starter/       # Angular + NgRx
└── ...
```

## 🚀 Quick Start

```bash
# Clone WITH submodules
git clone --recursive <repo-url>
cd front-templates

# Install root dependencies (dev tools, husky, etc)
pnpm install --workspace-root

# Each package is independent - work in the package directory
cd packages/react-fsd-starter
pnpm install
pnpm dev

# OR in another terminal
cd packages/angular-standalone-orders
pnpm install
pnpm dev
```

### Work With a Package

Each package is a **separate git repository** and must be worked on independently:

```bash
# Navigate to the package
cd packages/your-package

# Install its dependencies (creates own pnpm-lock.yaml)
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

**DO NOT** run `pnpm dev` or `pnpm install` from root — each package is autonomous.
pnpm install
pnpm dev
```

Or copy from monorepo:

```bash
cp -r packages/react-fsd-starter my-project
cd my-project
rm -rf .git
git init
pnpm install
```

## 📐 Architecture

### Hierarchy

```
Framework → Pattern/Technology → Project
```

- **Framework**: React, Angular
- **Pattern**: FSD, Modular, Atomic, Standalone, NgRx
- **Technology**: Web3, MF, SSR (Next.js, Firebase)

### Naming Convention

```
{framework}-{pattern|technology}-{project}[-{role}]
```

See [docs/NAMING.md](docs/NAMING.md) for details.

### Versioning

Framework versions managed via git tags:

```
v1.0.0-react18
v2.0.0-react19
```

See [docs/VERSIONING.md](docs/VERSIONING.md) for details.

## 📋 Defaults

|              | React          | Angular        |
| ------------ | -------------- | -------------- |
| Build        | Vite           | Angular CLI    |
| Styling      | Tailwind       | SCSS           |
| State        | Zustand        | Signals        |
| Server State | TanStack Query | HttpClient     |
| Forms        | RHF + Zod      | Reactive Forms |
| Testing      | Jest + RTL     | Jest           |
| E2E          | Playwright     | Playwright     |

## 🤖 AI Agents

Specialized agents for code review and architecture validation:

| Agent         | Responsibility                        |
| ------------- | ------------------------------------- |
| **Architect** | Structure, layers, dependencies       |
| **Developer** | Code quality, TypeScript, SOLID       |
| **Tester**    | Coverage, test quality, E2E strategy  |
| **Design**    | UI consistency, tokens, accessibility |

See [docs/agents/](docs/agents/) for agent definitions.

## 📚 Documentation

- [Architecture Principles](docs/architecture/PRINCIPLES.md)
- [Naming Convention](docs/NAMING.md)
- [Versioning Strategy](docs/VERSIONING.md)
- [Repository Structure](docs/STRUCTURE.md)

### Patterns

- [Error Handling](docs/patterns/ERROR_HANDLING.md)
- [Authentication](docs/patterns/AUTHENTICATION.md)
- [State Management](docs/patterns/STATE_MANAGEMENT.md)
- [Forms](docs/patterns/FORMS.md)
- [Performance](docs/patterns/PERFORMANCE.md)

### Frameworks

- [React Guide](docs/framework/REACT.md)
- [Angular Guide](docs/framework/ANGULAR.md)

### Technologies

- [Web3](docs/technology/WEB3.md)
- [SSR (Next.js)](docs/technology/SSR.md)
- [Micro-frontends](docs/microfrontends/OVERVIEW.md)

## 🤖 CI/CD & Automation

### Pull Request Automation

- **System-level PR creation** — Automatic PR generation from feature branches
- **Submodule coordination** — Integrated CI across monorepo packages
- **Security validation** — Automated security and dependency checks

See [docs/ci/PR_AUTOMATION.md](docs/ci/PR_AUTOMATION.md) for complete workflow details.

### Git Workflow

```bash
# ⚠️ STRICT: Never work directly in main branch
git checkout -b feature/your-feature
# ... make changes ...
git push origin feature/your-feature
# 🤖 PR automatically created by CI
```

## 🔒 Security

All packages include mandatory security checks:

- **gitleaks** — secret scanning
- **npm audit** — dependency vulnerabilities

## 🗺️ Status & Roadmap

### ✅ Completed

- [x] Repository structure & monorepo setup
- [x] Comprehensive documentation & best practices
- [x] AI agents for code quality & architecture
- [x] **react-fsd-starter** — Feature-Sliced Design template
- [x] CI/CD automation with PR workflows
- [x] Security scanning & dependency auditing
- [x] TypeScript strict mode configuration

### 🚧 In Progress

- [ ] angular-standalone-starter
- [ ] react-modular-starter

### 📅 Planned

- [ ] Web3 templates (wagmi, viem)
- [ ] Micro-frontend templates
- [ ] Next.js SSR templates
- [ ] Vue 3 templates (future)

## 📄 License

MIT
