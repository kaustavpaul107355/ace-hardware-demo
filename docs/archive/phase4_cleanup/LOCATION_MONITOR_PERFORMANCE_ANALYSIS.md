# Location Monitor Performance Analysis & Optimization Plan

**Date:** January 28, 2026  
**Issue:** Location Monitor tab is extremely slow despite caching and animation improvements

---

## 🔍 Current State Analysis

### API Calls Made by Location Monitor Tab

| API Endpoint | Component | Query Complexity | Table Access | Estimated Rows |
|--------------|-----------|------------------|--------------|----------------|
| `/api/rsc-stats` | LocationMonitor | HIGH - Haversine distance calculation, aggregations | `logistics_silver` | Full table scan |
| `/api/network-stats` | LocationMonitor | HIGH - Multiple CTEs with aggregations | `logistics_silver` | 4 CTEs, full table scan |
| `/api/rsc-locations` | LiveMap | MEDIUM - GROUP BY with COUNT | `logistics_silver` | GROUP BY scan |
| `/api/store-locations` | StoreMap | MEDIUM - GROUP BY, LIMIT 300 | `logistics_silver` | GROUP BY scan, 300 rows |

**Total: 4 separate API calls on tab load, all hitting the same `logistics_silver` table**

---

## 📊 Query Analysis

### 1. `/api/rsc-stats` (Slowest Query)

```sql
SELECT 
  origin_city as name,
  COUNT(DISTINCT truck_id) as activeRoutes,
  COUNT(DISTINCT store_id) as storesServed,
  ROUND(AVG(
    111.045 * DEGREES(ACOS(
      LEAST(1.0, GREATEST(-1.0,
        COS(RADIANS(origin_latitude))
        * COS(RADIANS(store_latitude))
        * COS(RADIANS(origin_longitude) - RADIANS(store_longitude))
        + SIN(RADIANS(origin_latitude))
        * SIN(RADIANS(store_latitude))
      ))
    ))
  ), 1) as avgDistance,
  'active' as status
FROM logistics_silver
WHERE origin_city IS NOT NULL
  AND truck_id IS NOT NULL
  AND event_type IN ('IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED')
GROUP BY origin_city
```

**Issues:**
- ❌ **Haversine distance calculation on EVERY row** before aggregation
- ❌ Complex trigonometric functions (COS, SIN, RADIANS, ACOS, DEGREES)
- ❌ Full table scan with WHERE filters
- ❌ GROUP BY after complex calculations

**Estimated Time:** 5-15 seconds (depending on data size)

---

### 2. `/api/network-stats` (Second Slowest)

```sql
WITH store_stats AS (
  SELECT COUNT(DISTINCT store_id), ... FROM logistics_silver WHERE store_id IS NOT NULL
),
risk_stats AS (
  SELECT COUNT(DISTINCT store_id) FROM logistics_silver WHERE delay_minutes > 120
),
rsc_stats AS (
  SELECT COUNT(DISTINCT origin_city) FROM logistics_silver WHERE origin_city IS NOT NULL
),
delivery_stats AS (
  SELECT AVG(...) FROM logistics_silver WHERE ...
)
SELECT ... FROM store_stats CROSS JOIN risk_stats CROSS JOIN rsc_stats CROSS JOIN delivery_stats
```

**Issues:**
- ❌ **4 separate CTEs, each scanning `logistics_silver` independently**
- ❌ Multiple DISTINCT counts across different columns
- ❌ No indexes or partitioning leveraged
- ❌ CROSS JOINs (though only 1x1x1x1 = 1 row)

**Estimated Time:** 3-8 seconds

---

### 3. `/api/rsc-locations`

```sql
SELECT DISTINCT origin_city, origin_state, origin_latitude, origin_longitude, 
       COUNT(DISTINCT shipment_id) as shipment_count
FROM logistics_silver
WHERE origin_city IS NOT NULL AND origin_latitude IS NOT NULL
GROUP BY origin_city, origin_state, origin_latitude, origin_longitude
ORDER BY shipment_count DESC
LIMIT 20
```

