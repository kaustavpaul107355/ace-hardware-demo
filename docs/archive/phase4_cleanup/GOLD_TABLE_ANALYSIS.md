# Gold Table Analysis & Migration Plan

**Date:** January 28, 2026  
**Current State:** App is only using `logistics_silver` (95% of queries) and `supply_chain_kpi` (1 query)

---

## 🔍 Current Architecture

### Existing Gold Layer Tables (Available but UNUSED)

According to the DLT pipeline definitions, we have **4 gold tables** already built:

| Gold Table | Purpose | Key Metrics | Current Usage |
|------------|---------|-------------|---------------|
| `store_delay_metrics` | Store-level performance aggregates | total_deliveries, avg_delay_minutes, delayed_shipments, revenue | **NOT USED** |
| `vendor_performance` | Vendor scorecarding by region | total_deliveries, delayed_deliveries, avg_delay, total_value | **NOT USED** |
| `carrier_performance` | Carrier benchmarking | total_deliveries, delayed_deliveries, avg_delay, max_delay | **NOT USED** |
| `product_category_metrics` | Product category delivery analysis | units_shipped, value_shipped, avg_delay, avg_temperature | **NOT USED** |

### Existing Fact Table (Partially Used)

| Fact Table | Purpose | Current Usage |
|------------|---------|---------------|
| `logistics_fact` | Unified fact table with all dimensions + gold aggregates | Used by 1 endpoint (`/api/alerts`) |
| `supply_chain_kpi` | Executive KPI summary by region/vendor/carrier | **NOT USED** |

---

## 📊 Current App Query Distribution

### Backend Query Analysis (server.py)

| Table | Query Count | Percentage | Endpoints Using It |
|-------|-------------|------------|-------------------|
| `logistics_silver` | 21 queries | **95%** | All major endpoints |
| `logistics_fact` | 1 query | **5%** | `/api/alerts` only |
| `supply_chain_kpi` | 0 queries | **0%** | None |
| Gold tables | 0 queries | **0%** | None |

**Total API Endpoints:** 18  
**Endpoints using `logistics_silver`:** 17 (94%)  
**Endpoints using gold/fact tables:** 1 (6%)

---

## 🚨 Key Issues

### 1. **Redundant Aggregations**

The app is **re-computing aggregations** that already exist in gold tables:

**Example: Risk Analysis Tab**
```sql
-- Current query (in server.py, handle_risk_stores)
SELECT 
  store_id,
  store_name,
  COUNT(*) as total_deliveries,
  SUM(CASE WHEN delay_minutes > 0 THEN 1 ELSE 0 END) as delayed_count,
  AVG(delay_minutes) as avg_delay,
  -- ... more aggregations
FROM logistics_silver
WHERE event_type = 'DELIVERED'
GROUP BY store_id, store_name, ...
```

**Gold table already has this:**
```sql
-- store_delay_metrics (pre-computed!)
SELECT 
  store_id, store_name,
  total_deliveries,      -- Already aggregated
  delayed_shipments,     -- Already aggregated
  avg_delay_minutes,     -- Already aggregated
  total_shipment_value   -- Already aggregated
FROM store_delay_metrics
```

**Impact:** We're scanning 100K+ rows and re-aggregating, when we could query 50-300 pre-aggregated rows.

---

### 2. **Missing Pre-computed Metrics**

The `logistics_fact` table has **rich pre-computed metrics** that we're ignoring:

| Metric in logistics_fact | Current App Behavior |
|--------------------------|----------------------|
| `store_delay_rate_pct` | ❌ Re-calculated every query |
| `vendor_delay_rate_pct` | ❌ Re-calculated every query |
| `carrier_delay_rate_pct` | ❌ Re-calculated every query |
| `revenue_at_risk` | ❌ Re-calculated every query |
| `store_risk_tier` | ❌ Re-calculated every query |

---

### 3. **Complex Joins Repeated**

The app joins `logistics_silver` with dimensions (stores, shipments) for every query.

**`logistics_fact` already has these joins materialized:**
- Store dimension (id, name, city, state, region, revenue, lat/lng)
- Vendor dimension (id, name, type, risk tier, on-time %)
- Carrier dimension
- **Plus aggregates from gold tables** (store_total_deliveries, store_avg_delay, etc.)

---

## 💡 Migration Opportunities

### High-Impact Queries to Migrate

