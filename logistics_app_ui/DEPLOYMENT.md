# ACE Supply Chain App - Deployment Guide

## Current Status
- **App Status**: RUNNING
- **Deployment**: SUCCEEDED  
- **App URL**: https://ace-supply-chain-app-1444828305810485.aws.databricksapps.com
- **Last Successful Deployment**: 2026-01-29T15:54:02Z

## Deployment Configuration

### Workspace Location
```
/Workspace/Users/kaustav.paul@databricks.com/ace-demo/app/
```

### Required Files in Workspace
```
app/
├── app.yaml              # Application configuration
├── backend/
│   ├── server.py        # Python HTTP server
│   └── requirements.txt # Python dependencies
└── dist/                # Built React frontend
```

## Security - Token Management

### Three Versions of app.yaml

| Version | Location | Token | Purpose |
|---------|----------|-------|---------|
| `app.yaml` | Git repository | ❌ Empty | Version control (safe to commit) |
| `app.yaml.local` | Local only (git-ignored) | ✅ Real token | Source for deployment |
| workspace `app.yaml` | Databricks workspace | ✅ Real token | Running app |

### Workflow

1. **Git Commit**: 
   - `app.yaml` (empty token) is committed to git
   - `app.yaml.local` is never committed (protected by `.gitignore`)

2. **Local Development**:
   - Edit `app.yaml.local` for local testing
   - Never commit `app.yaml.local`

3. **Deployment to Workspace**:
   ```bash
   # Upload app.yaml.local (with token) as app.yaml in workspace
   databricks workspace import \
     /Workspace/.../app.yaml \      # ← Destination in workspace
     --file app.yaml.local \         # ← Source from local
     --overwrite
   ```

**Critical**: Always upload `app.yaml.local` to workspace, never `app.yaml`

## Deployment Commands

### Option 1: Deploy from Local (Clean Build)
```bash
cd logistics_app_ui

# Build frontend
npm run build

# ⚠️ IMPORTANT: Upload app.yaml.local (has token) to workspace as app.yaml
databricks workspace import /Workspace/Users/kaustav.paul@databricks.com/ace-demo/app/app.yaml \
  --file app.yaml.local --format AUTO --overwrite --profile e2-demo-field
  # ↑ Note: We upload app.yaml.local (with token) TO app.yaml in workspace

# Upload backend files
databricks workspace import /Workspace/Users/kaustav.paul@databricks.com/ace-demo/app/backend/server.py \
  --file backend/server.py --format AUTO --overwrite --profile e2-demo-field

databricks workspace import /Workspace/Users/kaustav.paul@databricks.com/ace-demo/app/backend/requirements.txt \
  --file backend/requirements.txt --format AUTO --overwrite --profile e2-demo-field

# Upload built frontend
databricks workspace import-dir dist \
  /Workspace/Users/kaustav.paul@databricks.com/ace-demo/app/dist \
  --overwrite --profile e2-demo-field

# Deploy app
databricks apps deploy ace-supply-chain-app \
  --source-code-path "/Workspace/Users/kaustav.paul@databricks.com/ace-demo/app" \
  --profile e2-demo-field
```

**Key Point**: 
- Git tracks `app.yaml` (no token) ← Safe for version control
- Workspace uses `app.yaml.local` content (has token) ← Required for app to run
- We upload `app.yaml.local` FILE to workspace `app.yaml` PATH during deployment

### Critical: What NOT to Upload
- ❌ `node_modules/` (corrupts app)
- ❌ `src/` (source files, not needed)
- ❌ Development files (package.json, vite.config.ts, etc.)
- ✅ Only upload: `app.yaml`, `backend/`, `dist/`

## Data Configuration

### Unity Catalog
- **Catalog**: `kaustavpaul_demo`
- **Schema**: `ace_demo`

### SQL Warehouse
- **ID**: `4b9b953939869799`
- **Name**: Shared Unity Catalog Serverless

### Volume Paths
```
/Volumes/kaustavpaul_demo/ace_demo/ace_files/data/dimensions/
/Volumes/kaustavpaul_demo/ace_demo/ace_files/data/telemetry/
```

## Troubleshooting

### App Shows "No Data Available"
1. Verify DLT pipeline has run successfully
2. Check tables in `kaustavpaul_demo.ace_demo.*`
3. Verify SQL Warehouse is accessible
4. Check app logs: https://e2-demo-field-eng.cloud.databricks.com/apps/ace-supply-chain-app/logs

### Deployment Failed
1. Ensure no corrupted files in workspace (`node_modules`, `src`)
2. Wait for cooldown period (20 minutes between failed deployments)
3. Verify workspace folder structure is clean

### App Not Starting
1. Check backend/server.py syntax
2. Verify requirements.txt dependencies
3. Ensure app.yaml has valid token (in workspace)
4. Check deployment logs

## Current Working State

The app is confirmed working as of 2026-01-29 15:54 UTC with:
- All 3 tabs functional (Overview, Fleet & Fulfillment, Risk Analysis)
- Location Monitor tab with RSC and Store maps
- Voice AI integration with Genie API
- Optimized queries using gold tables
- Proper error handling and loading animations
