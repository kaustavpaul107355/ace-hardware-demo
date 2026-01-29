# ACE Hardware - Supply Chain Logistics Demo

**Real-time logistics monitoring and AI-powered analytics for ACE Hardware supply chain operations.**

[![Status](https://img.shields.io/badge/status-production-green)]()
[![Databricks](https://img.shields.io/badge/databricks-apps-orange)]()
[![License](https://img.shields.io/badge/license-proprietary-blue)]()

---

## 🚀 Live Application

**Production URL**: https://ace-supply-chain-app-1444828305810485.aws.databricksapps.com  
**Status**: ✅ RUNNING  
**Last Updated**: January 29, 2026

---

## 📋 Overview

The ACE Hardware Supply Chain Logistics application provides real-time visibility into:
- **Fleet Management**: 100+ active trucks across 20 distribution centers
- **Risk Analytics**: Revenue impact analysis for 50+ monitored stores
- **AI Assistant**: Voice-enabled natural language queries via Databricks Genie
- **Location Intelligence**: Interactive maps for RSCs and store networks

### Key Features
- 🗺️ **Real-time Maps**: Leaflet-based visualization of distribution centers and stores
- 🎤 **Voice AI**: Ask questions naturally, get instant answers
- 📊 **Pre-computed KPIs**: Sub-second dashboard loads via gold tables
- 🔄 **Auto-refresh**: React Query caching with 2-minute stale time
- 🎨 **Modern UI**: React + TypeScript + TailwindCSS

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Databricks Apps                        │
│  ┌──────────────┐              ┌──────────────┐        │
│  │   Frontend   │◄────────────►│   Backend    │        │
│  │ React + TS   │   API Calls  │  Python HTTP │        │
│  └──────────────┘              └──────┬───────┘        │
│                                       │                 │
│                                       ▼                 │
│  ┌──────────────────────────────────────────────┐      │
│  │        Unity Catalog Tables                  │      │
│  │  ┌────────┐  ┌────────┐  ┌──────────────┐  │      │
│  │  │ Bronze │─►│ Silver │─►│ Gold (KPIs)  │  │      │
│  │  └────────┘  └────────┘  └──────────────┘  │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
│  ┌──────────────────────────────────────────────┐      │
│  │         DLT Pipelines (ETL)                  │      │
│  └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, React Query
- **Backend**: Python 3.11, databricks-sql-connector, http.server
- **Data**: Unity Catalog, Delta Lake, DLT Pipelines
- **ML**: Databricks Genie API (voice AI)
- **Maps**: Leaflet, React-Leaflet

---

## 📊 Data Pipeline

### Bronze Layer (Raw Data)
- `logistics_bronze`: Telemetry events (GPS, status updates)
- `shipments_bronze`: ASN data
- `vendors_bronze`, `stores_bronze`, `regions_bronze`: Dimension tables

### Silver Layer (Cleaned & Enriched)
- `logistics_silver`: Cleaned telemetry with calculated fields
  - Haversine distance calculations
  - Delay computation
  - Status standardization

### Gold Layer (Aggregated Metrics)
- `supply_chain_kpi`: Pre-computed dashboard KPIs
- `logistics_fact`: Fact table for analytical queries
- `store_delay_metrics`: Store-level delay aggregations
- `regional_performance`, `vendor_performance`, `carrier_performance`

### Views
- `v_supply_chain_facts`: Unified fact view
- `v_supply_chain_metrics`: Business metrics view

---

## 🚢 Deployment

### Quick Deploy
```bash
cd logistics_app_ui

# Build frontend
npm run build

# Deploy to Databricks
databricks workspace import \
  /Workspace/Users/kaustav.paul@databricks.com/ace-demo/app/app.yaml \
  --file app.yaml.local --overwrite --profile e2-demo-field

databricks workspace import \
  /Workspace/Users/kaustav.paul@databricks.com/ace-demo/app/backend/server.py \
  --file backend/server.py --overwrite --profile e2-demo-field

databricks workspace import-dir dist \
  /Workspace/Users/kaustav.paul@databricks.com/ace-demo/app/dist \
  --overwrite --profile e2-demo-field

# Trigger deployment
databricks apps deploy ace-supply-chain-app \
  --source-code-path "/Workspace/Users/kaustav.paul@databricks.com/ace-demo/app" \
  --profile e2-demo-field
```

**Important**: Always use `app.yaml.local` (has token) for deployment, never `app.yaml` (empty token).

📖 **Full Guide**: See `logistics_app_ui/DEPLOYMENT.md`

---

## 🔒 Security

### Token Management
- ✅ `app.yaml` (git): Empty token placeholder
- ✅ `app.yaml.local` (local): Real token, git-ignored
- ✅ Workspace: Real token deployed from `.local`

### Pre-commit Hooks
- Secret scanning enabled (Databricks Git Hook V2.0.3)
- Blocks commits with exposed tokens

📖 **Full Strategy**: See `logistics_app_ui/TOKEN_STRATEGY.md`

---

## 📂 Repository Structure

```
ace-hardware-demo/
├── logistics_app_ui/          # Main Databricks App
│   ├── backend/               # Python server
│   │   ├── server.py         # HTTP server (1,620 lines)
│   │   └── requirements.txt  # Python dependencies
│   ├── src/                   # React TypeScript source
│   │   ├── app/
│   │   │   ├── components/   # UI components
│   │   │   └── services/     # API client
│   │   └── styles/           # CSS/Tailwind
│   ├── dist/                  # Production build (git-ignored)
│   ├── app.yaml              # Config (empty token, for git)
│   ├── app.yaml.local        # Config (real token, git-ignored)
│   ├── DEPLOYMENT.md         # Deployment guide
│   └── TOKEN_STRATEGY.md     # Security guide
├── pipelines/                 # DLT pipeline definitions
│   ├── bronze_*.py           # Raw data ingestion
│   ├── silver_*.py           # Cleaning & enrichment
│   └── gold_*.py             # Aggregations
├── notebooks/                 # Feature engineering
│   └── ace-ml-feature-process.py
├── data/                      # Synthetic data generators
├── docs/                      # Documentation
│   ├── CODE_REVIEW.md        # This review
│   ├── archive/              # Historical docs
│   └── sql_examples/         # Query examples
├── CODE_REVIEW.md            # Code quality assessment
├── SYNC_STATUS.md            # Current sync status
└── README.md                 # This file
```

---

## 🔧 Configuration

### Environment Variables
Required in `app.yaml`:
```yaml
DATABRICKS_HOST: e2-demo-field-eng.cloud.databricks.com
DATABRICKS_HTTP_PATH: /sql/1.0/warehouses/4b9b953939869799
DATABRICKS_ACCESS_TOKEN: <YOUR_PAT>
DATABRICKS_CATALOG: kaustavpaul_demo
DATABRICKS_SCHEMA: ace_demo
GENIE_SPACE_ID: <YOUR_GENIE_SPACE_ID>
```

### Unity Catalog Setup
- **Catalog**: `kaustavpaul_demo`
- **Schema**: `ace_demo`
- **Volume**: `/Volumes/kaustavpaul_demo/ace_demo/ace_files`

---

## 📈 Performance

| Metric | Value |
|--------|-------|
| Overview Tab Load | ~1.5s |
| Fleet Tab Load | ~2.0s |
| Risk Analysis Load | ~1.5s |
| Location Monitor Load | ~2.5s |
| API Latency (avg) | 200-800ms |
| Connection Pool Size | 5 |
| Cache TTL (client) | 2 minutes |

### Optimizations Applied
- ✅ Connection pooling (30% latency reduction)
- ✅ Gold table queries (50% faster)
- ✅ React Query caching (80% fewer API calls)
- ✅ Code splitting & lazy loading
- ✅ Loading skeletons (perceived performance)

---

## 🧪 Testing

**Current Status**: Manual testing only  
**Recommendation**: Add automated tests

Suggested frameworks:
- **Backend**: pytest
- **Frontend**: Vitest + React Testing Library
- **E2E**: Playwright

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `README.md` (this file) | Project overview |
| `CODE_REVIEW.md` | Code quality assessment |
| `logistics_app_ui/DEPLOYMENT.md` | Deployment guide |
| `logistics_app_ui/TOKEN_STRATEGY.md` | Security strategy |
| `SYNC_STATUS.md` | Current sync status |
| `docs/archive/` | Historical documentation |

---

## 🎯 Roadmap

### Completed ✅
- Real-time fleet tracking dashboard
- Risk analysis with revenue impact
- Voice AI integration (Genie)
- Location intelligence maps
- Performance optimizations
- Security hardening
- Comprehensive documentation

### Future Enhancements 🔮
- [ ] Automated testing suite
- [ ] Predictive ETA modeling
- [ ] Mobile-responsive layout
- [ ] Real-time alerting
- [ ] Historical trend analysis

---

## 👥 Contact

**Maintainer**: Kaustav Paul  
**Organization**: Databricks  
**Profile**: `e2-demo-field`

---

## 📄 License

Proprietary - Databricks Internal Demo

---

**Last Updated**: January 29, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production
