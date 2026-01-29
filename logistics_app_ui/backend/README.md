# ACE Hardware Logistics Dashboard - Backend API

Flask-based REST API that connects to Databricks SQL Warehouse to serve data for the logistics dashboard.

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and add your Databricks credentials:
- `DATABRICKS_HTTP_PATH`: Your SQL Warehouse HTTP path
- `DATABRICKS_ACCESS_TOKEN`: Your personal access token

### 3. Run the API

```bash
python app.py
```

API will start on `http://localhost:5001`

## API Endpoints

### Executive Dashboard
- `GET /api/kpis` - Network throughput, late arrivals, avg delay, data quality score
- `GET /api/regions` - Regional status with utilization and alerts
- `GET /api/throughput` - 24-hour throughput trend data

### Fleet Tracking
- `GET /api/fleet` - Active fleet with routes, ETAs, delays, product categories
- `GET /api/truck-locations` - GPS coordinates for live map
- `GET /api/eta-accuracy` - ETA prediction accuracy over time

### Risk Management
- `GET /api/risk-stores` - Store risk scores with revenue impact
- `GET /api/delay-causes` - Root cause analysis of delays

### Alerts
- `GET /api/alerts` - Data-driven alerts from delay thresholds

### Health Check
- `GET /health` - API health status

## Query Parameters

Some endpoints support optional parameters:

- `/api/fleet?limit=50` - Limit number of trucks returned
- `/api/risk-stores?limit=20` - Limit number of stores
- `/api/delay-causes?days=7` - Days of historical data

## Data Sources

All data comes from ACE Hardware DLT pipeline tables:
- `kaustavpaul_demo.ace_demo.logistics_fact` - Main fact table
- `kaustavpaul_demo.ace_demo.logistics_silver` - Real-time telemetry
- `kaustavpaul_demo.ace_demo.supply_chain_kpi` - Aggregated KPIs
- `kaustavpaul_demo.ace_demo.product_category_metrics` - Product categories

## Development

### Testing Endpoints

```bash
# Health check
curl http://localhost:5001/health

# Get KPIs
curl http://localhost:5001/api/kpis

# Get fleet data
curl http://localhost:5001/api/fleet
```

### Debugging

Enable Flask debug mode (already enabled in development):
```python
app.run(debug=True)
```

Check logs for SQL query execution and errors.

## Production Deployment

For production, use a WSGI server like Gunicorn:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

Or deploy as a Databricks App using the provided `app.yaml` configuration.
