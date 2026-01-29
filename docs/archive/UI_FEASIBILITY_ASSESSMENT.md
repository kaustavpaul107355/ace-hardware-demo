# UI Feasibility Assessment: Figma Logistics Dashboard vs ACE Hardware Data

**Assessment Date**: January 22, 2026  
**Analyst**: AI Code Assistant  
**UI Framework**: React + TypeScript + TailwindCSS + Recharts  
**Data Source**: ACE Hardware DLT Pipeline + Unity Catalog Tables

---

## Executive Summary

**Overall Feasibility**: 🟢 **85% Buildable** with ACE data

The Figma-generated UI is well-designed and **mostly aligned** with our ACE Hardware analytics capabilities. However, **3 major components need modifications** and **2 features should be excluded** due to data limitations.

---

## UI Components Analysis

### ✅ **FULLY SUPPORTED** (Can Build As-Is)

#### 1. Home Page - Executive Overview
**Figma Components**:
- KPI Cards (Network Throughput, Late Arrivals, Avg Delay, Data Quality)
- Live Fleet Map
- Regional Status Grid
- Network Throughput Chart (24h)

**Data Mapping**:
| UI Component | ACE Data Source | Confidence |
|--------------|-----------------|------------|
| Network Throughput | `COUNT(DISTINCT truck_id) FROM logistics_silver WHERE event_type='IN_TRANSIT'` | ✅ 100% |
| Late Arrivals (24h) | `SUM(is_delayed) FROM logistics_fact WHERE event_ts >= NOW() - INTERVAL 24 HOURS` | ✅ 100% |
| Avg Delay | `AVG(delay_minutes) FROM logistics_fact WHERE delay_minutes > 0` | ✅ 100% |
| Data Quality Score | `AVG(passRate) FROM data_quality_checks` | 🟡 80% (Need to add DQ tracking) |
| Regional Status | `SELECT region_id, COUNT(*) FROM logistics_silver GROUP BY region_id` | ✅ 100% |

**SQL Query Example**:
```sql
-- KPI: Late Arrivals (24h)
SELECT 
  COUNT(*) as late_arrivals,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM kaustavpaul_demo.ace_demo.logistics_fact
WHERE delay_minutes > 30
  AND delivery_timestamp >= CURRENT_TIMESTAMP() - INTERVAL 24 HOURS;
```

**Verdict**: ✅ **100% Feasible** - All data available

---

#### 2. Risk Dashboard - Stockout Forecasting
**Figma Components**:
- Summary Cards (Critical Risk, High Risk, Avg Risk Window, Coverage Rate)
- Regional Risk Heatmap
- Stockout Forecast Table (Store ID, Location, Risk Score, Primary Delay, Est. Stockout, Action)

**Data Mapping**:
| UI Component | ACE Data Source | Confidence |
|--------------|-----------------|------------|
| Critical/High Risk Counts | `COUNT(*) FROM logistics_fact WHERE store_risk_tier='HIGH'` | ✅ 100% |
| Risk Score | `store_avg_delay + vendor_delay_rate * region_multiplier` | ✅ 100% |
| Primary Delay | `delay_reason FROM logistics_fact` | ✅ 100% |
| Estimated Stockout | **❌ NOT AVAILABLE** | ❌ 0% |
| Suggested Action | **❌ NOT AVAILABLE** (requires rule engine) | 🟡 30% |
| Avg Risk Window | **Calculated**: `AVG(estimated_arrival_ts - event_ts) WHERE delay_minutes > 0` | ✅ 90% |

**SQL Query Example**:
```sql
-- Risk Dashboard: High-Risk Stores
SELECT 
  store_id,
  CONCAT(store_city, ', ', store_state) as location,
  ROUND(store_avg_delay + (region_vendor_avg_delay * 0.3), 0) as risk_score,
  delay_reason as primary_delay,
  store_risk_tier,
  revenue_at_risk
FROM kaustavpaul_demo.ace_demo.logistics_fact
WHERE store_risk_tier IN ('HIGH', 'MEDIUM')
GROUP BY store_id, store_city, store_state, store_avg_delay, 
         region_vendor_avg_delay, delay_reason, store_risk_tier, revenue_at_risk
ORDER BY risk_score DESC
LIMIT 20;
```

**Modifications Needed**:
1. ⚠️ **"Estimated Stockout"** - Replace with **"Hours Until Next Delivery"** (we have `planned_arrival_ts`)
2. ⚠️ **"Suggested Action"** - Replace with simpler **"Risk Tier"** or **"Revenue at Risk"**
3. ✅ Regional Heatmap can use `store_risk_tier` aggregated by region

**Verdict**: 🟡 **70% Feasible** - Core functionality supported, but 2 fields need replacement

---

