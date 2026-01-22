# Branch Protection Setup

## GitHub Settings

Enable these rules for the `main` branch in each repository:

### Repository Settings → Branches → Add Rule

**Branch name pattern:** `main`

**Protection Rules:**

- [x] Require a pull request before merging
  - [x] Require approvals: 1 (or more for teams)
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from Code Owners (optional)
  
- [x] Require status checks to pass before merging
  - [x] Require branches to be up to date before merging
  - Select required checks:
    - `lint`
    - `security`
    - `unit-tests`
    - `build`

- [x] Require conversation resolution before merging

- [x] Do not allow bypassing the above settings

### For Submodule Repos

Same settings, but also add:

- [x] `e2e-tests`
- [x] `coverage`

## Local Enforcement

The pre-commit hook (`scripts/check-branch.mjs`) blocks commits to protected branches locally.

### Husky Setup

```bash
# .husky/pre-commit
node scripts/check-branch.mjs
pnpm lint-staged
```

## Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes, commit
3. Push: `git push -u origin feature/my-feature`
4. Create Pull Request on GitHub
5. Wait for CI checks to pass
6. Get review approval
7. Merge PR (squash recommended)
8. Delete feature branch