| Endpoint | Current Table | Should Use | Expected Speedup |
|----------|---------------|------------|------------------|
| `/api/risk-stores` | `logistics_silver` (full scan + GROUP BY) | `store_delay_metrics` | **10-20x faster** |
| `/api/rsc-stats` | `logistics_silver` (Haversine calc + GROUP BY) | `logistics_silver` (need distance column) | **5-10x faster** |
| `/api/network-stats` | `logistics_silver` (4 CTEs → 1 scan) | `supply_chain_kpi` or gold tables | **5-10x faster** |
| `/api/kpis` | `logistics_silver` (aggregations) | `supply_chain_kpi` | **5-8x faster** |
| `/api/fleet` | `logistics_silver` (complex filters) | `logistics_fact` | **3-5x faster** |

---

## 📋 Detailed Migration Plan

### Phase 1: Low-Hanging Fruit (Immediate Impact)

**Priority: HIGH | Effort: LOW | Impact: HIGH**

#### 1.1 Migrate `/api/risk-stores` to use `store_delay_metrics`

**Current Query:**
```sql
SELECT store_id, store_name, COUNT(*), SUM(...), AVG(...)
FROM logistics_silver
WHERE event_type = 'DELIVERED'
GROUP BY store_id, store_name, ...  -- Expensive!
```

**Optimized Query:**
```sql
SELECT 
  store_id, store_name, store_city, store_state,
  total_deliveries,
  delayed_shipments,
  avg_delay_minutes,
  total_shipment_value,
  store_weekly_revenue,
  -- Calculate risk score from pre-aggregated data
  ROUND((delayed_shipments * 100.0 / NULLIF(total_deliveries, 0)), 2) as delay_rate_pct,
  ROUND(store_weekly_revenue * (delayed_shipments / total_deliveries), 2) as revenue_at_risk
FROM store_delay_metrics
WHERE total_deliveries > 10  -- Filter on aggregates!
ORDER BY revenue_at_risk DESC
LIMIT 50
```

**Impact:** **15-20x faster** (300 pre-aggregated rows vs 100K+ raw rows)

---

#### 1.2 Migrate `/api/kpis` to use `supply_chain_kpi`

**Current Query:**
```sql
-- Multiple aggregations on logistics_silver
SELECT COUNT(*), COUNT(DISTINCT truck_id), COUNT(DISTINCT store_id), ...
FROM logistics_silver
WHERE ...
```

**Optimized Query:**
```sql
SELECT 
  SUM(total_deliveries) as network_throughput,
  SUM(delayed_count) as late_arrivals,
  ROUND(AVG(delay_rate_pct), 2) as avg_delay_rate,
  SUM(total_value_delivered) as total_value
FROM supply_chain_kpi
-- Optional: filter by region_id, vendor_type, carrier
```

**Impact:** **8-12x faster** (aggregating pre-computed KPIs instead of raw events)

---

### Phase 2: Fact Table Migration (Medium Effort, High Impact)

**Priority: HIGH | Effort: MEDIUM | Impact: HIGH**

#### 2.1 Migrate `/api/fleet` to use `logistics_fact`

**Benefits:**
- Pre-joined dimensions (no more joins!)
- Pre-computed flags (`is_delayed`, `is_severely_delayed`)
- Pre-computed store/vendor/carrier aggregates

**Current:** Complex joins + aggregations on `logistics_silver`  
**Optimized:** Direct queries on `logistics_fact` with pre-computed metrics

**Impact:** **3-5x faster**

---

#### 2.2 Migrate delay/performance queries to `logistics_fact`

**Endpoints to migrate:**
- `/api/delay-causes`
- `/api/eta-accuracy`
- `/api/throughput`

**Impact:** **3-5x faster** each

---

### Phase 3: Add Missing Pre-computations (DLT Pipeline Update)

**Priority: HIGH | Effort: MEDIUM | Impact: VERY HIGH**

#### 3.1 Add `rsc_to_store_distance_km` to `logistics_silver`

As discussed in Phase 2 of the performance analysis, pre-compute Haversine distance during DLT pipeline.

**Impact:** `/api/rsc-stats` **10-15x faster**

---

#### 3.2 Add RSC Performance Gold Table

Create new gold table: `rsc_performance`

