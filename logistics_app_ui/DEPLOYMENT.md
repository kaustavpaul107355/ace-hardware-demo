# Databricks App Deployment Guide

## Overview

This guide explains how to deploy the ACE Logistics Dashboard as a Databricks App.

## Prerequisites

- Databricks CLI configured with profile `e2-demo-field`
- Workspace access to `/Workspace/Users/kaustav.paul@databricks.com/ace-demo/`
- SQL Warehouse ID: `4b9b953939869799`
- Unity Catalog: `kaustavpaul_demo.ace_demo`

## Deployment Steps

### 1. Build Frontend

```bash
cd ace-hardware-demo/logistics_app_ui
npm run build
```

This creates the `dist/` folder with optimized React bundle.

### 2. Sync to Workspace

```bash
./scripts/sync-to-workspace.sh e2-demo-field kaustav.paul@databricks.com
```

This will:
- Create workspace directory `/Workspace/Users/kaustav.paul@databricks.com/ace-demo/app/`
- Upload `app.yaml`
- Upload `backend/` folder
- Upload `dist/` folder (built React app)

### 3. Deploy App

```bash
./scripts/deploy-app.sh e2-demo-field kaustav.paul@databricks.com ace-supply-chain-app
```

This will:
- Deploy the app to Databricks Apps platform
- Start the Flask server
- Return app URL when ready

### 4. Access App

Once deployed, you'll get a URL like:
```
https://e2-demo-field-eng.cloud.databricks.com/apps/ace-supply-chain-app
```

## Folder Structure in Workspace

```
/Workspace/Users/kaustav.paul@databricks.com/ace-demo/
├── pipelines/              # DLT pipeline code
│   ├── transform/
│   │   ├── bronze_logistics.py
│   │   ├── bronze_dimensions.py
│   │   ├── silver_logistics.py
│   │   └── gold_flo_metrics.py
│   └── analytics/
│       └── analytics_views.sql
├── notebooks/              # Analysis notebooks
│   └── ace-ml-feature-process.py
└── app/                    # Databricks App (NEW)
    ├── app.yaml           # App configuration
    ├── backend/           # Flask API
    │   ├── app.py
    │   └── requirements.txt
    └── dist/              # Built React frontend
        ├── index.html
        ├── assets/
        └── ...
```

## App Configuration

### app.yaml

```yaml
command: ["python", "backend/app.py"]

env:
  - name: "DATABRICKS_HOST"
    value: "e2-demo-field-eng.cloud.databricks.com"
  - name: "DATABRICKS_HTTP_PATH"
    value: "/sql/1.0/warehouses/4b9b953939869799"
  - name: "DATABRICKS_ACCESS_TOKEN"
    value: "{{secrets/ace_demo/databricks_token}}"
  - name: "DATABRICKS_CATALOG"
    value: "kaustavpaul_demo"
  - name: "DATABRICKS_SCHEMA"
    value: "ace_demo"
```

## Environment Variables

The app uses these environment variables:

- `DATABRICKS_HOST`: Workspace hostname
- `DATABRICKS_HTTP_PATH`: SQL Warehouse endpoint path
- `DATABRICKS_ACCESS_TOKEN`: PAT for authentication
- `DATABRICKS_CATALOG`: Unity Catalog name
- `DATABRICKS_SCHEMA`: Schema name
- `PORT`: Server port (8000 for Databricks Apps, 5001 for local)

## Secrets Management

For production, use Databricks Secrets:

```bash
# Create secret scope
databricks secrets create-scope ace_demo --profile e2-demo-field

# Add token
databricks secrets put-secret ace_demo databricks_token \
  --string-value "dapi..." \
  --profile e2-demo-field
```

Then update `app.yaml`:
```yaml
value: "{{secrets/ace_demo/databricks_token}}"
```

## Troubleshooting

### App Won't Start

Check app logs:
```bash
databricks apps get ace-supply-chain-app --profile e2-demo-field
```

### 404 Errors

The backend serves both:
- `/api/*` - API endpoints
- `/*` - Static React app (SPA routing)

If static files aren't loading, verify:
```bash
databricks workspace list /Workspace/Users/kaustav.paul@databricks.com/ace-demo/app/dist \
  --profile e2-demo-field
```

### Database Connection Issues

Test SQL Warehouse connectivity:
```bash
databricks warehouses get 4b9b953939869799 --profile e2-demo-field
```

Verify tables exist:
```sql
SHOW TABLES IN kaustavpaul_demo.ace_demo;
```

## Update Deployment

To update an existing deployment:

```bash
# 1. Rebuild frontend
npm run build

# 2. Sync changes
./scripts/sync-to-workspace.sh

# 3. Restart app
databricks apps stop ace-supply-chain-app --profile e2-demo-field
databricks apps start ace-supply-chain-app --profile e2-demo-field
```

Or just redeploy:
```bash
./scripts/deploy-app.sh
```

## Local Development vs Databricks Apps

### Local Mode
- Backend runs on `http://localhost:5001`
- Frontend runs on `http://localhost:5173` (Vite dev server)
- CORS enabled
- Hot reload enabled
- Uses `.env` file for config

### Databricks App Mode
- Backend runs on port 8000 (or `$PORT`)
- Serves built React app from `dist/`
- No CORS needed (same origin)
- Uses environment variables from `app.yaml`
- Automatically scales and manages resources

## Monitoring

### Check App Status
```bash
databricks apps get ace-supply-chain-app --profile e2-demo-field --output json | jq
```

### View Logs
```bash
databricks apps logs ace-supply-chain-app --profile e2-demo-field
```

### List All Apps
```bash
databricks apps list --profile e2-demo-field
```

## Cleanup

To delete the app:
```bash
databricks apps delete ace-supply-chain-app --profile e2-demo-field
```

To clean workspace files:
```bash
databricks workspace delete /Workspace/Users/kaustav.paul@databricks.com/ace-demo/app \
  --recursive \
  --profile e2-demo-field
```

## Next Steps

After deployment:
1. ✅ Access app URL
2. ✅ Test all pages (Home, Fleet, Risk)
3. ✅ Verify data loads correctly
4. ✅ Share URL with stakeholders
5. 🟡 Set up Genie Space integration (optional)
6. 🟡 Add Lakeview Dashboard links (optional)

## Support

For issues:
- Check logs: `databricks apps logs ace-supply-chain-app`
- Review workspace files: `databricks workspace list /Workspace/.../app`
- Test API locally first before deploying
- Verify SQL Warehouse is running

---

**App Name**: `ace-supply-chain-app`  
**Workspace Path**: `/Workspace/Users/kaustav.paul@databricks.com/ace-demo/app`  
**Catalog**: `kaustavpaul_demo.ace_demo`  
**Status**: ✅ Ready to deploy
