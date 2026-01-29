-- Diagnostic queries to check delay_reason in logistics_silver

-- 1. Check if delay_reason column exists and what values it has
SELECT 
  delay_reason,
  COUNT(*) as count
FROM kaustavpaul_demo.ace_demo.logistics_silver
WHERE event_type = 'DELIVERED'
GROUP BY delay_reason
ORDER BY count DESC;

-- 2. Check DELIVERED events with actual delays
SELECT 
  event_type,
  COUNT(*) as total_delivered,
  COUNT(CASE WHEN delay_minutes IS NOT NULL AND delay_minutes > 0 THEN 1 END) as with_delay_minutes,
  COUNT(CASE WHEN delay_reason IS NOT NULL THEN 1 END) as with_delay_reason,
  COUNT(CASE WHEN delay_reason IS NOT NULL AND delay_reason != 'NONE' THEN 1 END) as with_valid_reason
FROM kaustavpaul_demo.ace_demo.logistics_silver
WHERE event_type = 'DELIVERED'
GROUP BY event_type;

-- 3. Sample of DELIVERED events with delays
SELECT 
  shipment_id,
  event_ts,
  delay_minutes,
  delay_reason,
  ingest_date
FROM kaustavpaul_demo.ace_demo.logistics_silver
WHERE event_type = 'DELIVERED'
  AND delay_minutes > 0
ORDER BY ingest_date DESC
LIMIT 20;

-- 4. Check date range of data in silver table
SELECT 
  MIN(ingest_date) as earliest_date,
  MAX(ingest_date) as latest_date,
  COUNT(DISTINCT ingest_date) as unique_dates,
  COUNT(*) as total_events
FROM kaustavpaul_demo.ace_demo.logistics_silver;