#### 3. Fleet Page - Real-Time Tracking
**Figma Components**:
- Summary Cards (Active Trucks, On Time, Minor Delays, Delayed)
- Fleet Status Table (Truck ID, Driver, Route, ETA, Delay, Status, Cargo)
- ETA Accuracy Timeline Chart
- Delay Root Causes (Pie Chart)

**Data Mapping**:
| UI Component | ACE Data Source | Confidence |
|--------------|-----------------|------------|
| Active Trucks | `COUNT(DISTINCT truck_id) FROM logistics_silver WHERE event_type='IN_TRANSIT'` | ✅ 100% |
| Truck ID | `truck_id FROM logistics_silver` | ✅ 100% |
| **Driver Name** | **❌ NOT IN DATA** | ❌ 0% |
| Route (Origin → Destination) | `origin_city → store_city FROM logistics_silver` | ✅ 100% |
| ETA | `estimated_arrival_ts FROM logistics_silver` | ✅ 100% |
| Delay (minutes) | `delay_minutes FROM logistics_silver` | ✅ 100% |
| Status | `shipment_status FROM logistics_silver` | ✅ 100% |
| **Cargo Description** | **❌ NOT IN DATA** | 🟡 30% |
| Delay Causes | `delay_reason FROM logistics_fact` | ✅ 100% |
| ETA vs Actual | `estimated_arrival_ts vs actual_arrival_ts FROM logistics_silver` | ✅ 100% |

**SQL Query Example**:
```sql
-- Fleet Table: Active Trucks
SELECT 
  t.truck_id,
  t.shipment_id,
  CONCAT(t.origin_city, ', ', t.origin_state) as origin,
  CONCAT(t.store_city, ', ', t.store_state) as destination,
  DATE_FORMAT(t.estimated_arrival_ts, 'h:mm a') as eta,
  COALESCE(t.delay_minutes, 0) as delay,
  CASE 
    WHEN t.delay_minutes IS NULL OR t.delay_minutes = 0 THEN 'on-time'
    WHEN t.delay_minutes < 30 THEN 'minor-delay'
    ELSE 'delayed'
  END as status,
  CONCAT(p.category, ' Products') as cargo
FROM kaustavpaul_demo.ace_demo.logistics_silver t
LEFT JOIN kaustavpaul_demo.ace_demo.product_category_metrics p 
  ON t.region_id = p.region_id
WHERE t.event_type = 'IN_TRANSIT'
ORDER BY t.estimated_arrival_ts
LIMIT 20;
```

**Modifications Needed**:
1. ❌ **"Driver Name"** - **REMOVE** (not in data, privacy concerns anyway)
2. 🟡 **"Cargo"** - **REPLACE** with **"Product Category"** from `product_category_metrics` table
3. ✅ All other fields directly supported

**Verdict**: 🟢 **90% Feasible** - Remove driver, replace cargo with product category

---

#### 4. Pipelines Page - Data Quality Monitoring
**Figma Components**:
- Summary Cards (Active Pipelines, Running, Warning, Error)
- Pipeline Status Table (Pipeline, Status, Last Run, Data Quality, Records Processed)
- Data Quality Checks Table
- Quality Score Distribution Chart

**Data Mapping**:
| UI Component | ACE Data Source | Confidence |
|--------------|-----------------|------------|
| Active Pipelines | **HARDCODED** (6 pipelines) | ✅ 100% |
| Pipeline Status | **❌ NOT TRACKED** (need to add) | 🟡 60% |
| Data Quality Checks | **❌ NOT TRACKED** (DLT expectations exist but not exposed) | 🟡 40% |
| Records Processed | `COUNT(*) FROM bronze/silver/gold tables` | ✅ 90% |

**What We Have**:
```python
# From silver_logistics.py - DLT Expectations
QUALITY_RULES = {
    "store_id_not_null": "store_id IS NOT NULL",
    "vendor_id_not_null": "vendor_id IS NOT NULL",
    "event_ts_not_null": "event_ts IS NOT NULL",
    "valid_status": "shipment_status IN ('ON_TIME','DELAYED','IN_TRANSIT','PENDING')",
    "valid_vendor_type": "vendor_type IN ('ACE','NON_ACE')",
    "valid_event_type": "event_type IN (...)"
}
```

**What We Need**:
```sql
-- Would need to add this table to track DQ metrics
CREATE TABLE data_quality_metrics AS
SELECT 
  'store_id_not_null' as check_name,
  COUNT(*) as total_records,
  COUNT(*) - COUNT(store_id) as failed_records,
  ROUND((COUNT(store_id) * 100.0 / COUNT(*)), 2) as pass_rate,
  CURRENT_TIMESTAMP() as check_ts
FROM logistics_bronze
GROUP BY check_name;
```

