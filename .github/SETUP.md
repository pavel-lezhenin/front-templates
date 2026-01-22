# Setup Guide

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Git

## Initial Setup

### 1. Clone Repository

```bash
git clone --recursive https://github.com/your-org/front-templates.git
cd front-templates
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Husky

```bash
pnpm prepare
```

## GitHub Configuration

### Required Secrets

For the parent repository:

| Secret | Description |
|--------|-------------|
| `GH_PAT` | Personal Access Token with `repo` and `workflow` scopes |

### Creating GH_PAT

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with:
   - `repo` (full control)
   - `workflow` (update GitHub Action workflows)
3. Copy token and add to repository secrets:
   - Repository → Settings → Secrets and variables → Actions → New repository secret
   - Name: `GH_PAT`
   - Value: (paste token)

### Branch Protection

See [BRANCH_PROTECTION.md](BRANCH_PROTECTION.md) for detailed setup.

## Creating New Package

```bash
pnpm new react-fsd-starter --framework=react
```

## Submodule Workflow

### Adding Existing Repo as Submodule

```bash
git submodule add https://github.com/your-org/react-fsd-starter packages/react-fsd-starter
git commit -m "chore: add react-fsd-starter submodule"
```

### Updating Submodules

```bash
# Update all
git submodule update --remote --merge

# Update specific
cd packages/react-fsd-starter
git pull origin main
cd ../..
git add packages/react-fsd-starter
git commit -m "chore: update react-fsd-starter submodule"
```

### Checking Submodule Status

```bash
pnpm submodule:check
```