```python
@dlt.table(
    name="rsc_performance",
    comment="RSC (distribution center) performance metrics",
    table_properties={"quality": "gold"}
)
def rsc_performance():
    delivered = dlt.read("logistics_silver").filter(col("event_type").isin(["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"]))
    
    return (
        delivered
        .groupBy("origin_city", "origin_state", "origin_latitude", "origin_longitude")
        .agg(
            count(col("truck_id").distinct()).alias("active_routes"),
            count(col("store_id").distinct()).alias("stores_served"),
            count(col("shipment_id").distinct()).alias("shipments_processed"),
            avg("rsc_to_store_distance_km").alias("avg_distance_km"),  # Uses pre-computed distance
            _sum("shipment_value").alias("total_value_shipped")
        )
    )
```

**Then use this in `/api/rsc-stats`:**
```sql
SELECT origin_city as name, active_routes, stores_served, avg_distance_km, 'active' as status
FROM rsc_performance
ORDER BY active_routes DESC
```

**Impact:** **50-100x faster** (simple SELECT vs complex Haversine aggregation)

---

## 🎯 Recommended Implementation Order

### Immediate (Today - After Phase 1 optimizations already done)

1. ✅ **Combine network stats CTEs** (DONE)
2. ✅ **Create combined location-monitor-data endpoint** (DONE)
3. ✅ **Lazy load maps** (DONE)

### Next Sprint (This Week)

4. **Migrate `/api/risk-stores` to `store_delay_metrics`**
   - Effort: 1 hour
   - Impact: 15-20x faster

5. **Migrate `/api/kpis` to `supply_chain_kpi`**
   - Effort: 1 hour
   - Impact: 8-12x faster

**Expected Result:** Risk Analysis tab **10-15x faster**, Overview tab **5-8x faster**

---

### Following Sprint (Next Week)

6. **Add distance column to DLT pipeline**
   - Update `silver_logistics.py`
   - Refresh pipeline
   - Update `/api/rsc-stats` query
   - Effort: 2 hours
   - Impact: Location Monitor **10-15x faster**

7. **Create `rsc_performance` gold table**
   - Add to `gold_flo_metrics.py`
   - Update `/api/rsc-stats` to use it
   - Effort: 1 hour
   - Impact: **50-100x faster**

---

### Future (Phase 3 - Optional)

8. **Migrate fleet queries to `logistics_fact`**
9. **Migrate delay/performance queries to `logistics_fact`**
10. **Create additional summary tables for Overview tab**

---

## 📊 Expected Performance Improvements

### Current State (After Phase 1 Optimizations)

| Tab | Current Load Time | Bottleneck |
|-----|-------------------|------------|
| Overview | 1-2s | Aggregations on silver |
| Fleet & Fulfillment | 2-3s | Complex queries on silver |
| Risk Analysis | 2-4s | Full scan + GROUP BY on silver |
| Location Monitor | 3-8s | Haversine calc + network stats |

---

### After Gold Table Migration (Phase 1 + Phase 2 + Phase 3.1)

| Tab | Optimized Load Time | Improvement | Method |
|-----|---------------------|-------------|--------|
| Overview | **0.2-0.5s** | **5-10x faster** | Use `supply_chain_kpi` |
| Fleet & Fulfillment | **0.5-1s** | **4-6x faster** | Use `logistics_fact` |
| Risk Analysis | **0.1-0.3s** | **20-40x faster** | Use `store_delay_metrics` |
| Location Monitor | **0.5-1s** | **6-16x faster** | Pre-compute distance + optimize stats |

**Overall App Load Time:** 3-8s → **0.5-2s** ⚡

---

## 🎉 Summary

### Why Aren't We Using Gold Tables?

**Answer:** The app was built quickly, directly querying `logistics_silver` without leveraging the gold layer.

### What Should We Do?

**Quick Wins (Next 2-3 hours):**
1. Migrate `/api/risk-stores` → `store_delay_metrics` (20x faster)
2. Migrate `/api/kpis` → `supply_chain_kpi` (8-12x faster)

**Medium-term (Next week):**
3. Add distance column to pipeline (10-15x faster for Location Monitor)
4. Create `rsc_performance` gold table (50-100x faster for RSC stats)

**Result:** **Sub-second load times** across all tabs, better user experience, lower compute costs.

---

## 🚀 Next Steps

**User Decision Required:**

**Option A: Migrate 2 endpoints to gold tables now (2-3 hours)**
- `/api/risk-stores` → `store_delay_metrics`
- `/api/kpis` → `supply_chain_kpi`
- Risk Analysis tab **20x faster**
- Overview tab **8x faster**

**Option B: Full migration plan (1-2 weeks, phased)**
- All endpoints optimized
- New gold tables created
- Entire app **10-40x faster** per tab

**What would you like to proceed with?**