**Modifications Needed**:
1. ⚠️ **Add DQ tracking table** - Implement as recommended in `IMPROVEMENT_RECOMMENDATIONS.md` (Category 3.1)
2. 🟡 **Simplify pipeline list** - Show our actual 5 pipelines (Bronze Logistics, Bronze Dimensions, Silver, Gold, Analytics)
3. 🟡 **Mock "Last Run" timestamps** - Could query DLT system tables or hardcode reasonable values

**Verdict**: 🟡 **60% Feasible** - Core functionality works, but DQ tracking needs to be added

---

#### 5. Alerts Page - Notifications
**Figma Components**:
- Summary Cards (Total Alerts, Critical, Warnings, Action Required)
- Alerts List with severity levels
- Alert Thresholds Configuration
- Notification Channels

**Data Mapping**:
| UI Component | ACE Data Source | Confidence |
|--------------|-----------------|------------|
| Alerts | **❌ NO ALERTING SYSTEM** | ❌ 0% |
| Delay-based alerts | `SELECT * FROM logistics_fact WHERE delay_minutes > 120` | 🟡 70% |
| DQ-based alerts | **❌ NOT TRACKED** (need DQ metrics first) | 🟡 40% |
| Notification Channels | **❌ OUT OF SCOPE** (infrastructure) | ❌ 0% |

**What We Can Build**:
```sql
-- Simulate alerts from current data
SELECT 
  CONCAT('Truck ', truck_id, ' Delayed >2 Hours') as title,
  CONCAT('Delay reason: ', delay_reason, ' affecting delivery to ', store_name) as description,
  CASE 
    WHEN delay_minutes > 120 THEN 'critical'
    WHEN delay_minutes > 60 THEN 'warning'
    ELSE 'info'
  END as type,
  DATE_FORMAT(event_ts, 'h:mm a') as timestamp,
  CASE WHEN delay_minutes > 120 THEN true ELSE false END as action_required
FROM kaustavpaul_demo.ace_demo.logistics_fact
WHERE delay_minutes > 30
  AND event_ts >= CURRENT_TIMESTAMP() - INTERVAL 24 HOURS
ORDER BY delay_minutes DESC
LIMIT 20;
```

**Modifications Needed**:
1. ⚠️ **Alerts = Derived from data**, not actual alerting system
2. ⚠️ **Alert Thresholds** - Make it a configuration UI (not functional, just display)
3. ❌ **Notification Channels** - **EXCLUDE** (requires infrastructure beyond data app)

**Verdict**: 🟡 **50% Feasible** - Can show "alerts" as filtered data, but no real alerting system

---

### ⚠️ **NEEDS MODIFICATION**

#### 6. Settings Page
**Figma Component**: User settings, preferences, etc.

**Verdict**: ❌ **EXCLUDE** - Out of scope for data demo. Focus on analytics, not user management.

---

## Detailed Data Availability Matrix

### Available Data Fields (From ACE Hardware Pipeline)

| Category | Fields Available | Example Usage in UI |
|----------|------------------|---------------------|
| **Telemetry** | event_id, truck_id, shipment_id, event_ts, latitude, longitude, delay_minutes, delay_reason, temperature_celsius | Fleet tracking, delay analysis |
| **Stores** | store_id, store_name, city, state, region_id, lat/long, weekly_revenue, is_active | Store risk scoring, location mapping |
| **Vendors** | vendor_id, vendor_name, vendor_type (ACE/NON_ACE), risk_tier, on_time_pct | Vendor performance analysis |
| **Shipments** | shipment_id, origin, planned/estimated/actual arrival times, carrier, total_value | ETA accuracy, route tracking |
| **Products** | sku, product_name, category, unit_price, requires_temp_control | Cargo classification |
| **Carriers** | carrier name, delivery counts, avg delays | Carrier benchmarking |
| **Gold Metrics** | store_delay_metrics, vendor_performance, carrier_performance, product_category_metrics | KPI calculations |
| **Analytics** | logistics_fact, supply_chain_kpi | Unified fact table |

### Missing Data Fields

| UI Requires | Why Missing | Workaround |
|-------------|-------------|------------|
| **Driver Name** | Privacy + Not tracked | ❌ Remove field |
| **Cargo Description** | Too detailed | 🟡 Use `product_category` instead |
| **Estimated Stockout Time** | Requires inventory data | 🟡 Replace with "Hours to Next Delivery" |
| **Suggested Actions** | Requires business rules engine | 🟡 Replace with "Risk Tier" badge |
| **Notification Channels** | Infrastructure | ❌ Remove entire section |
| **Pipeline Status** | DLT system tables not exposed | 🟡 Mock with last refresh times |
| **Data Quality Pass/Fail Counts** | DLT expectations don't expose metrics | ⚠️ Need to add tracking (30 min effort) |

---

## Page-by-Page Feasibility Breakdown