**Issues:**
- ❌ GROUP BY on all location columns
- ❌ Full table scan for DISTINCT + COUNT

**Estimated Time:** 2-5 seconds

---

### 4. `/api/store-locations`

```sql
SELECT store_id, store_city, store_state, store_latitude, store_longitude, ...
FROM logistics_silver
WHERE store_city IS NOT NULL AND store_latitude IS NOT NULL
GROUP BY store_id, store_city, store_state, store_latitude, ...
ORDER BY store_weekly_revenue DESC
LIMIT 300
```

**Issues:**
- ❌ GROUP BY on 7 columns
- ❌ ORDER BY + LIMIT (requires sorting full result set before limiting)

**Estimated Time:** 2-4 seconds

---

## 🐌 Total Load Time Breakdown

| Phase | Time | Details |
|-------|------|---------|
| **Network Stats Query** | 3-8s | 4 CTEs scanning full table |
| **RSC Stats Query** | 5-15s | Haversine calculation on all rows |
| **RSC Locations Query** | 2-5s | GROUP BY with COUNT |
| **Store Locations Query** | 2-4s | GROUP BY 7 columns, LIMIT 300 |
| **500ms Skeleton Delay** | 0.5s | Intentional UI delay |
| **Total (Sequential)** | **13-33 seconds** | Worst case if not cached |
| **Total (Parallel)** | **5-15 seconds** | Limited by slowest query (rsc-stats) |

---

## 🔥 Critical Bottleneck: Haversine Distance Calculation

The **RSC stats query** is the primary bottleneck due to:

1. **Row-level calculation**: Haversine distance computed for EVERY row before aggregation
2. **Complex math**: 8 trigonometric function calls per row (COS x3, SIN x2, RADIANS x4, ACOS, DEGREES)
3. **No pre-computation**: Distance is calculated on-demand, not materialized

**Example:**
- If `logistics_silver` has 100,000 rows
- Query computes Haversine distance 100,000 times
- Then aggregates to ~10 RSC locations
- **99.99% of computation is thrown away after aggregation**

---

## 🎯 Optimization Strategies

### Strategy 1: Pre-compute Distance in DLT Pipeline (RECOMMENDED)

**Approach:**
- Add `rsc_to_store_distance_km` column to `logistics_silver` during DLT transformation
- Compute Haversine once during pipeline, materialize result
- Query becomes simple AVG() aggregation

**Benefits:**
- ✅ **10-20x faster query** (from 5-15s to 0.3-1s)
- ✅ One-time computation cost
- ✅ Works with existing caching
- ✅ No schema changes to downstream apps

**Implementation:**
```python
# In silver_logistics.py DLT pipeline
@dlt.table(name="logistics_silver", ...)
def logistics_silver():
    return (
        dlt.read("shipments_bronze")
        .join(dlt.read("stores_bronze"), ...)
        .withColumn("rsc_to_store_distance_km", 
            F.round(
                F.lit(111.045) * F.degrees(
                    F.acos(
                        F.least(F.lit(1.0), F.greatest(F.lit(-1.0),
                            F.cos(F.radians(F.col("origin_latitude")))
                            * F.cos(F.radians(F.col("store_latitude")))
                            * F.cos(F.radians(F.col("origin_longitude")) - F.radians(F.col("store_longitude")))
                            + F.sin(F.radians(F.col("origin_latitude")))
                            * F.sin(F.radians(F.col("store_latitude")))
                        ))
                    )
                ), 1
            )
        )
    )
```

