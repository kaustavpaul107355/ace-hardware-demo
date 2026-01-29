"""
ACE Hardware Logistics Dashboard - Backend API
Flask application to serve data from Databricks SQL Warehouse
Can run standalone or as Databricks App
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from databricks import sql
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Determine if running as Databricks App or local development
IS_DATABRICKS_APP = os.getenv('DATABRICKS_RUNTIME_VERSION') is not None
STATIC_FOLDER = Path(__file__).parent.parent / 'dist' if IS_DATABRICKS_APP else None

# Initialize Flask app
if IS_DATABRICKS_APP and STATIC_FOLDER and STATIC_FOLDER.exists():
    app = Flask(__name__, static_folder=str(STATIC_FOLDER), static_url_path='')
    logger.info(f"Running as Databricks App - serving static files from {STATIC_FOLDER}")
else:
    app = Flask(__name__)
    CORS(app)  # Enable CORS for local development
    logger.info("Running in local development mode with CORS")

# Databricks connection configuration
DATABRICKS_CONFIG = {
    'server_hostname': os.getenv('DATABRICKS_SERVER_HOSTNAME', 'e2-demo-field-eng.cloud.databricks.com'),
    'http_path': os.getenv('DATABRICKS_HTTP_PATH'),
    'access_token': os.getenv('DATABRICKS_ACCESS_TOKEN'),
    'catalog': 'kaustavpaul_demo',
    'schema': 'ace_demo'
}

def get_databricks_connection():
    """Create and return a Databricks SQL connection"""
    try:
        connection = sql.connect(
            server_hostname=DATABRICKS_CONFIG['server_hostname'],
            http_path=DATABRICKS_CONFIG['http_path'],
            access_token=DATABRICKS_CONFIG['access_token']
        )
        return connection
    except Exception as e:
        logger.error(f"Failed to connect to Databricks: {e}")
        raise

def execute_query(query: str) -> List[Dict[str, Any]]:
    """Execute a SQL query and return results as list of dicts"""
    try:
        with get_databricks_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query)
            
            # Get column names
            columns = [desc[0] for desc in cursor.description]
            
            # Fetch all rows and convert to list of dicts
            results = []
            for row in cursor.fetchall():
                results.append(dict(zip(columns, row)))
            
            cursor.close()
            return results
    except Exception as e:
        logger.error(f"Query execution failed: {e}")
        raise

# ============================================================================
# STATIC FILE SERVING (For Databricks Apps)
# ============================================================================

@app.route('/')
def serve_root():
    """Serve React app (Databricks Apps) or API info (local dev)"""
    if IS_DATABRICKS_APP and STATIC_FOLDER:
        return send_from_directory(str(STATIC_FOLDER), 'index.html')
    else:
        return jsonify({
            'service': 'ACE Logistics API',
            'status': 'running',
            'mode': 'development',
            'endpoints': [
                '/api/kpis',
                '/api/regions',
                '/api/throughput',
                '/api/fleet',
                '/api/risk-stores',
                '/api/delay-causes',
                '/api/eta-accuracy',
                '/api/truck-locations',
                '/api/alerts'
            ]
        })

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files from React build (Databricks Apps only)"""
    if IS_DATABRICKS_APP and STATIC_FOLDER:
        if (STATIC_FOLDER / path).exists():
            return send_from_directory(str(STATIC_FOLDER), path)
        else:
            # SPA fallback - serve index.html for client-side routing
            return send_from_directory(str(STATIC_FOLDER), 'index.html')
    return jsonify({'error': 'Not found'}), 404

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'ACE Logistics API',
        'mode': 'databricks_app' if IS_DATABRICKS_APP else 'development'
    })