### **1. Home Page** 
**Feasibility**: 🟢 **95%**

✅ **Can Build**:
- All 4 KPI cards
- Live map with truck positions (from lat/long)
- Regional status grid
- Throughput chart (time-series from `event_ts`)
- Business context section

⚠️ **Needs Adjustment**:
- Map needs actual GPS coordinates rendered (Figma shows simplified grid)
- Consider using Leaflet.js or MapBox for real map

**Recommendation**: ✅ **BUILD AS-IS** with map library upgrade

---

### **2. Risk Dashboard**
**Feasibility**: 🟡 **70%**

✅ **Can Build**:
- Risk score calculation (from delay metrics)
- Store risk tiers (HIGH/MEDIUM/LOW)
- Primary delay reasons
- Risk heatmap by region
- Revenue at risk calculations

❌ **Cannot Build**:
- "Estimated Stockout" field (no inventory data)
- "Suggested Action" field (no rule engine)

🟡 **Alternative Data**:
Replace table columns with:
| Replace This | With This | ACE Data |
|--------------|-----------|----------|
| ~~Est. Stockout~~ | **Revenue at Risk** | `revenue_at_risk FROM logistics_fact` |
| ~~Suggested Action~~ | **Risk Tier Badge** | `store_risk_tier FROM logistics_fact` |

**Updated Table Design**:
```typescript
// Modified Risk Dashboard Table
{
  storeId: 'ACE-1234',
  location: 'Chicago, IL',
  riskScore: 87,
  primaryDelay: 'Traffic',
  revenueAtRisk: '$45,230',      // NEW: Replaces "Est. Stockout"
  riskTier: 'HIGH'                // NEW: Replaces "Suggested Action"
}
```

**Recommendation**: 🟡 **BUILD WITH MODIFICATIONS** - Replace 2 columns with ACE-available data

---

### **3. Fleet Page**
**Feasibility**: 🟢 **90%**

✅ **Can Build**:
- Active fleet summary cards
- Truck ID, Route, ETA, Delay, Status
- ETA vs Actual timeline chart
- Delay root causes pie chart (from `delay_reason`)

❌ **Cannot Build**:
- Driver names (not in data)

🟡 **Partial Support**:
- Cargo description → Use **product category** instead

**Modified Fleet Table Design**:
```typescript
// Remove driver, replace cargo
{
  id: 'TRK-5421',
  // driver: 'John Smith',        ❌ REMOVE
  origin: 'Chicago, IL',
  destination: 'Kansas City RSC',
  eta: '2:30 PM',
  delay: 0,
  status: 'on-time',
  productCategory: 'POWER_TOOLS',  // ✅ NEW: From products table
  shipmentValue: '$12,450'          // ✅ NEW: From shipment_value
}
```

**Recommendation**: ✅ **BUILD WITH MINOR CHANGES** - Remove driver, use product category

---

### **4. Pipelines Page**
**Feasibility**: 🟡 **60%**

✅ **Can Build**:
- Pipeline list (hardcoded: Bronze, Silver, Gold, Analytics, ML)
- Records processed counts
- Quality score concept

❌ **Cannot Build (Without New Infra)**:
- Real-time pipeline status (need DLT API integration)
- Actual last run timestamps (need DLT system tables)
- Pass/fail counts per quality rule

🟡 **Workarounds**:
1. **Pipeline Status** → Query table last updated timestamps:
```sql
SELECT 
  'logistics_bronze' as pipeline_name,
  'Running' as status,  -- Hardcoded for demo
  MAX(fact_refresh_ts) as last_run,
  COUNT(*) as records_processed
FROM kaustavpaul_demo.ace_demo.logistics_fact;
```

2. **Data Quality Checks** → Add recommended DQ tracking table:
```sql
-- From IMPROVEMENT_RECOMMENDATIONS.md Section 3.1
CREATE TABLE data_quality_metrics AS
SELECT 
  'store_id_not_null' as check_name,
  SUM(CASE WHEN store_id IS NULL THEN 1 ELSE 0 END) as failed,
  COUNT(*) as total,
  ROUND(((COUNT(*) - SUM(CASE WHEN store_id IS NULL THEN 1 ELSE 0 END)) * 100.0 / COUNT(*)), 2) as pass_rate
FROM logistics_bronze
GROUP BY check_name;
```

**Recommendation**: 🟡 **BUILD SIMPLIFIED VERSION** - Add DQ tracking (30 min) OR use static values for demo

---

### **5. Alerts Page**
**Feasibility**: 🟡 **50%**

✅ **Can Build**:
- Alert generation from delay data
- Alert severity classification (based on delay thresholds)
- Alert counts by type

❌ **Cannot Build**:
- Real alerting system (email, Slack, SMS)
- "Mark as Read" functionality (requires state management)
- Alert history/persistence

