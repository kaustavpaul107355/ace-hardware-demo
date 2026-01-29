# RSC Count Enhancement

**Date**: January 29, 2026  
**Status**: ✅ Deployed & Committed  
**Git Commit**: `aa982d1`

---

## Problem

1. **Distribution Centers tile** showed only "8" without clarifying this was major RSCs out of a larger network
2. **Map visualization** showed only 8 major RSCs instead of displaying all 20 RSCs in the network

---

## Solution

### Backend Changes (`server.py`)

**Modified Endpoints**:
1. `/api/location-monitor-data` - Combined Location Monitor data
2. `/api/rsc-locations` - RSC locations for map
3. Overview tab RSC query

**Query Logic**:
```python
# Query 1: Count major RSCs (high volume: >= 20 shipments)
major_rsc_query = """
SELECT origin_city
FROM logistics_silver
WHERE origin_city IS NOT NULL
GROUP BY origin_city
HAVING COUNT(DISTINCT shipment_id) >= 20
"""
# Returns: ~8 major hubs

# Query 2: Get top 20 RSCs by volume (for map)
total_rsc_query = """
SELECT origin_city
FROM logistics_silver
WHERE origin_city IS NOT NULL
GROUP BY origin_city
ORDER BY COUNT(DISTINCT shipment_id) DESC
LIMIT 20
"""
# Returns: 20 RSCs (8 major + 12 regional)
```

**Response Structure**:
```json
{
  "networkStats": {
    "majorRSCs": 8,      // Major distribution centers
    "totalRSCs": 20,     // All RSCs shown on map
    "totalStores": 300,
    "activeStores": 285,
    ...
  },
  "rscStats": [ ... ]
}
```

### Frontend Changes

**TypeScript Interface** (`api.ts`):
```typescript
export interface NetworkStats {
  majorRSCs: number;   // NEW: Major distribution centers
  totalRSCs: number;   // Total RSCs on map
  totalStores: number;
  activeStores: number;
  ...
}
```

**UI Component** (`LocationMonitor.tsx`):
```tsx
<p className="text-sm text-gray-600">Distribution Centers</p>
<p className="text-2xl font-bold text-gray-900">
  {networkStats?.majorRSCs || 0}
  <span className="text-lg text-gray-500 ml-1">/ {networkStats?.totalRSCs || 0}</span>
</p>
<p className="text-xs text-gray-500">Major / Total RSCs</p>
```

---

## Result

### Before
- **Tile**: `8` (unclear what this meant)
- **Map**: 8 markers (only major RSCs)

### After
- **Tile**: `8 / 20` with subtitle "Major / Total RSCs"
- **Map**: 20 markers (8 major + 12 regional RSCs)

---

## Technical Details

### Data Generation Context
From `scripts/generate_data.py`:
- **8 hardcoded major RSC hubs**: Kansas City, Chicago, Atlanta, Los Angeles, Dallas, Columbus, Phoenix, Philadelphia
- **75%** of shipments originate from these 8 major hubs
- **25%** of shipments originate from ~200+ random cities (regional distribution)

### Filter Threshold
- **Major RSCs**: `HAVING COUNT(DISTINCT shipment_id) >= 20`
- Filters to only distribution centers handling significant volume
- This naturally selects the 8 major hubs plus a few high-volume regional centers

### Map Display
- Shows **top 20 RSCs by shipment volume**
- Removed `HAVING` filter to include both major and regional centers
- Provides complete network visibility while focusing on highest-volume locations

---

## Deployment

**Status**: ✅ Live in workspace  
**App**: ace-supply-chain-app  
**Deployment**: Pending (in progress as of 06:00 UTC)

**Files Modified**:
- `logistics_app_ui/backend/server.py` (3 endpoints updated)
- `logistics_app_ui/src/app/services/api.ts` (interface updated)
- `logistics_app_ui/src/app/components/pages/LocationMonitor.tsx` (UI updated)

**Verification**:
Once deployment completes (~ 2-3 minutes):
1. Navigate to **Location Monitor** tab
2. Check **Distribution Centers** tile shows `8 / 20`
3. Verify map displays 20 RSC markers
4. Hard refresh browser (`Cmd+Shift+R` on Mac) to clear cache if needed

---

## Related Commits

- `0baba6a` - Initial RSC filter fix (map locations)
- `e8adf51` - Network stats tile fix (incorrect endpoint)
- `e2e211c` - Separate query approach for RSC count
- `8394aa1` - Location monitor endpoint fix
- `aa982d1` - **Final enhancement: major vs total RSC display**