**Updated Query:**
```sql
SELECT 
  origin_city as name,
  COUNT(DISTINCT truck_id) as activeRoutes,
  COUNT(DISTINCT store_id) as storesServed,
  ROUND(AVG(rsc_to_store_distance_km), 1) as avgDistance,  -- Simple AVG!
  'active' as status
FROM logistics_silver
WHERE origin_city IS NOT NULL
  AND truck_id IS NOT NULL
  AND event_type IN ('IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED')
GROUP BY origin_city
```

**Impact:** 5-15s → **0.3-1s** ✨

---

### Strategy 2: Combine Network Stats CTEs (MEDIUM EFFORT)

**Current:** 4 separate CTEs, each scanning `logistics_silver`

**Optimized:** Single table scan with conditional aggregation

```sql
SELECT 
  COUNT(DISTINCT store_id) as totalStores,
  COUNT(DISTINCT CASE WHEN store_is_active = TRUE THEN store_id END) as activeStores,
  COUNT(DISTINCT store_state) as statesCovered,
  COUNT(DISTINCT CASE WHEN delay_minutes > 120 THEN store_id END) as atRiskStores,
  COUNT(DISTINCT origin_city) as totalRSCs,
  ROUND(AVG(CASE 
    WHEN planned_departure_ts IS NOT NULL AND planned_arrival_ts IS NOT NULL
    THEN TIMESTAMPDIFF(DAY, planned_departure_ts, planned_arrival_ts)
  END), 1) as avgDeliveryDays
FROM logistics_silver
```

**Impact:** 3-8s → **1-2s** ✨

---

### Strategy 3: Create Aggregation/Summary Tables (HIGH EFFORT)

**Approach:**
- Create `network_stats_summary` materialized view (refreshed hourly/daily)
- Create `rsc_performance_summary` materialized view
- Store pre-aggregated metrics

**Benefits:**
- ✅ Near-instant query response (<100ms)
- ✅ No complex calculations at query time
- ✅ Predictable performance

**Drawbacks:**
- ❌ Data staleness (acceptable for this use case)
- ❌ Additional DLT pipelines needed
- ❌ More storage

---

### Strategy 4: Combine Location Monitor API Calls (IMMEDIATE WIN)

**Current State:**
- LocationMonitor makes 2 separate API calls: `rsc-stats` + `network-stats`
- Maps make 2 more API calls: `rsc-locations` + `store-locations` (loaded on demand)

**Optimization:**
- Create new `/api/location-monitor-data` endpoint
- Combine `rsc-stats` + `network-stats` into single backend call
- Return combined response

**Benefits:**
- ✅ Reduces HTTP overhead
- ✅ Single database connection
- ✅ Simpler frontend logic
- ✅ Better caching (one cache key instead of two)

**Implementation:**
```python
def handle_location_monitor_data(self):
    """Combined endpoint for Location Monitor tab"""
    # Execute optimized queries in parallel or as single query
    rsc_stats = execute_query(rsc_stats_query)
    network_stats = execute_query(network_stats_query)
    
    return {
        'rscStats': table_to_dicts(rsc_stats),
        'networkStats': table_to_dicts(network_stats)[0]
    }
```

---

### Strategy 5: Lazy Load Maps (IMMEDIATE WIN)

**Current:** Both LiveMap and StoreMap fetch data immediately on component mount (even if not visible)

**Optimization:**
- Only fetch map data when tab is switched
- Use `useQuery` with `enabled` flag based on `activeView`

**Implementation:**
```typescript
// In LiveMap.tsx
export default function LiveMap({ enabled = true }: { enabled?: boolean }) {
  const { data: rscLocations = [], isLoading } = useQuery({
    queryKey: ['rscLocations'],
    queryFn: api.getRSCLocations,
    staleTime: 5 * 60 * 1000,
    enabled: enabled  // Only fetch when map is visible
  });
  // ...
}

// In LocationMonitor.tsx
<LiveMap enabled={activeView === 'distribution'} />
<StoreMap enabled={activeView === 'stores'} />
```

**Impact:** Reduces initial load by 50% (only loads visible map data)

---