🟡 **Demo-Friendly Approach**:
```sql
-- "Alerts" as real-time query results
SELECT 
  ROW_NUMBER() OVER (ORDER BY delay_minutes DESC) as id,
  CASE 
    WHEN delay_minutes > 120 THEN 'critical'
    WHEN delay_minutes > 60 THEN 'warning'
    ELSE 'info'
  END as type,
  CONCAT('Truck ', truck_id, ' Delayed ', delay_minutes, ' Minutes') as title,
  CONCAT('Route: ', origin_city, ' → ', store_city, ' | Reason: ', delay_reason) as description,
  DATE_FORMAT(event_ts, '%h:%m %p') as timestamp,
  CASE WHEN delay_minutes > 120 THEN true ELSE false END as action_required
FROM kaustavpaul_demo.ace_demo.logistics_fact
WHERE delay_minutes > 30
  AND delivery_timestamp >= CURRENT_TIMESTAMP() - INTERVAL 24 HOURS
ORDER BY delay_minutes DESC
LIMIT 20;
```

**Modifications Needed**:
1. ❌ **Notification Channels Section** - **EXCLUDE** (infrastructure, not data)
2. ⚠️ **Alert Thresholds** - Make **read-only/display-only** (not editable)
3. ✅ Alert list and counts fully supported

**Recommendation**: 🟡 **BUILD SIMPLIFIED** - Show data-driven "alerts", exclude notification infrastructure

---

### **6. Settings Page**
**Feasibility**: ❌ **0%**

**Verdict**: ❌ **EXCLUDE ENTIRELY** - Not relevant for analytics demo

---

## Technology Stack Feasibility

### Current Figma UI Stack:
- ✅ **React 18** - Good choice
- ✅ **TypeScript** - Type safety
- ✅ **TailwindCSS** - Modern styling
- ✅ **Recharts** - Works well for our data
- ✅ **Radix UI** - Good component library
- ✅ **React Router** - Page navigation

### Integration Needs:
1. **Map Library** - Add Leaflet.js or MapBox for real GPS rendering
   - Current: SVG grid pattern
   - Needed: Actual map with real coordinates
   - **Effort**: 1-2 hours

2. **Data Fetching Layer** - Add API client for Databricks SQL
   - Options:
     - Databricks SQL Connector (Python backend + REST API)
     - Direct SQL Warehouse REST API
     - Databricks Apps SDK (if available)
   - **Effort**: 2-3 hours

3. **Real-time Updates** - Optional polling/websockets
   - Current: Static mock data
   - Possible: Polling SQL Warehouse every 30s-1min
   - **Effort**: 1-2 hours

---

## Data API Requirements

### What the UI Needs:

**Endpoint 1: Executive KPIs** (`/api/kpis`)
```typescript
interface KPIResponse {
  networkThroughput: number;      // trucks in transit
  lateArrivals24h: number;        // delayed count
  lateArrivalsPercent: number;    // delay rate
  avgDelay: number;               // average delay minutes
  dataQualityScore: number;       // overall DQ score
}
```

**SQL Query**:
```sql
SELECT 
  COUNT(DISTINCT CASE WHEN event_type='IN_TRANSIT' THEN truck_id END) as network_throughput,
  SUM(CASE WHEN delay_minutes > 30 THEN 1 ELSE 0 END) as late_arrivals,
  ROUND(AVG(delay_minutes), 1) as avg_delay,
  96.8 as data_quality_score  -- Mock until DQ tracking added
FROM kaustavpaul_demo.ace_demo.logistics_fact
WHERE delivery_timestamp >= CURRENT_TIMESTAMP() - INTERVAL 24 HOURS;
```

---

**Endpoint 2: Regional Status** (`/api/regions`)
```typescript
interface RegionalStatus {
  name: string;
  trucks: number;
  utilization: number;
  status: 'normal' | 'warning' | 'critical';
}
```

**SQL Query**:
```sql
SELECT 
  region_id as name,
  COUNT(DISTINCT truck_id) as trucks,
  ROUND(AVG(delay_rate_pct), 0) as utilization,
  CASE 
    WHEN AVG(delay_rate_pct) > 20 THEN 'critical'
    WHEN AVG(delay_rate_pct) > 10 THEN 'warning'
    ELSE 'normal'
  END as status
FROM kaustavpaul_demo.ace_demo.supply_chain_kpi
GROUP BY region_id;
```

---

**Endpoint 3: Live Fleet** (`/api/fleet`)
```typescript
interface FleetTruck {
  id: string;
  origin: string;
  destination: string;
  eta: string;
  delay: number;
  status: 'on-time' | 'minor-delay' | 'delayed';
  productCategory: string;
  shipmentValue: number;
}
```

