# 🚀 ACE Supply Chain App - Quick Reference

## ✅ Status: LIVE & RUNNING

**URL**: https://ace-supply-chain-app-1444828305810485.aws.databricksapps.com

---

## Architecture

**Backend**: Python `http.server` (ThreadingHTTPServer)  
**Frontend**: React + TypeScript + TailwindCSS  
**Data**: Databricks SQL Warehouse → Unity Catalog (`kaustavpaul_demo.ace_demo`)  
**Pattern**: Same as discount-tire-demo (proven to work)

---

## Key Changes That Made It Work

1. ❌ **Flask** → ✅ **http.server** (built-in Python)
2. ❌ **4 dependencies** → ✅ **1 dependency** (databricks-sql-connector)
3. ❌ **app.py** → ✅ **server.py**
4. ✅ Minimal, proven pattern

---

## Management

```bash
# Check status
databricks apps get ace-supply-chain-app --profile e2-demo-field

# Redeploy (after changes)
databricks apps deploy ace-supply-chain-app \
  --source-code-path "/Workspace/Users/kaustav.paul@databricks.com/ace-demo/app" \
  --profile e2-demo-field

# Stop/Start
databricks apps stop ace-supply-chain-app --profile e2-demo-field
databricks apps start ace-supply-chain-app --profile e2-demo-field
```

---

## Files Deployed

```
/Workspace/Users/kaustav.paul@databricks.com/ace-demo/app/
├── app.yaml               # Config: python backend/server.py
├── backend/
│   ├── server.py         # Main: http.server implementation
│   └── requirements.txt  # databricks-sql-connector==3.3.0
└── dist/                 # React production build
    └── ...
```

---

## Dashboard Pages

1. **Home** - KPIs, live map, regional status, throughput trends
2. **Fleet** - Real-time truck tracking with product categories
3. **Risk** - Store risk assessment with revenue impact

---

## API Endpoints

All under `/api/*`:
- `/api/kpis` - Executive metrics
- `/api/fleet` - Active trucks
- `/api/risk-stores` - At-risk stores
- `/api/truck-locations` - GPS data
- `/api/alerts` - Delay alerts
- ... and more

---

## Success! 🎉

The app is live and serving data from your Unity Catalog tables through a proven, lightweight architecture.