## 📋 Recommended Implementation Plan

### Phase 1: Immediate Wins (No Pipeline Changes)

**Priority: HIGH | Effort: LOW | Impact: MEDIUM**

1. ✅ **Combine network stats CTEs** (Strategy 2)
   - Single table scan instead of 4
   - 3-8s → 1-2s

2. ✅ **Combine Location Monitor API calls** (Strategy 4)
   - Reduce HTTP overhead
   - Better caching

3. ✅ **Lazy load maps** (Strategy 5)
   - Only fetch visible map data
   - 50% fewer queries on initial load

**Expected Result:** 13-33s → **3-8s** (60-75% improvement)

---

### Phase 2: Pipeline Optimization (Requires DLT Update)

**Priority: HIGH | Effort: MEDIUM | Impact: HIGH**

1. ✅ **Pre-compute distance in DLT pipeline** (Strategy 1)
   - Add `rsc_to_store_distance_km` column
   - Update query to use pre-computed distance

**Expected Result:** 3-8s → **0.5-2s** (75-90% improvement from baseline)

---

### Phase 3: Summary Tables (Optional, Long-term)

**Priority: MEDIUM | Effort: HIGH | Impact: HIGH**

1. ⏳ **Create materialized views** (Strategy 3)
   - `network_stats_summary`
   - `rsc_performance_summary`
   - Refresh hourly/daily

**Expected Result:** 0.5-2s → **<100ms** (99% improvement from baseline)

---

## 🎯 Recommended Next Steps

### Immediate Action (Today):

1. **Implement Phase 1 optimizations:**
   - Combine network stats CTEs
   - Create combined `/api/location-monitor-data` endpoint
   - Add lazy loading to maps

**Expected Improvement:** 60-75% faster (from 13-33s to 3-8s)

### Next Iteration (After User Approval):

2. **Implement Phase 2 optimization:**
   - Add distance column to DLT pipeline
   - Update RSC stats query
   - Refresh pipeline

**Expected Improvement:** 85-90% faster (from baseline 13-33s to 0.5-2s)

---

## 📊 Summary of All Queries & Tables

### Current State Audit

| Tab | API Calls | Queries | Source Tables | Distinct Tables |
|-----|-----------|---------|---------------|-----------------|
| **Overview** | 1 | 3 (combined) | `logistics_silver`, `supply_chain_kpi` | 2 |
| **Fleet & Fulfillment** | 4 | 4 | `logistics_silver` | 1 |
| **Risk Analysis** | 1 | 1 | `logistics_silver` | 1 |
| **Location Monitor** | 4 | 4 | `logistics_silver` | 1 |

**Total API Endpoints:** 10 unique handlers  
**Total Source Tables:** 2 (`logistics_silver`, `supply_chain_kpi`)  
**Primary Bottleneck:** `logistics_silver` full table scans with complex calculations

---

## 💡 Key Insights

1. **We're only using 2 source tables** for the entire app
2. **`logistics_silver` is accessed by 8/10 endpoints** (highly used)
3. **Location Monitor makes 4 separate queries** to the same table
4. **Haversine distance calculation is the #1 bottleneck** (5-15s per query)
5. **No materialized views or summary tables exist** (opportunity for 99% improvement)
6. **React Query caching works** but only helps on repeat visits (not initial load)

---

## 🚀 Action Required

**User, please review and approve one of the following:**

**Option A: Quick Fix (Phase 1 Only)**
- Combine queries
- Lazy load maps
- 60-75% improvement (3-8s load time)
- No pipeline changes needed
- Can deploy today

**Option B: Full Optimization (Phase 1 + Phase 2)**
- All quick fixes
- Add distance column to DLT pipeline
- 85-90% improvement (0.5-2s load time)
- Requires pipeline refresh
- Best long-term solution

**Option C: Analysis Only**
- Review this document
- Decide later

---

**Which option would you like to proceed with?**