**SQL Query**:
```sql
SELECT 
  t.truck_id as id,
  CONCAT(t.origin_city, ', ', t.origin_state) as origin,
  CONCAT(t.store_city, ', ', t.store_state) as destination,
  DATE_FORMAT(t.estimated_arrival_ts, '%l:%M %p') as eta,
  COALESCE(t.delay_minutes, 0) as delay,
  CASE 
    WHEN delay_minutes IS NULL OR delay_minutes = 0 THEN 'on-time'
    WHEN delay_minutes < 30 THEN 'minor-delay'
    ELSE 'delayed'
  END as status,
  p.category as product_category,
  t.shipment_total_value as shipment_value
FROM kaustavpaul_demo.ace_demo.logistics_silver t
LEFT JOIN kaustavpaul_demo.ace_demo.product_category_metrics p 
  ON t.region_id = p.region_id
WHERE t.event_type = 'IN_TRANSIT'
ORDER BY t.estimated_arrival_ts
LIMIT 50;
```

---

**Endpoint 4: Risk Scores** (`/api/risk-stores`)
```typescript
interface RiskStore {
  storeId: string;
  location: string;
  riskScore: number;
  primaryDelay: string;
  revenueAtRisk: number;
  riskTier: string;
}
```

**SQL Query**:
```sql
SELECT 
  store_id as storeId,
  CONCAT(store_city, ', ', store_state) as location,
  ROUND(store_avg_delay * 1.5 + region_vendor_avg_delay * 0.5, 0) as riskScore,
  delay_reason as primaryDelay,
  revenue_at_risk as revenueAtRisk,
  store_risk_tier as riskTier
FROM kaustavpaul_demo.ace_demo.logistics_fact
WHERE store_risk_tier IN ('HIGH', 'MEDIUM')
GROUP BY store_id, store_city, store_state, store_avg_delay, 
         region_vendor_avg_delay, delay_reason, revenue_at_risk, store_risk_tier
ORDER BY riskScore DESC
LIMIT 20;
```

---

**Endpoint 5: Delay Causes** (`/api/delay-causes`)
```typescript
interface DelayCause {
  cause: string;
  count: number;
  percentage: number;
}
```

**SQL Query**:
```sql
WITH delay_counts AS (
  SELECT 
    delay_reason as cause,
    COUNT(*) as count
  FROM kaustavpaul_demo.ace_demo.logistics_fact
  WHERE delay_minutes > 0
    AND delivery_timestamp >= CURRENT_TIMESTAMP() - INTERVAL 7 DAYS
  GROUP BY delay_reason
)
SELECT 
  cause,
  count,
  ROUND(count * 100.0 / SUM(count) OVER (), 0) as percentage
FROM delay_counts
ORDER BY count DESC;
```

---

## Gap Analysis Summary

### 🟢 **Fully Supported Features** (No Changes)
1. ✅ Executive KPI Dashboard
2. ✅ Live fleet map (with GPS coordinates)
3. ✅ Regional status grid
4. ✅ Throughput trends (time-series)
5. ✅ Delay root cause analysis
6. ✅ ETA vs Actual comparison
7. ✅ Risk scoring (store-level)
8. ✅ Revenue at risk calculations
9. ✅ Carrier performance benchmarking
10. ✅ ACE vs NON-ACE vendor comparison

### 🟡 **Partially Supported** (Modifications Needed)
1. ⚠️ Fleet table cargo → Replace with **product category**
2. ⚠️ Risk table actions → Replace with **risk tier** or **revenue at risk**
3. ⚠️ Risk table stockout → Replace with **hours to next delivery**
4. ⚠️ Data quality metrics → Add **DQ tracking table** (30 min effort)
5. ⚠️ Pipeline status → Use **table refresh timestamps** instead of live status
6. ⚠️ Alerts → Treat as **filtered query results**, not real alerting

### ❌ **Not Supported** (Exclude or Defer)
1. ❌ Driver names (not tracked, privacy concerns)
2. ❌ Notification channels (infrastructure beyond scope)
3. ❌ Real-time alerting system (requires event-driven architecture)
4. ❌ Settings page (out of scope for analytics demo)
5. ❌ "Mark as Read" functionality (requires state/database)

---

## Recommended Build Plan

### **Phase 1: Core Analytics (MVP)** - 6-8 hours
Build these pages with full data integration:

1. ✅ **Home Page** (Executive Dashboard)
   - All KPI cards from `supply_chain_kpi` table
   - Live map with ACE store locations
   - Regional status from aggregated data
   - Throughput chart from `logistics_fact`

2. ✅ **Fleet Page** (Modified)
   - Remove driver column
   - Replace cargo with product category
   - ETA accuracy chart
   - Delay causes breakdown

