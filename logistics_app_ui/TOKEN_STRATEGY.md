# Token Management Strategy - Quick Reference

## The Problem
We need tokens in the workspace for the app to run, but we can't commit tokens to git.

## The Solution: Three Files

```
┌─────────────────┬──────────────┬─────────────────┐
│ File            │ Has Token?   │ Purpose         │
├─────────────────┼──────────────┼─────────────────┤
│ app.yaml        │ ❌ NO        │ Git (safe)      │
│ app.yaml.local  │ ✅ YES       │ Deploy source   │
│ (workspace)     │ ✅ YES       │ Running app     │
└─────────────────┴──────────────┴─────────────────┘
```

## Commands to Remember

### ✅ Correct Deployment
```bash
# Upload app.yaml.local (with token) TO workspace app.yaml
databricks workspace import \
  /Workspace/Users/kaustav.paul@databricks.com/ace-demo/app/app.yaml \
  --file app.yaml.local \
  --overwrite --profile e2-demo-field
```

### ❌ Wrong - Will Break App
```bash
# DON'T do this - uploads empty token
databricks workspace import \
  /Workspace/Users/kaustav.paul@databricks.com/ace-demo/app/app.yaml \
  --file app.yaml \  # ← Missing .local - WRONG!
  --overwrite
```

## Git Strategy

### What Gets Committed
- ✅ `app.yaml` (empty token)
- ✅ `.gitignore` (protects app.yaml.local)
- ❌ `app.yaml.local` (ignored by git)

### .gitignore Protection
```gitignore
# This line protects the token
app.yaml.local
*.local
```

## Verification

Before deploying, always check:
```bash
# Local files
grep "value:" app.yaml        # Should be empty
grep "value:" app.yaml.local  # Should have token

# Workspace file (after deployment)
databricks workspace export \
  /Workspace/.../app.yaml --profile e2-demo-field | grep ACCESS_TOKEN
# Should show the token
```

## Summary

**Git**: `app.yaml` (no token) → Safe ✅  
**Deploy**: `app.yaml.local` (has token) → Works ✅  
**Workspace**: Gets token from `.local` → App runs ✅
