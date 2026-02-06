# 🚨 CRITICAL: Package Isolation Rules

## ⚡ Architecture: Git Submodules, NOT pnpm Workspace

This is a **GIT SUBMODULE monorepo**, not a pnpm workspace.

- **Root**: A git repository containing documentation and configuration
- **Packages**: Independent git repositories (git submodules)

Each package:
- Has its own `.git` directory
- Has its own `pnpm-lock.yaml`
- Has its own CI pipeline
- Is developed and deployed independently

**pnpm-workspace.yaml is EMPTY** (`packages: []`) because packages are managed via git, not pnpm.

---

## ⚡ ABSOLUTE PROHIBITIONS

### ❌ NEVER DO THIS:
```bash
# From monorepo root - FORBIDDEN!
pnpm dev
pnpm build
pnpm test
pnpm --filter package-name dev
pnpm run dev:package-name
npm run dev:package-name

# Adding workspace commands to root package.json - FORBIDDEN!
{
  "scripts": {
    "dev:package": "pnpm --filter package dev",  // ❌ NEVER!
    "build:all": "pnpm run build",               // ❌ NEVER!
  }
}
```

### ✅ ALWAYS DO THIS:
```bash
# Navigate to package FIRST
cd packages/specific-package

# Then run package commands
pnpm install
pnpm dev
pnpm build
pnpm test
```

## 🎯 WHY THIS MATTERS

- **Isolation** — Each package is independent (own git history, lockfile)
- **Scalability** — No cross-contamination between packages
- **Debugging** — Clear scope of problems (dev server only runs one package)
- **CI/CD** — Independent deployments per package
- **Dependencies** — No phantom dependencies or version conflicts
- **Git** — Submodules can be cloned, branched, deployed separately

## 🛡️ ENFORCEMENT

This rule is **MANDATORY** and must be followed without exceptions.

**Any violation breaks the monorepo architecture.**

---

**Remember: ISOLATION IS KING! 👑**