3. ✅ **Risk Dashboard** (Modified)
   - Replace "Est. Stockout" → "Revenue at Risk"
   - Replace "Suggested Action" → "Risk Tier"
   - Keep risk heatmap
   - Keep risk scores

### **Phase 2: Data Quality** (Optional) - 2-3 hours

4. 🟡 **Pipelines Page** (Simplified)
   - Show 5 actual pipelines
   - Use table refresh times for "last run"
   - Hardcode "Running" status for demo
   - Add DQ tracking table for quality metrics

### **Phase 3: Alerts** (Simplified) - 1-2 hours

5. 🟡 **Alerts Page** (Data-Driven Only)
   - Generate alerts from delay queries
   - Remove notification channels section
   - Remove "Mark as Read" button
   - Keep alert thresholds as display-only

### **Phase 4: Enhancements** (Future) - 4-6 hours

6. Real map integration (Leaflet.js)
7. Auto-refresh (polling every 30s)
8. Export to PDF/Excel
9. Date range filters
10. Real-time websocket updates

---

## Implementation Complexity

| Component | UI Complexity | Data Integration | Total Effort |
|-----------|---------------|------------------|--------------|
| Home Page | 🟢 Low | 🟢 Low | **2 hours** |
| Risk Dashboard | 🟡 Medium | 🟡 Medium | **2 hours** |
| Fleet Page | 🟢 Low | 🟢 Low | **1.5 hours** |
| Pipelines Page | 🟡 Medium | 🟠 High | **2.5 hours** |
| Alerts Page | 🟢 Low | 🟡 Medium | **1.5 hours** |
| Data API Layer | - | 🟡 Medium | **2 hours** |
| Map Integration | 🟡 Medium | 🟢 Low | **1.5 hours** |

**Total MVP Effort**: 10-13 hours  
**With Optional Features**: 15-20 hours

---

## Data Backend Options

### **Option A: Databricks SQL Warehouse REST API** ⭐ Recommended
```typescript
// Direct SQL queries via REST API
const response = await fetch(
  `https://e2-demo-field-eng.cloud.databricks.com/api/2.0/sql/statements/`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      warehouse_id: 'your-warehouse-id',
      statement: 'SELECT * FROM kaustavpaul_demo.ace_demo.supply_chain_kpi',
      wait_timeout: '30s'
    })
  }
);
```

**Pros**:
- ✅ No backend needed
- ✅ Direct SQL access
- ✅ Fast and simple
- ✅ Works with Databricks Apps

**Cons**:
- ⚠️ Exposes token in frontend (need proxy)
- ⚠️ CORS issues (need backend proxy)

---

### **Option B: Python Flask/FastAPI Backend** 
```python
# backend/app.py
from databricks import sql
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/kpis')
def get_kpis():
    with sql.connect(...) as connection:
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM supply_chain_kpi")
        return jsonify(cursor.fetchall())
```

**Pros**:
- ✅ Secure (token on backend)
- ✅ Can add caching
- ✅ Business logic layer
- ✅ CORS handled

**Cons**:
- ⚠️ Extra infrastructure
- ⚠️ Deployment complexity

---

### **Option C: Databricks Apps Framework** ⭐⭐ Recommended for Production
```python
# Databricks Apps native approach
# app.yaml
name: ace-logistics-dashboard
workspace: /Workspace/Users/kaustav.paul@databricks.com/ace-demo/app
```

**Pros**:
- ✅ Native Databricks integration
- ✅ Built-in auth
- ✅ Can bundle React frontend
- ✅ Serverless deployment

**Cons**:
- ⚠️ Newer framework (less examples)
- ⚠️ Learning curve

---

## Final Recommendations

### ✅ **BUILD THESE COMPONENTS** (85% of UI)

| Page | Build? | Modifications | Data Available |
|------|--------|---------------|----------------|
| **Home Page** | ✅ YES | None | 100% |
| **Fleet Page** | ✅ YES | Remove driver, change cargo | 95% |
| **Risk Dashboard** | ✅ YES | Replace 2 columns | 90% |
| **Pipelines Page** | 🟡 SIMPLIFIED | Add DQ tracking OR mock | 60% |
| **Alerts Page** | 🟡 SIMPLIFIED | Data-driven only | 50% |
| **Settings Page** | ❌ NO | Out of scope | 0% |

### ⚠️ **REQUIRED MODIFICATIONS**

#### High Priority (Do These):
1. **Fleet Table**: Remove "Driver" column
2. **Fleet Table**: Replace "Cargo" → "Product Category" (from `product_category_metrics`)
3. **Risk Table**: Replace "Est. Stockout" → "Revenue at Risk"
4. **Risk Table**: Replace "Suggested Action" → "Risk Tier" badge

#### Medium Priority (Nice to Have):
5. **Pipelines Page**: Add data quality tracking table
6. **Alerts Page**: Remove notification channels section
7. **Map Component**: Upgrade from SVG to real map library

#### Low Priority (Optional):
8. Remove Settings page entirely
9. Add real-time polling
10. Add export functionality

---

## Quick Start Implementation

### Minimum Viable Dashboard (5-6 hours):

**Include**:
- ✅ Home Page (full functionality)
- ✅ Fleet Page (remove driver, use product category)
- ✅ Risk Dashboard (use revenue at risk)
- ✅ Simple data API (Flask + SQL Connector)

**Exclude**:
- ❌ Pipelines Page (defer to Phase 2)
- ❌ Alerts Page (defer to Phase 2)
- ❌ Settings Page
- ❌ Real-time updates (use static refresh)
- ❌ Notification infrastructure

**Data Backend**:
```python
# backend/api.py (Flask)
from flask import Flask, jsonify
from databricks import sql
import os