@app.route('/api/kpis', methods=['GET'])
def get_kpis():
    """
    Get executive KPIs for dashboard home page
    Returns: Network throughput, late arrivals, avg delay, data quality
    """
    query = f"""
    WITH current_metrics AS (
      SELECT 
        COUNT(DISTINCT CASE WHEN event_type='IN_TRANSIT' THEN truck_id END) as network_throughput,
        SUM(CASE WHEN delay_minutes > 30 THEN 1 ELSE 0 END) as late_arrivals_count,
        COUNT(*) as total_deliveries,
        ROUND(AVG(COALESCE(delay_minutes, 0)), 1) as avg_delay,
        ROUND(AVG(CASE WHEN store_id IS NOT NULL THEN 100 ELSE 0 END), 1) as data_quality_score
      FROM {DATABRICKS_CONFIG['catalog']}.{DATABRICKS_CONFIG['schema']}.logistics_fact
      WHERE delivery_timestamp >= CURRENT_TIMESTAMP() - INTERVAL 24 HOURS
    )
    SELECT 
      network_throughput,
      late_arrivals_count as late_arrivals,
      ROUND((late_arrivals_count * 100.0 / NULLIF(total_deliveries, 0)), 1) as late_arrivals_percent,
      avg_delay,
      COALESCE(data_quality_score, 96.8) as data_quality_score
    FROM current_metrics
    """
    
    try:
        results = execute_query(query)
        if results:
            return jsonify(results[0])
        return jsonify({
            'network_throughput': 0,
            'late_arrivals': 0,
            'late_arrivals_percent': 0.0,
            'avg_delay': 0.0,
            'data_quality_score': 96.8
        })
    except Exception as e:
        logger.error(f"Error fetching KPIs: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/regions', methods=['GET'])
def get_regional_status():
    """
    Get regional performance status
    Returns: Region name, truck count, utilization, status
    """
    query = f"""
    SELECT 
      region_id as name,
      COUNT(DISTINCT truck_id) as trucks,
      ROUND(AVG(delay_rate_pct), 0) as utilization,
      CASE 
        WHEN AVG(delay_rate_pct) > 20 THEN 'critical'
        WHEN AVG(delay_rate_pct) > 10 THEN 'warning'
        ELSE 'normal'
      END as status
    FROM {DATABRICKS_CONFIG['catalog']}.{DATABRICKS_CONFIG['schema']}.supply_chain_kpi
    GROUP BY region_id
    ORDER BY utilization DESC
    """
    
    try:
        results = execute_query(query)
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error fetching regional status: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/throughput', methods=['GET'])
def get_throughput_data():
    """
    Get 24-hour throughput data for trending chart
    Returns: Hourly truck counts
    """
    query = f"""
    SELECT 
      DATE_FORMAT(delivery_timestamp, 'HH:00') as hour,
      COUNT(DISTINCT truck_id) as trucks
    FROM {DATABRICKS_CONFIG['catalog']}.{DATABRICKS_CONFIG['schema']}.logistics_fact
    WHERE delivery_timestamp >= CURRENT_TIMESTAMP() - INTERVAL 24 HOURS
    GROUP BY DATE_FORMAT(delivery_timestamp, 'HH:00')
    ORDER BY hour
    """
    
    try:
        results = execute_query(query)
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error fetching throughput data: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/fleet', methods=['GET'])
def get_fleet_data():
    """
    Get active fleet tracking data
    Returns: Truck ID, origin, destination, ETA, delay, status, product category, value
    """
    limit = request.args.get('limit', 50, type=int)
    
    query = f"""
    SELECT 
      t.truck_id as id,
      CONCAT(t.origin_city, ', ', t.origin_state) as origin,
      CONCAT(t.store_city, ', ', t.store_state) as destination,
      DATE_FORMAT(t.estimated_arrival_ts, 'h:mm a') as eta,
      COALESCE(t.delay_minutes, 0) as delay,
      CASE 
        WHEN t.delay_minutes IS NULL OR t.delay_minutes = 0 THEN 'on-time'
        WHEN t.delay_minutes < 30 THEN 'minor-delay'
        ELSE 'delayed'
      END as status,
      COALESCE(p.category, 'GENERAL') as productCategory,
      t.shipment_total_value as shipmentValue
    FROM {DATABRICKS_CONFIG['catalog']}.{DATABRICKS_CONFIG['schema']}.logistics_silver t
    LEFT JOIN (
      SELECT DISTINCT region_id, category 
      FROM {DATABRICKS_CONFIG['catalog']}.{DATABRICKS_CONFIG['schema']}.product_category_metrics
    ) p ON t.region_id = p.region_id
    WHERE t.event_type = 'IN_TRANSIT'
    ORDER BY t.estimated_arrival_ts
    LIMIT {limit}
    """
    
    try:
        results = execute_query(query)
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error fetching fleet data: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/risk-stores', methods=['GET'])
def get_risk_stores():
    """
    Get store risk assessment data
    Returns: Store ID, location, risk score, primary delay, revenue at risk, risk tier
    """
    limit = request.args.get('limit', 20, type=int)
    
    query = f"""
    SELECT 
      store_id as storeId,
      CONCAT(store_city, ', ', store_state) as location,
      ROUND(store_avg_delay * 1.5 + COALESCE(region_vendor_avg_delay, 0) * 0.5, 0) as riskScore,
      delay_reason as primaryDelay,
      revenue_at_risk as revenueAtRisk,
      store_risk_tier as riskTier
    FROM {DATABRICKS_CONFIG['catalog']}.{DATABRICKS_CONFIG['schema']}.logistics_fact
    WHERE store_risk_tier IN ('HIGH', 'MEDIUM')
    GROUP BY store_id, store_city, store_state, store_avg_delay, 
             region_vendor_avg_delay, delay_reason, revenue_at_risk, store_risk_tier
    ORDER BY riskScore DESC
    LIMIT {limit}
    """
    
    try:
        results = execute_query(query)
        # Format risk tier to uppercase
        for result in results:
            if result.get('riskTier') == 'HIGH':
                result['riskTier'] = 'CRITICAL' if result['riskScore'] >= 80 else 'HIGH'
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error fetching risk stores: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/delay-causes', methods=['GET'])
def get_delay_causes():
    """
    Get delay root cause analysis
    Returns: Cause, count, percentage
    """
    days = request.args.get('days', 7, type=int)
    
    query = f"""
    WITH delay_counts AS (
      SELECT 
        delay_reason as cause,
        COUNT(*) as count
      FROM {DATABRICKS_CONFIG['catalog']}.{DATABRICKS_CONFIG['schema']}.logistics_fact
      WHERE delay_minutes > 0
        AND delivery_timestamp >= CURRENT_TIMESTAMP() - INTERVAL {days} DAYS
      GROUP BY delay_reason
    )
    SELECT 
      cause,
      count,
      ROUND(count * 100.0 / SUM(count) OVER (), 0) as percentage
    FROM delay_counts
    ORDER BY count DESC
    """
    
    try:
        results = execute_query(query)
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error fetching delay causes: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/eta-accuracy', methods=['GET'])
def get_eta_accuracy():
    """
    Get ETA vs actual arrival comparison for last 6 hours
    Returns: Time, predicted ETA, actual arrival
    """
    query = f"""
    WITH hourly_data AS (
      SELECT 
        DATE_FORMAT(delivery_timestamp, 'HH:00') as time,
        COUNT(*) as actual,
        AVG(TIMESTAMPDIFF(MINUTE, delivery_timestamp, estimated_arrival_ts)) as predicted_offset
      FROM {DATABRICKS_CONFIG['catalog']}.{DATABRICKS_CONFIG['schema']}.logistics_silver
      WHERE delivery_timestamp >= CURRENT_TIMESTAMP() - INTERVAL 6 HOURS
        AND event_type = 'DELIVERED'
      GROUP BY DATE_FORMAT(delivery_timestamp, 'HH:00')
    )
    SELECT 
      time,
      actual,
      ROUND(actual + predicted_offset, 0) as predicted
    FROM hourly_data
    ORDER BY time
    """
    
    try:
        results = execute_query(query)
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error fetching ETA accuracy: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/truck-locations', methods=['GET'])
def get_truck_locations():
    """
    Get GPS coordinates for live map
    Returns: Truck ID, latitude, longitude, status, ETA, region
    """
    query = f"""
    SELECT 
      truck_id as id,
      latitude as lat,
      longitude as lng,
      CASE 
        WHEN delay_minutes IS NULL OR delay_minutes = 0 THEN 'on-time'
        WHEN delay_minutes < 30 THEN 'minor-delay'
        ELSE 'delayed'
      END as status,
      DATE_FORMAT(estimated_arrival_ts, 'h:mm a') as eta,
      region_id as region
    FROM {DATABRICKS_CONFIG['catalog']}.{DATABRICKS_CONFIG['schema']}.logistics_silver
    WHERE event_type = 'IN_TRANSIT'
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
    LIMIT 50
    """
    
    try:
        results = execute_query(query)
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error fetching truck locations: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """
    Generate alerts from delay data
    Returns: Alert ID, type, title, description, timestamp, action required
    """
    query = f"""
    SELECT 
      ROW_NUMBER() OVER (ORDER BY delay_minutes DESC) as id,
      CASE 
        WHEN delay_minutes > 120 THEN 'critical'
        WHEN delay_minutes > 60 THEN 'warning'
        ELSE 'info'
      END as type,
      CONCAT('Truck ', truck_id, ' Delayed ', delay_minutes, ' Minutes') as title,
      CONCAT('Route: ', origin_city, ' → ', store_city, ' | Reason: ', delay_reason) as description,
      DATE_FORMAT(event_ts, '%h:%i %p') as timestamp,
      CASE WHEN delay_minutes > 120 THEN true ELSE false END as actionRequired
    FROM {DATABRICKS_CONFIG['catalog']}.{DATABRICKS_CONFIG['schema']}.logistics_fact
    WHERE delay_minutes > 30
      AND delivery_timestamp >= CURRENT_TIMESTAMP() - INTERVAL 24 HOURS
    ORDER BY delay_minutes DESC
    LIMIT 20
    """
    
    try:
        results = execute_query(query)
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error fetching alerts: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    # Verify environment variables
    required_vars = ['DATABRICKS_HTTP_PATH']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars and not IS_DATABRICKS_APP:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        logger.error("Please copy backend/.env.example to backend/.env and configure")
        exit(1)
    
    logger.info("Starting ACE Logistics Dashboard API...")
    logger.info(f"Mode: {'Databricks App' if IS_DATABRICKS_APP else 'Local Development'}")
    logger.info(f"Databricks Host: {DATABRICKS_CONFIG['server_hostname']}")
    logger.info(f"Catalog.Schema: {DATABRICKS_CONFIG['catalog']}.{DATABRICKS_CONFIG['schema']}")
    
    if IS_DATABRICKS_APP and STATIC_FOLDER:
        logger.info(f"Serving static files from: {STATIC_FOLDER}")
    
    # Run server
    port = int(os.getenv('APP_PORT', os.getenv('PORT', 8000)))
    debug = not IS_DATABRICKS_APP
    
    logger.info(f"Starting server on 0.0.0.0:{port}...")
    app.run(debug=debug, host='0.0.0.0', port=port, threaded=True)
