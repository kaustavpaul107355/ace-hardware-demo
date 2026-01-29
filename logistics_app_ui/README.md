# ACE Hardware Logistics Dashboard

Modern, real-time logistics dashboard built with React + TypeScript, powered by Databricks SQL Warehouse and ACE Hardware synthetic data pipeline.

![Dashboard Preview](https://img.shields.io/badge/Status-MVP%20Ready-success)
![Databricks](https://img.shields.io/badge/Databricks-Connected-red)
![React](https://img.shields.io/badge/React-18.3.1-blue)

## 🎯 Overview

A production-ready logistics analytics dashboard featuring:

- **Executive KPIs**: Real-time network throughput, late arrivals, average delays
- **Live Fleet Tracking**: GPS-based truck monitoring with delay attribution  
- **Risk Intelligence**: Store-level risk scoring with revenue impact analysis
- **Delay Analytics**: Root cause analysis with actionable insights
- **Data Quality Monitoring**: Pipeline health and data quality metrics

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│   React + TS    │ ───> │   Flask API      │ ───> │ Databricks SQL      │
│   Frontend      │      │   (Port 5001)    │      │ Warehouse           │
│   (Port 5173)   │      │                  │      │                     │
└─────────────────┘      └──────────────────┘      └─────────────────────┘
        │                         │                          │
        │                         │                          │
    Vite Dev              Databricks SDK               Unity Catalog
    Tailwind CSS          Flask-CORS              kaustavpaul_demo.ace_demo
    Recharts              Python 3.11+                   DLT Pipeline
```

## 📊 Data Sources

All data sourced from ACE Hardware DLT pipeline:

| Table | Purpose | Records |
|-------|---------|---------|
| `logistics_fact` | Main fact table with all dimensions | ~2M |
| `logistics_silver` | Real-time telemetry & GPS | ~1.5M |
| `supply_chain_kpi` | Pre-aggregated KPIs by region | ~50 |
| `store_delay_metrics` | Store-level performance | ~500 |
| `vendor_performance` | Vendor reliability by region | ~100 |
| `carrier_performance` | Carrier benchmarking | ~20 |
| `product_category_metrics` | Product-level analysis | ~30 |

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **Databricks** SQL Warehouse with access to `kaustavpaul_demo.ace_demo` catalog
- **Git** for version control

### 1. Clone and Setup

```bash
cd ace-hardware-demo/logistics_app_ui

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your Databricks credentials
```

**Frontend** (`.env`):
```bash
cp .env.example .env
# Default API URL is already configured
```

### 3. Start Services

**Terminal 1 - Backend API**:
```bash
cd backend
python app.py
# API starts on http://localhost:5001
```

**Terminal 2 - Frontend**:
```bash
npm run dev
# UI starts on http://localhost:5173
```

### 4. Access Dashboard

Open browser to: `http://localhost:5173`

Default landing: **Home Page** (Executive Dashboard)

## 📁 Project Structure

```
logistics_app_ui/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── pages/          # Main dashboard pages
│   │   │   │   ├── Home.tsx            ✅ Executive overview
│   │   │   │   ├── Fleet.tsx           ✅ Fleet tracking (modified)
│   │   │   │   ├── RiskDashboard.tsx   ✅ Risk intelligence (modified)
│   │   │   │   ├── Pipelines.tsx       🟡 Data quality (simplified)
│   │   │   │   ├── Alerts.tsx          🟡 Alerts (simplified)
│   │   │   │   └── Settings.tsx        ❌ Excluded
│   │   │   ├── layouts/        # Page layouts
│   │   │   └── ui/             # Reusable UI components
│   │   ├── data/
│   │   │   └── mockData.ts     # Modified for ACE data structure
│   │   ├── services/
│   │   │   └── api.ts          ✅ NEW: API client with TypeScript types
│   │   └── App.tsx             # Router configuration
│   ├── styles/                 # Tailwind CSS
│   └── main.tsx
├── backend/                    ✅ NEW: Flask API
│   ├── app.py                  # Main API with 10 endpoints
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment template
│   └── README.md               # Backend documentation
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md                   # This file
```

## 🎨 UI Modifications (From Figma)

### ✅ Built As-Is
1. **Home Page** - All KPIs, maps, charts supported by ACE data
2. **Risk Heatmap** - Regional risk visualization
3. **ETA Charts** - Predicted vs actual accuracy tracking
4. **Delay Attribution** - Root cause pie charts

### 🟡 Modified for ACE Data
1. **Fleet Table**:
   - ❌ Removed: `Driver` column (not in data)
   - ✅ Replaced: `Cargo` → `Product Category` (from product table)
   - ✅ Added: `Shipment Value` (from logistics_silver)

2. **Risk Table**:
   - ❌ Removed: `Est. Stockout` (no inventory data)
   - ✅ Replaced: `Suggested Action` → `Risk Tier` (HIGH/CRITICAL/MEDIUM)
   - ✅ Enhanced: `Revenue at Risk` calculation

### ❌ Excluded (Out of Scope)
- **Settings Page** - User management not needed for demo
- **Notification Channels** - Infrastructure beyond data app
- **Real Alerting System** - Using data-driven "alerts" instead

## 🔌 API Endpoints

All endpoints return JSON and support CORS for local development.

### Executive Dashboard
```bash
GET /api/kpis                    # Network throughput, delays, data quality
GET /api/regions                 # Regional status and utilization
GET /api/throughput              # 24-hour trend data
```

### Fleet Operations
```bash
GET /api/fleet?limit=50          # Active trucks with routes and ETAs
GET /api/truck-locations         # GPS coordinates for map
GET /api/eta-accuracy            # ETA prediction performance
```

### Risk Management
```bash
GET /api/risk-stores?limit=20    # High-risk stores with revenue impact
GET /api/delay-causes?days=7     # Delay root cause breakdown
```

### System Health
```bash
GET /health                      # API health check
GET /api/alerts                  # Data-driven alerts from delays
```

## 🎨 Technology Stack

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **TailwindCSS 4.x** - Styling
- **Recharts** - Data visualization
- **Radix UI** - Component primitives
- **React Router** - Page navigation
- **Lucide React** - Icon library

### Backend
- **Flask 3.0** - API framework
- **Databricks SQL Connector** - Database access
- **Flask-CORS** - CORS support
- **Python-dotenv** - Environment management

### Data Layer
- **Databricks SQL Warehouse** - Compute
- **Unity Catalog** - Data governance
- **Delta Lake** - Storage format
- **DLT** - Pipeline orchestration

## 📊 Data Flow

```
1. User opens dashboard
   └─> React app loads

2. React calls API client (api.ts)
   └─> fetch('http://localhost:5001/api/kpis')

3. Flask API receives request
   └─> Executes SQL query against Databricks

4. Databricks SQL Warehouse
   └─> Queries Unity Catalog tables (Delta Lake)

5. Results returned through chain
   └─> Flask → JSON → React → UI render
```

## 🎯 Key Features

### 1. Executive KPIs (Home Page)
- **Network Throughput**: Live count of trucks in transit
- **Late Arrivals**: 24h delayed shipment count & percentage
- **Average Delay**: Mean delay across all active routes
- **Data Quality Score**: Pipeline health indicator (96.8%)

### 2. Live Fleet Tracking (Fleet Page)
- Real-time table of active trucks
- Route visualization (origin → destination)
- Delay tracking with reason attribution
- Product category classification
- Shipment value tracking

### 3. Risk Intelligence (Risk Dashboard)
- Store-level risk scoring (0-100)
- Revenue at risk calculations
- Primary delay identification
- Risk tier classification (CRITICAL/HIGH/MEDIUM)
- Regional risk heatmap

### 4. Delay Analytics
- Traffic, weather, vehicle issues breakdown
- Historical trend analysis
- Percentage distribution pie chart
- 7-day rolling window

### 5. ETA Accuracy Tracking
- Predicted vs actual arrival comparison
- 6-hour historical view
- ML model performance monitoring

## 🧪 Testing

### Test Backend API
```bash
# Health check
curl http://localhost:5001/health

# Get KPIs
curl http://localhost:5001/api/kpis | jq

# Get fleet data
curl http://localhost:5001/api/fleet | jq
```

### Test Frontend
```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🚀 Deployment Options

### Option 1: Databricks Apps (Recommended)
```yaml
# app.yaml
name: ace-logistics-dashboard
workspace: /Workspace/Users/your-email/ace-demo/app
```

Deploy:
```bash
databricks apps create ace-logistics-dashboard
databricks apps deploy ace-logistics-dashboard
```

### Option 2: Docker
```dockerfile
# Dockerfile (create this)
FROM python:3.11-slim
WORKDIR /app
COPY backend/ ./backend/
COPY dist/ ./static/
RUN pip install -r backend/requirements.txt
EXPOSE 5001
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5001", "backend.app:app"]
```

### Option 3: Traditional Hosting
1. Build frontend: `npm run build`
2. Deploy `dist/` to CDN (Vercel, Netlify, etc.)
3. Deploy Flask API to cloud (AWS Lambda, Google Cloud Run, etc.)
4. Update `VITE_API_URL` in `.env`

## 🔧 Configuration

### Backend Configuration (`.env`)
```bash
# Required
DATABRICKS_SERVER_HOSTNAME=e2-demo-field-eng.cloud.databricks.com
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/your-id
DATABRICKS_ACCESS_TOKEN=dapi1234567890abcdef

# Optional
DATABRICKS_CATALOG=kaustavpaul_demo  # default
DATABRICKS_SCHEMA=ace_demo           # default
```

### Frontend Configuration (`.env`)
```bash
# API endpoint
VITE_API_URL=http://localhost:5001

# Optional features
VITE_ENABLE_REAL_TIME_UPDATES=false
VITE_REFRESH_INTERVAL_MS=30000
```

## 📈 Performance Optimization

### Caching Strategy
- Add Redis for query result caching
- Cache TTL: 30 seconds for real-time data
- Cache key: `{endpoint}:{params_hash}`

### Query Optimization
- All queries include `LIMIT` clauses
- Indexed columns: `truck_id`, `store_id`, `event_ts`
- 24-hour time window for most queries

### Frontend Optimization
- Code splitting by route
- Lazy loading for charts
- Debounced API calls
- Virtual scrolling for large tables

## 🐛 Troubleshooting

### Backend Issues

**Problem**: `Failed to connect to Databricks`
```bash
# Check credentials
echo $DATABRICKS_ACCESS_TOKEN
# Verify SQL Warehouse is running
databricks sql warehouses list
```

**Problem**: `CORS errors in browser`
```bash
# Ensure Flask-CORS is installed
pip install flask-cors
# Check API is running on correct port
curl http://localhost:5001/health
```

### Frontend Issues

**Problem**: `Cannot fetch data`
```bash
# Check API URL in .env
cat .env | grep VITE_API_URL
# Test API endpoint directly
curl http://localhost:5001/api/kpis
```

**Problem**: `Build fails`
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📚 Documentation

- **Backend API**: See `backend/README.md`
- **Feasibility Study**: See `UI_FEASIBILITY_ASSESSMENT.md`
- **Quick Reference**: See `UI_FEASIBILITY_SUMMARY.md`
- **Data Pipeline**: See `ace-hardware-demo/README.md`

## 🤝 Contributing

This is a demo project for ACE Hardware logistics analytics. For improvements:

1. Test changes locally
2. Update documentation
3. Ensure backward compatibility with ACE data schema
4. Add new API endpoints to both `backend/app.py` and `src/app/services/api.ts`

## 📝 License

Internal Databricks demo project. Not for external distribution.

## 🔗 Related Assets

- **Genie Space**: [AI-powered analytics](https://e2-demo-field-eng.cloud.databricks.com/genie/rooms/...)
- **Lakeview Dashboard**: [Operational dashboard](https://e2-demo-field-eng.cloud.databricks.com/dashboardsv3/...)
- **DLT Pipeline**: `ace-hardware-demo/pipelines/`
- **Synthetic Data**: `ace-hardware-demo/data/`

## 🎓 Learning Resources

- [Databricks Apps Documentation](https://docs.databricks.com/apps)
- [React Best Practices](https://react.dev/learn)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Flask REST API Guide](https://flask.palletsprojects.com/)

---

**Built with ❤️ using Databricks + React**

*Last Updated*: January 2026  
*Version*: 1.0.0 (MVP)  
*Status*: ✅ Ready for Demo