app = Flask(__name__)

def get_connection():
    return sql.connect(
        server_hostname=os.getenv('DATABRICKS_HOST'),
        http_path=os.getenv('DATABRICKS_HTTP_PATH'),
        access_token=os.getenv('DATABRICKS_TOKEN')
    )

@app.route('/api/kpis')
def kpis():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
              COUNT(DISTINCT CASE WHEN event_type='IN_TRANSIT' THEN truck_id END) as throughput,
              SUM(CASE WHEN delay_minutes > 30 THEN 1 ELSE 0 END) as late_arrivals,
              ROUND(AVG(delay_minutes), 1) as avg_delay
            FROM kaustavpaul_demo.ace_demo.logistics_fact
            WHERE delivery_timestamp >= CURRENT_TIMESTAMP() - INTERVAL 24 HOURS
        """)
        result = cursor.fetchone()
        return jsonify({
            'networkThroughput': result[0],
            'lateArrivals24h': result[1],
            'avgDelay': result[2],
            'dataQualityScore': 96.8  # Mock for now
        })

# Add similar endpoints for /fleet, /regions, /risk, etc.
```

---

## Cost/Benefit Analysis

### What You Get:
- ✅ **85% of Figma UI** functional with real ACE data
- ✅ **Executive dashboard** with live KPIs
- ✅ **Real-time fleet tracking** with actual GPS coordinates
- ✅ **Risk intelligence** with revenue impact
- ✅ **Delay attribution** with root cause analysis
- ✅ **Regional performance** benchmarking

### What You Don't Get:
- ❌ Driver tracking (not in data)
- ❌ Detailed cargo manifests (privacy + not tracked)
- ❌ Real alerting/notifications (infrastructure)
- ❌ Live pipeline status (DLT API integration needed)
- ❌ Settings/user management (out of scope)

### Trade-offs:
| Keep This | Remove This | Business Impact |
|-----------|-------------|-----------------|
| Risk scores, revenue impact | Estimated stockout times | 🟢 Low - Revenue is better metric |
| Product categories | Driver names | 🟢 None - Privacy win |
| Data-driven "alerts" | Real alerting system | 🟡 Medium - Still shows insights |
| Table refresh times | Live pipeline status | 🟢 Low - Demo-friendly |

---

## Recommendation

### 🎯 **BUILD IT** with these modifications:

**Scope**: Build 3 core pages (Home, Fleet, Risk) = **MVP in 5-6 hours**

**Changes Required**:
1. Remove driver column from Fleet
2. Replace cargo → product category
3. Replace stockout time → revenue at risk
4. Replace suggested action → risk tier badge
5. Exclude Settings page
6. Simplify Alerts page (Phase 2)
7. Defer Pipelines page (Phase 2)

**Data Backend**: 
- Start with **Flask + Databricks SQL Connector** (simple)
- Can upgrade to **Databricks Apps** later (production-ready)

**Map Component**:
- Phase 1: Keep simplified SVG (works for demo)
- Phase 2: Upgrade to Leaflet.js with real coordinates

**Estimated Timeline**:
- **MVP**: 5-6 hours (3 core pages + data API)
- **Full App**: 10-13 hours (add Pipelines + Alerts)
- **Production Polish**: 15-20 hours (real map, polling, export)

---

## Next Steps

**Would you like me to**:

1. **Create implementation plan** - Detailed task breakdown for MVP
2. **Generate API endpoint specs** - Complete REST API documentation
3. **Modify UI components** - Update Figma code with ACE data fields
4. **Build data backend** - Create Flask API with SQL queries
5. **Review first** - You review this doc and prioritize

**Or do you want to**:

A) **Build MVP now** (Home + Fleet + Risk pages) - 5-6 hours  
B) **Build full app** (All pages except Settings) - 10-13 hours  
C) **Start with backend API first** - Create data layer, then UI  
D) **Modify UI components first** - Update to match ACE data  

What's your preference?
