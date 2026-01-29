# 🚨 CRITICAL: Package Isolation Rules

## ⚡ ABSOLUTE PROHIBITIONS

### ❌ NEVER DO THIS:
```bash
# From monorepo root - FORBIDDEN!
pnpm dev
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
# Navigate to package first
cd packages/specific-package

# Then run package commands
pnpm install
pnpm dev
pnpm build
pnpm test
```

## 🎯 WHY THIS MATTERS

- **Isolation** — Each package is independent
- **Scalability** — No cross-contamination
- **Debugging** — Clear scope of problems  
- **CI/CD** — Independent deployments
- **Dependencies** — No phantom deps

## 🛡️ ENFORCEMENT

This rule is **MANDATORY** and must be followed without exceptions.

**Any violation breaks the entire monorepo architecture.**

---

**Remember: ISOLATION IS KING! 👑**