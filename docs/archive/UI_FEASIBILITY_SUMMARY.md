# UI vs Data: Quick Reference Matrix

## Component Feasibility at a Glance

| UI Component | Data Available | Build Status | Modification | Effort |
|--------------|---------------|--------------|--------------|--------|
| **Home: KPI Cards** | ✅ Yes | ✅ Build As-Is | None | 1h |
| **Home: Live Map** | ✅ Yes | ✅ Build As-Is | Upgrade to real map lib | 2h |
| **Home: Regional Grid** | ✅ Yes | ✅ Build As-Is | None | 30min |
| **Home: Throughput Chart** | ✅ Yes | ✅ Build As-Is | None | 30min |
| **Fleet: Truck Table** | 🟡 Partial | 🟡 Modify | Remove driver, change cargo | 1.5h |
| **Fleet: ETA Chart** | ✅ Yes | ✅ Build As-Is | None | 1h |
| **Fleet: Delay Causes** | ✅ Yes | ✅ Build As-Is | None | 30min |
| **Risk: Risk Scores** | ✅ Yes | ✅ Build As-Is | None | 1h |
| **Risk: Store Table** | 🟡 Partial | 🟡 Modify | Replace 2 columns | 1.5h |
| **Risk: Heatmap** | ✅ Yes | ✅ Build As-Is | None | 1h |
| **Pipelines: Status** | 🟡 Partial | 🟡 Simplify | Mock or add DQ tracking | 2h |
| **Pipelines: DQ Checks** | ❌ No | ⚠️ Add Feature | Need DQ tracking table | 1h |
| **Alerts: Alert List** | 🟡 Partial | 🟡 Simplify | Data-driven only | 1h |
| **Alerts: Notifications** | ❌ No | ❌ Exclude | Out of scope | - |
| **Settings** | ❌ No | ❌ Exclude | Out of scope | - |

---

## Data Field Mapping

### ✅ Available in ACE Data

| Figma UI Field | ACE Data Table | Column Name |
|----------------|----------------|-------------|
| Network Throughput | `logistics_silver` | `COUNT(DISTINCT truck_id) WHERE event_type='IN_TRANSIT'` |
| Late Arrivals | `logistics_fact` | `SUM(is_delayed) WHERE delivery_timestamp >= NOW() - 24h` |
| Avg Delay | `supply_chain_kpi` | `avg_delay_minutes` |
| Region Status | `supply_chain_kpi` | `region_id, delay_rate_pct, total_deliveries` |
| Truck ID | `logistics_silver` | `truck_id` |
| Route | `logistics_silver` | `origin_city + store_city` |
| ETA | `logistics_silver` | `estimated_arrival_ts` |
| Actual Arrival | `logistics_silver` | `actual_arrival_ts` |
| Delay Minutes | `logistics_fact` | `delay_minutes` |
| Delay Reason | `logistics_fact` | `delay_reason` |
| Store ID | `store_delay_metrics` | `store_id` |
| Store Location | `store_delay_metrics` | `store_city, store_state` |
| Risk Score | `logistics_fact` | `store_avg_delay (calculated)` |
| Risk Tier | `logistics_fact` | `store_risk_tier` |
| Revenue at Risk | `logistics_fact` | `revenue_at_risk` |
| Product Category | `product_category_metrics` | `category` |
| Carrier | `carrier_performance` | `carrier` |
| Vendor Type | `vendor_performance` | `vendor_type (ACE/NON_ACE)` |
| Vendor Risk | `vendor_performance` | `vendor_risk_tier` |
| Temperature | `logistics_fact` | `temperature_celsius` |
| Shipment Value | `logistics_silver` | `shipment_total_value` |
| GPS Coordinates | `logistics_silver` | `latitude, longitude` |

### ❌ NOT Available in ACE Data

| Figma UI Field | Why Not Available | Workaround |
|----------------|-------------------|------------|
| Driver Name | Not tracked (privacy) | ❌ Remove field |
| Cargo Description | Too detailed | 🟡 Use product category |
| Estimated Stockout | No inventory data | 🟡 Use revenue at risk |
| Suggested Action | No rules engine | 🟡 Show risk tier |
| Live Pipeline Status | DLT API not exposed | 🟡 Use table timestamps |
| DQ Pass/Fail Counts | Not tracked yet | ⚠️ Add DQ table (30 min) |
| Email/Slack Channels | Infrastructure | ❌ Exclude |

