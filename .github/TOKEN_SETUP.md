# GitHub Token Setup for CI/CD

## 🔑 Personal Access Token (PAT) Setup

### 1. Create GitHub PAT

Go to **GitHub Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**

**Required Permissions (Scopes):**

```
Repository permissions:
✅ Actions: Read
✅ Contents: Write  
✅ Metadata: Read
✅ Pull requests: Write
✅ Repository administration: Read

Account permissions:
✅ None required
```

**Alternative: Classic Token Scopes:**
```
✅ repo (Full control of private repositories)
✅ workflow (Update GitHub Action workflows)
✅ read:org (Read org and team membership)
```

### 2. Add Secret to Repository

1. Go to **Repository Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `GH_PAT`
4. Value: Your PAT token
5. Click **Add secret**

### 3. For Organization/Multi-repo Setup

If using across multiple repositories:

1. Go to **Organization Settings** → **Secrets and variables** → **Actions**
2. Add **Organization secret**: `GH_PAT`
3. Set repository access to **All repositories** or **Selected repositories**

## 🔧 What the Token Is Used For

| Action | Permission Needed | Description |
|--------|------------------|-------------|
| **Trigger Submodule CI** | `repo` | Dispatch events to submodule repos |
| **Wait for CI Status** | `actions:read` | Check workflow run status |
| **Create PRs** | `pull_requests:write` | Auto-create pull requests |
| **Access Private Repos** | `repo` | Access private submodule repositories |

## 🛡️ Security Considerations

### Best Practices:
- ✅ **Minimal Scope**: Only grant required permissions
- ✅ **Repository-Specific**: Use fine-grained tokens when possible
- ✅ **Expiration**: Set reasonable expiration dates (90 days max)
- ✅ **Rotate Regularly**: Update tokens quarterly

### Token Security:
```bash
# ❌ NEVER commit tokens to code
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"

# ✅ Use GitHub Secrets
secrets.GH_PAT
```

## 🚨 Troubleshooting

### Common Issues:

**"GH_TOKEN required" Error:**
```bash
# Check if secret exists
gh api repos/:owner/:repo/actions/secrets

# Verify token permissions
curl -H "Authorization: token $TOKEN" https://api.github.com/user
```

**"Repository not accessible":**
- Check if PAT has access to all submodule repositories
- Verify organization permissions for multi-repo setups
- Ensure token hasn't expired

**"Insufficient permissions":**
- Review required scopes above
- Check if organization has token restrictions
- Verify repository-level permissions

## 🔄 Fallback Behavior

The CI is configured with fallback logic:

```yaml
env:
  GH_TOKEN: ${{ secrets.GH_PAT || github.token }}
```

- **Primary**: Custom PAT (`secrets.GH_PAT`) - Full permissions
- **Fallback**: GitHub token (`github.token`) - Limited permissions

**When fallback is used:**
- ✅ Basic CI operations work
- ⚠️ Cross-repository operations may fail
- ⚠️ PR creation may have limited functionality

## 📋 Setup Checklist

- [ ] Create PAT with required scopes
- [ ] Add `GH_PAT` secret to repository/organization
- [ ] Test workflow run
- [ ] Verify submodule CI triggers
- [ ] Confirm PR auto-creation works
- [ ] Set token expiration reminder

---

**Next Steps:** After setting up the token, push changes to test the CI workflow.