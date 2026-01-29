# ACE Supply Chain App Deployment Status

## Deployment Summary

**App Name**: `ace-supply-chain-app`  
**Status**: ⚠️ FAILED (Troubleshooting)  
**Workspace Path**: `/Workspace/Users/kaustav.paul@databricks.com/ace-demo/app`  
**URL**: https://ace-supply-chain-app-1444828305810485.aws.databricksapps.com

## What's Deployed

### ✅ Successfully Uploaded to Workspace

1. **app.yaml** - App configuration with environment variables
2. **backend/** - Flask API application  
   - app.py (main Flask server)
   - requirements.txt (Python dependencies)
   - README.md (documentation)
3. **dist/** - Built React frontend  
   - index.html  
   - assets/index-C6fvpwEG.js (React bundle)  
   - assets/index-uuvX5RuH.css (Styles)

### 📋 Configuration

```yaml
command: ["python", "backend/app.py"]

env:
  - DATABRICKS_HOST: e2-demo-field-eng.cloud.databricks.com
  - DATABRICKS_HTTP_PATH: /sql/1.0/warehouses/4b9b953939869799
  - DATABRICKS_ACCESS_TOKEN: dapi[REDACTED] (PAT)
  - DATABRICKS_CATALOG: kaustavpaul_demo
  - DATABRICKS_SCHEMA: ace_demo
```

## Current Issue

**Error**: `app crashed unexpectedly. Please check /logz for more details`

### Possible Causes

1. **Runtime Detection**: The app uses `DATABRICKS_RUNTIME_VERSION` to detect if it's running as a Databricks App, but this env var might not be set in Databricks Apps context.

2. **Flask vs HTTP Server**: The discount-tire-demo uses Python's built-in `http.server` module, while we're using Flask. Databricks Apps might have specific requirements.

3. **Port Binding**: The app binds to port 8000, but Databricks Apps might expect a different port or dynamic port assignment.

4. **Dependencies**: Flask dependencies might not be installing correctly in the Databricks Apps environment.

5. **Path Resolution**: The code uses `Path(__file__).parent.parent / 'dist'` to find static files, which might not resolve correctly in the Databricks Apps isolated environment.

## Files Deployed

```
/Workspace/Users/kaustav.paul@databricks.com/ace-demo/
├── pipelines/              # DLT pipeline code (existing)
├── notebooks/              # Analysis notebooks (existing)
└── app/                    # Databricks App (NEW)
    ├── app.yaml           # ✅ Uploaded
    ├── backend/           # ✅ Uploaded
    │   ├── app.py
    │   ├── requirements.txt
    │   ├── README.md
    │   └── .env.example
    └── dist/              # ✅ Uploaded
        ├── index.html
        └── assets/
            ├── index-C6fvpwEG.js
            └── index-uuvX5RuH.css
```

## Next Steps to Fix

### Option 1: Use Built-in HTTP Server (Like discount-tire)

Convert the Flask app to use Python's `http.server` module, which is proven to work with Databricks Apps.

**Pros:**
- Matches working example (discount-tire-demo)
- Lighter weight, fewer dependencies
- No WSGI server needed

**Cons:**
- Need to rewrite Flask routes to HTTP request handlers
- More manual request/response handling

### Option 2: Debug Flask Deployment

1. **Add logging** to see where the app crashes
2. **Remove runtime detection** - assume Databricks App mode if specific env vars are present
3. **Use Gunicorn** as WSGI server instead of Flask dev server
4. **Update requirements.txt**:
   ```
   flask==3.0.0
   gunicorn==21.2.0
   databricks-sql-connector==3.3.0
   ```
5. **Update app.yaml command**:
   ```yaml
   command: ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "backend.app:app"]
   ```

### Option 3: Simplify for Testing

Create a minimal Flask app to verify the deployment works, then add complexity:

```python
from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello from ACE Supply Chain!'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
```

## Recommended Approach

**Use Option 2 with Gunicorn** - This is the most production-ready approach and should work well with Databricks Apps.

### Implementation Steps:

1. Add Gunicorn to requirements.txt
2. Update app.yaml to use Gunicorn
3. Fix runtime detection logic (don't rely on DATABRICKS_RUNTIME_VERSION)
4. Test deployment

## Commands for Manual Intervention

### Check App Status
```bash
databricks apps get ace-supply-chain-app --profile e2-demo-field --output json | jq
```

### Redeploy After Fixes
```bash
# Upload updated files
databricks workspace import-dir backend "/Workspace/.../app/backend" --overwrite --profile e2-demo-field

# Redeploy
databricks apps deploy ace-supply-chain-app \
  --source-code-path "/Workspace/Users/kaustav.paul@databricks.com/ace-demo/app" \
  --profile e2-demo-field
```

### Delete and Recreate App (if needed)
```bash
databricks apps delete ace-supply-chain-app --profile e2-demo-field
databricks apps create ace-supply-chain-app --profile e2-demo-field
# ... then deploy
```

## Local Testing Before Redeploy

```bash
cd ace-hardware-demo/logistics_app_ui

# Set env vars
export DATABRICKS_HOST="e2-demo-field-eng.cloud.databricks.com"
export DATABRICKS_HTTP_PATH="/sql/1.0/warehouses/4b9b953939869799"
export DATABRICKS_ACCESS_TOKEN="dapi[REDACTED]"
export DATABRICKS_CATALOG="kaustavpaul_demo"
export DATABRICKS_SCHEMA="ace_demo"

# Test with Flask dev server
python backend/app.py

# Test with Gunicorn (if added)
gunicorn --bind 0.0.0.0:8000 backend.app:app
```

## Workspace File Verification

```bash
# List app files
databricks workspace list /Workspace/Users/kaustav.paul@databricks.com/ace-demo/app \
  --profile e2-demo-field

# Check specific file
databricks workspace export /Workspace/.../app/backend/app.py \
  --format SOURCE \
  --profile e2-demo-field
```

---

## Summary

The app infrastructure is deployed but the Python application is crashing on startup. The most likely fix is to:
1. Use Gunicorn instead of Flask dev server
2. Fix runtime environment detection
3. Ensure all dependencies install correctly

Would you like me to implement the Gunicorn fix now?
