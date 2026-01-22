# Versioning Strategy

## Principle

Version framework compatibility via **git tags**, not package names.

Package names are **framework-agnostic**:

```
✅ react-fsd-starter
❌ react18-fsd-starter
```

## Tag Format

```
v{semver}-{framework}{major}
```

### Examples

| Tag               | Description                    |
| ----------------- | ------------------------------ |
| `v1.0.0-react18`  | Initial release for React 18   |
| `v1.1.0-react18`  | Bugfix for React 18            |
| `v1.2.0-react18`  | Feature for React 18           |
| `v2.0.0-react19`  | Migration to React 19          |
| `v2.1.0-react19`  | Feature for React 19           |
| `v1.0.0-angular17`| Initial release for Angular 17 |
| `v2.0.0-angular18`| Migration to Angular 18        |

## Branch Strategy

### Main Branch

`main` = latest stable framework version

When React 19 becomes stable:

1. Tag current state: `v1.x.x-react18-final`
2. Migrate to React 19
3. Continue on `main`

### Version Branches (Optional)

For long-term support of old versions:

```
main        → React 19 (active)
v1.x-react18 → React 18 (maintenance)
```

## README Compatibility Table

Every package README includes:

```markdown
## Compatibility

| Version | Framework  | Status           |
| ------- | ---------- | ---------------- |
| v2.x    | React 19   | 🟢 Active        |
| v1.x    | React 18   | 🟡 Maintenance   |
| v0.x    | React 17   | 🔴 Deprecated    |

### Status Legend

- 🟢 **Active** — new features, full support
- 🟡 **Maintenance** — security fixes only
- 🔴 **Deprecated** — no updates
```

## Workflow

### Creating a Release

```bash
# Ensure clean state
git status

# Tag the release
git tag -a v1.0.0-react18 -m "Release v1.0.0 for React 18"

# Push tag
git push origin v1.0.0-react18
```

### Migrating to New Framework Version

```bash
# 1. Tag final version of old framework
git tag -a v1.5.0-react18-final -m "Final release for React 18"
git push origin v1.5.0-react18-final

# 2. Create maintenance branch (optional)
git checkout -b v1.x-react18
git push origin v1.x-react18
git checkout main

# 3. Update dependencies
pnpm update react@19 react-dom@19

# 4. Fix breaking changes
# ... make necessary code changes ...

# 5. Commit and tag
git add .
git commit -m "feat: migrate to React 19"
git tag -a v2.0.0-react19 -m "Initial release for React 19"
git push origin main --tags
```

### Using Specific Version

```bash
# Clone latest
git clone <repo-url>

# Checkout specific version
git checkout v1.5.0-react18

# Or checkout maintenance branch
git checkout v1.x-react18
```

## Semver Guidelines

| Change Type        | Version Bump | Example           |
| ------------------ | ------------ | ----------------- |
| Breaking change    | Major        | v1.0.0 → v2.0.0   |
| Framework upgrade  | Major        | v1.0.0 → v2.0.0   |
| New feature        | Minor        | v1.0.0 → v1.1.0   |
| Bug fix            | Patch        | v1.0.0 → v1.0.1   |
| Security fix       | Patch        | v1.0.0 → v1.0.1   |

## CI Integration

GitHub Actions can use tags:

```yaml
on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Get version info
        run: |
          echo "Tag: ${{ github.ref_name }}"
          # Extract framework: v1.0.0-react18 → react18
          FRAMEWORK=$(echo ${{ github.ref_name }} | sed 's/v[0-9.]*-//')
          echo "Framework: $FRAMEWORK"
```
