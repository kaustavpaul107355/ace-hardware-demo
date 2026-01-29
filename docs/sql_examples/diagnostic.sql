-- Diagnostic queries for ACE logistics tables

-- 1. Check logistics_fact structure and data
DESCRIBE kaustavpaul_demo.ace_demo.logistics_fact;

-- 2. Count and date range
SELECT 
  COUNT(*) as total_rows,
  MIN(event_ts) as earliest_event,
  MAX(event_ts) as latest_event
FROM kaustavpaul_demo.ace_demo.logistics_fact;

-- 3. Sample data
SELECT * FROM kaustavpaul_demo.ace_demo.logistics_fact LIMIT 3;

-- 4. Check what's actually queryable
SELECT COUNT(*) as count_no_filter
FROM kaustavpaul_demo.ace_demo.logistics_fact;

-- 5. Check with 24h filter (what API uses)
SELECT COUNT(*) as count_24h_filter
FROM kaustavpaul_demo.ace_demo.logistics_fact
WHERE event_ts >= CURRENT_TIMESTAMP() - INTERVAL 24 HOURS;

-- 6. List all tables
SHOW TABLES IN kaustavpaul_demo.ace_demo;
