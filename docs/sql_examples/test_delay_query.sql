-- Test query for delay causes
SELECT 
  COALESCE(delay_reason, 'NULL_VALUE') as cause,
  COUNT(*) as count,
  MIN(delay_minutes) as min_delay,
  MAX(delay_minutes) as max_delay
FROM kaustavpaul_demo.ace_demo.logistics_silver
WHERE event_type = 'DELIVERED'
GROUP BY delay_reason
ORDER BY count DESC
LIMIT 20;

-- Also check all DELIVERED events
SELECT 
  COUNT(*) as total_delivered,
  COUNT(CASE WHEN delay_minutes IS NOT NULL AND delay_minutes > 0 THEN 1 END) as delayed_count,
  COUNT(CASE WHEN delay_reason IS NOT NULL AND delay_reason != 'NONE' THEN 1 END) as has_reason_count
FROM kaustavpaul_demo.ace_demo.logistics_silver
WHERE event_type = 'DELIVERED';