---

## Sample API Endpoints

### Required Endpoints (5 total)

```typescript
// 1. Executive KPIs
GET /api/kpis
Response: {
  networkThroughput: 342,
  lateArrivals: 23,
  lateArrivalsPercent: 8.7,
  avgDelay: 42,
  dataQualityScore: 96.8
}

// 2. Regional Status
GET /api/regions
Response: [
  { name: 'MIDWEST', trucks: 89, utilization: 85, status: 'normal' },
  { name: 'SOUTH', trucks: 67, utilization: 72, status: 'normal' },
  ...
]

// 3. Live Fleet
GET /api/fleet
Response: [
  {
    id: 'TRK-5421',
    origin: 'Chicago, IL',
    destination: 'Store #1234 Kansas City',
    eta: '2:30 PM',
    delay: 0,
    status: 'on-time',
    productCategory: 'POWER_TOOLS',
    shipmentValue: 12450.00
  },
  ...
]

// 4. Risk Stores
GET /api/risk-stores
Response: [
  {
    storeId: 'ACE-1234',
    location: 'Chicago, IL',
    riskScore: 87,
    primaryDelay: 'TRAFFIC',
    revenueAtRisk: 45230.50,
    riskTier: 'HIGH'
  },
  ...
]

// 5. Delay Causes
GET /api/delay-causes
Response: [
  { cause: 'TRAFFIC', count: 45, percentage: 38 },
  { cause: 'WEATHER', count: 32, percentage: 27 },
  ...
]
```

---

## Decision Matrix

### Should You Build This?

| Factor | Assessment | Weight | Score |
|--------|------------|--------|-------|
| **Data Availability** | 85% of UI supported | 40% | 34/40 |
| **UI Quality** | Professional, modern design | 20% | 20/20 |
| **Implementation Effort** | 10-13 hours for full app | 15% | 12/15 |
| **Demo Value** | High - showcases data pipeline | 25% | 25/25 |
| **Overall** | - | **100%** | **91/100** ✅ |

**Verdict**: ✅ **HIGHLY RECOMMENDED** to build with modifications

---

## Risk Assessment

### Technical Risks:

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Real-time map rendering slow | 🟡 Medium | 🟢 Low | Use clustering, limit pins |
| SQL queries too slow | 🟡 Medium | 🟠 High | Add caching layer |
| Missing DQ data breaks Pipelines page | 🟢 Low | 🟡 Medium | Use mock data for demo |
| CORS issues with SQL Warehouse | 🟠 High | 🟡 Medium | Use backend proxy |
| Data too large for frontend | 🟢 Low | 🟡 Medium | Add pagination |

### Business Risks:

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| UI doesn't match ACE branding | 🟡 Medium | 🟢 Low | Easy to theme |
| Demo data too synthetic | 🟢 Low | 🟡 Medium | Data already realistic |
| Performance on large datasets | 🟡 Medium | 🟠 High | Limit queries to 24h window |

**Overall Risk**: 🟢 **LOW** - Well-scoped, data-driven, feasible

---

## Final Verdict

### ✅ **BUILD IT** - 85% Feasible

**Confidence Level**: 🟢 **High (85%)**

**What Works**:
- Core analytics dashboards (Home, Fleet, Risk)
- Real-time data visualization
- Executive KPIs
- Delay attribution
- Risk scoring

**What Needs Change**:
- Remove/replace 5-6 fields across 3 pages
- Add 1 data quality tracking table (optional)
- Simplify/defer 2 pages (Pipelines, Alerts)

**What to Exclude**:
- Settings page
- Notification infrastructure
- Driver tracking

**Bottom Line**: The UI design is **excellent** and **mostly achievable**. With minor modifications (5-6 field changes), you can build a **professional, data-driven logistics dashboard** in 10-13 hours that showcases ACE Hardware's data capabilities beautifully.

**ROI**: 🟢 **HIGH** - Impressive demo with moderate effort.

---

See **`UI_FEASIBILITY_ASSESSMENT.md`** for:
- Complete data mapping for all UI components
- SQL queries for each API endpoint
- Detailed modification requirements
- Implementation phase breakdown
- Technology stack recommendations
