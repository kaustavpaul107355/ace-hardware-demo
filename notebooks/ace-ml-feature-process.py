# Databricks notebook source
# DBTITLE 1,Introduction
# MAGIC %md
# MAGIC # Delivery Delay Prediction - Feature Engineering
# MAGIC
# MAGIC This notebook creates a feature table for predicting store delivery delays by combining:
# MAGIC * **Store-level delay metrics** - Store performance and delay patterns
# MAGIC * **Vendor performance by region** - Regional vendor reliability metrics
# MAGIC * **Carrier benchmarking data** - Overall carrier performance
# MAGIC * **Product category analysis** - Product-specific delay patterns
# MAGIC
# MAGIC **Target Variable:** `high_delay_flag` (1 if avg_delay_minutes > 30, else 0)
# MAGIC
# MAGIC **Output Table:** `kaustavpaul_demo.ace_demo.ml_features_delivery_delay`

# COMMAND ----------

# MAGIC %md
# MAGIC ## 1. Create Feature Table
# MAGIC
# MAGIC Join all source tables and engineer features for ML model training

# COMMAND ----------

# DBTITLE 1,Create Feature Table
# Create feature table by joining all source tables
spark.sql("""
CREATE OR REPLACE TABLE kaustavpaul_demo.ace_demo.ml_features_delivery_delay
COMMENT 'Feature table for delivery delay prediction ML model'
AS
WITH store_base AS (
  SELECT
    store_id,
    store_name,
    store_city,
    store_state,
    region_id,
    store_latitude,
    store_longitude,
    store_weekly_revenue,
    total_deliveries,
    total_delay_minutes,
    avg_delay_minutes,
    max_delay_minutes,
    delayed_shipments,
    total_shipment_value,
    avg_temperature,
    -- Derived features from store metrics
    CAST(delayed_shipments AS DOUBLE) / NULLIF(total_deliveries, 0) AS delay_rate,
    total_shipment_value / NULLIF(total_deliveries, 0) AS avg_shipment_value,
    -- Target variable: binary classification (high delay = avg > 30 minutes)
    CASE WHEN avg_delay_minutes > 30 THEN 1 ELSE 0 END AS high_delay_flag
  FROM kaustavpaul_demo.ace_demo.store_delay_metrics
),

vendor_agg AS (
  SELECT
    region_id,
    COUNT(DISTINCT vendor_id) AS vendor_count,
    AVG(avg_delay_minutes) AS region_vendor_avg_delay,
    SUM(delayed_deliveries) AS region_vendor_delayed_deliveries,
    SUM(total_deliveries) AS region_vendor_total_deliveries,
    AVG(CAST(delayed_deliveries AS DOUBLE) / NULLIF(total_deliveries, 0)) AS region_vendor_delay_rate,
    SUM(CASE WHEN vendor_risk_tier = 'High' THEN 1 ELSE 0 END) AS high_risk_vendor_count,
    SUM(total_value_delivered) AS region_vendor_total_value
  FROM kaustavpaul_demo.ace_demo.vendor_performance
  GROUP BY region_id
),

carrier_agg AS (
  SELECT
    AVG(avg_delay_minutes) AS overall_carrier_avg_delay,
    MAX(max_delay_minutes) AS overall_carrier_max_delay,
    AVG(CAST(delayed_deliveries AS DOUBLE) / NULLIF(total_deliveries, 0)) AS overall_carrier_delay_rate
  FROM kaustavpaul_demo.ace_demo.carrier_performance
),

product_agg AS (
  SELECT
    region_id,
    SUM(CASE WHEN requires_temp_control = true THEN total_units_shipped ELSE 0 END) AS temp_controlled_units,
    SUM(total_units_shipped) AS total_units,
    AVG(avg_delivery_delay) AS region_product_avg_delay,
    AVG(avg_temperature) AS region_product_avg_temp,
    CAST(SUM(CASE WHEN requires_temp_control = true THEN total_units_shipped ELSE 0 END) AS DOUBLE) / 
      NULLIF(SUM(total_units_shipped), 0) AS temp_controlled_ratio
  FROM kaustavpaul_demo.ace_demo.product_category_metrics
  GROUP BY region_id
)

SELECT
  -- Store identifiers
  s.store_id,
  s.store_name,
  s.store_city,
  s.store_state,
  s.region_id,
  
  -- Store location features
  s.store_latitude,
  s.store_longitude,
  
  -- Store performance features
  s.store_weekly_revenue,
  s.total_deliveries,
  s.avg_delay_minutes,
  s.max_delay_minutes,
  s.delay_rate AS store_delay_rate,
  s.avg_shipment_value,
  s.total_shipment_value,
  s.avg_temperature AS store_avg_temperature,
  
  -- Vendor features (regional aggregates)
  COALESCE(v.vendor_count, 0) AS region_vendor_count,
  COALESCE(v.region_vendor_avg_delay, 0) AS region_vendor_avg_delay,
  COALESCE(v.region_vendor_delay_rate, 0) AS region_vendor_delay_rate,
  COALESCE(v.high_risk_vendor_count, 0) AS region_high_risk_vendor_count,
  COALESCE(v.region_vendor_total_value, 0) AS region_vendor_total_value,
  
  -- Carrier features (overall benchmarks)
  COALESCE(c.overall_carrier_avg_delay, 0) AS overall_carrier_avg_delay,
  COALESCE(c.overall_carrier_max_delay, 0) AS overall_carrier_max_delay,
  COALESCE(c.overall_carrier_delay_rate, 0) AS overall_carrier_delay_rate,
  
  -- Product category features (regional aggregates)
  COALESCE(p.temp_controlled_units, 0) AS region_temp_controlled_units,
  COALESCE(p.temp_controlled_ratio, 0) AS region_temp_controlled_ratio,
  COALESCE(p.region_product_avg_delay, 0) AS region_product_avg_delay,
  COALESCE(p.region_product_avg_temp, 0) AS region_product_avg_temp,
  
  -- Interaction features
  s.avg_delay_minutes - COALESCE(v.region_vendor_avg_delay, 0) AS store_vs_region_vendor_delay_diff,
  s.avg_delay_minutes - COALESCE(c.overall_carrier_avg_delay, 0) AS store_vs_carrier_delay_diff,
  s.delay_rate - COALESCE(v.region_vendor_delay_rate, 0) AS store_vs_region_vendor_rate_diff,
  
  -- Target variable
  s.high_delay_flag
  
FROM store_base s
LEFT JOIN vendor_agg v ON s.region_id = v.region_id
CROSS JOIN carrier_agg c
LEFT JOIN product_agg p ON s.region_id = p.region_id
""")

print("✓ Feature table created successfully!")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 2. Preview Feature Table

# COMMAND ----------

# DBTITLE 1,Sample Rows
# Preview the feature table
display(spark.sql("""
  SELECT * FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay LIMIT 10
"""))

# COMMAND ----------

# MAGIC %md
# MAGIC ## 3. Feature Summary Statistics

# COMMAND ----------

# DBTITLE 1,Describe Table

# Show table schema
display(spark.sql("""
  DESCRIBE TABLE kaustavpaul_demo.ace_demo.ml_features_delivery_delay
"""))

# COMMAND ----------

# MAGIC %md
# MAGIC ## 4. Target Variable Distribution

# COMMAND ----------

# DBTITLE 1,Class Balance

# Analyze target variable distribution
display(spark.sql("""
  SELECT 
    high_delay_flag,
    COUNT(*) AS count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
  FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay
  GROUP BY high_delay_flag
  ORDER BY high_delay_flag
"""))

# COMMAND ----------

# MAGIC %md
# MAGIC ## 5. Feature Correlation with Target
# MAGIC
# MAGIC Compare average feature values between high delay and normal delay stores

# COMMAND ----------

# DBTITLE 1,Feature Comparison

# Compare features between high delay and normal delay stores
display(spark.sql("""
  SELECT
    high_delay_flag,
    ROUND(AVG(store_weekly_revenue), 2) AS avg_revenue,
    ROUND(AVG(total_deliveries), 2) AS avg_deliveries,
    ROUND(AVG(store_delay_rate), 4) AS avg_delay_rate,
    ROUND(AVG(region_vendor_avg_delay), 2) AS avg_vendor_delay,
    ROUND(AVG(region_high_risk_vendor_count), 2) AS avg_high_risk_vendors,
    ROUND(AVG(overall_carrier_avg_delay), 2) AS avg_carrier_delay,
    ROUND(AVG(region_temp_controlled_ratio), 4) AS avg_temp_controlled_ratio,
    ROUND(AVG(store_avg_temperature), 2) AS avg_temperature
  FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay
  GROUP BY high_delay_flag
  ORDER BY high_delay_flag
"""))

# COMMAND ----------

# MAGIC %md
# MAGIC ## Next Steps
# MAGIC
# MAGIC 1. **Data Exploration**: Analyze feature distributions and correlations
# MAGIC 2. **Feature Selection**: Identify most predictive features
# MAGIC 3. **Model Training**: Build classification model (Logistic Regression, Random Forest, XGBoost)
# MAGIC 4. **Model Evaluation**: Assess performance with accuracy, precision, recall, F1-score
# MAGIC 5. **Model Deployment**: Register model to MLflow and deploy for predictions

# COMMAND ----------

# MAGIC %md
# MAGIC ## 6. Data Visualizations
# MAGIC
# MAGIC Visual analysis of feature distributions and relationships

# COMMAND ----------

# DBTITLE 1,Regional Delay Analysis

# Regional delay patterns
display(spark.sql("""
  SELECT 
    region_id,
    COUNT(*) as store_count,
    ROUND(AVG(avg_delay_minutes), 2) as avg_delay,
    ROUND(AVG(store_delay_rate), 4) as avg_delay_rate,
    SUM(CASE WHEN high_delay_flag = 1 THEN 1 ELSE 0 END) as high_delay_stores,
    ROUND(AVG(region_vendor_avg_delay), 2) as vendor_delay,
    ROUND(AVG(store_weekly_revenue), 2) as avg_revenue
  FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay
  GROUP BY region_id
  ORDER BY avg_delay DESC
"""))

# COMMAND ----------

# DBTITLE 1,Delay Distribution by Revenue

# Analyze delay patterns across revenue segments
display(spark.sql("""
  SELECT 
    CASE 
      WHEN store_weekly_revenue < 50000 THEN 'Low Revenue'
      WHEN store_weekly_revenue < 100000 THEN 'Medium Revenue'
      ELSE 'High Revenue'
    END as revenue_segment,
    COUNT(*) as store_count,
    ROUND(AVG(avg_delay_minutes), 2) as avg_delay,
    SUM(CASE WHEN high_delay_flag = 1 THEN 1 ELSE 0 END) as high_delay_count,
    ROUND(100.0 * SUM(CASE WHEN high_delay_flag = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) as high_delay_pct
  FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay
  GROUP BY revenue_segment
  ORDER BY 
    CASE revenue_segment
      WHEN 'Low Revenue' THEN 1
      WHEN 'Medium Revenue' THEN 2
      ELSE 3
    END
"""))

# COMMAND ----------

# DBTITLE 1,Temperature Impact on Delays

# Analyze relationship between temperature and delays
display(spark.sql("""
  SELECT 
    ROUND(store_avg_temperature / 10) * 10 as temp_bucket,
    COUNT(*) as store_count,
    ROUND(AVG(avg_delay_minutes), 2) as avg_delay,
    ROUND(AVG(region_temp_controlled_ratio), 4) as temp_controlled_ratio,
    SUM(CASE WHEN high_delay_flag = 1 THEN 1 ELSE 0 END) as high_delay_stores
  FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay
  GROUP BY temp_bucket
  ORDER BY temp_bucket
"""))

# COMMAND ----------

# DBTITLE 1,Vendor Risk Impact

# Compare delays by vendor risk levels in region
display(spark.sql("""
  SELECT 
    CASE 
      WHEN region_high_risk_vendor_count = 0 THEN 'No High Risk Vendors'
      WHEN region_high_risk_vendor_count <= 2 THEN '1-2 High Risk Vendors'
      ELSE '3+ High Risk Vendors'
    END as risk_category,
    COUNT(*) as store_count,
    ROUND(AVG(avg_delay_minutes), 2) as avg_delay,
    ROUND(AVG(region_vendor_avg_delay), 2) as region_vendor_delay,
    ROUND(100.0 * SUM(CASE WHEN high_delay_flag = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) as high_delay_pct
  FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay
  GROUP BY risk_category
  ORDER BY 
    CASE risk_category
      WHEN 'No High Risk Vendors' THEN 1
      WHEN '1-2 High Risk Vendors' THEN 2
      ELSE 3
    END
"""))

# COMMAND ----------

# MAGIC %md
# MAGIC ## 7. Advanced Visualizations with Python
# MAGIC
# MAGIC Correlation analysis and feature distributions

# COMMAND ----------

# DBTITLE 1,Feature Correlation Data
# Feature correlation with target variable
display(spark.sql("""
  SELECT 
    'store_delay_rate' as feature,
    CORR(store_delay_rate, high_delay_flag) as correlation_with_target
  FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay
  UNION ALL
  SELECT 'region_vendor_avg_delay', CORR(region_vendor_avg_delay, high_delay_flag)
  FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay
  UNION ALL
  SELECT 'region_vendor_delay_rate', CORR(region_vendor_delay_rate, high_delay_flag)
  FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay
  UNION ALL
  SELECT 'region_high_risk_vendor_count', CORR(region_high_risk_vendor_count, high_delay_flag)
  FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay
  UNION ALL
  SELECT 'overall_carrier_avg_delay', CORR(overall_carrier_avg_delay, high_delay_flag)
  FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay
  UNION ALL
  SELECT 'region_temp_controlled_ratio', CORR(region_temp_controlled_ratio, high_delay_flag)
  FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay
  UNION ALL
  SELECT 'store_avg_temperature', CORR(store_avg_temperature, high_delay_flag)
  FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay
  UNION ALL
  SELECT 'store_weekly_revenue', CORR(store_weekly_revenue, high_delay_flag)
  FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay
  UNION ALL
  SELECT 'total_deliveries', CORR(total_deliveries, high_delay_flag)
  FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay
  ORDER BY correlation_with_target DESC
"""))

# COMMAND ----------

# DBTITLE 1,Feature Distribution Comparison
# Feature distribution statistics by target class
display(spark.sql("""
  SELECT 
    'store_delay_rate' as feature,
    high_delay_flag,
    CASE WHEN high_delay_flag = 0 THEN 'Normal Delay' ELSE 'High Delay' END as delay_class,
    MIN(store_delay_rate) as min_value,
    PERCENTILE(store_delay_rate, 0.25) as q1,
    PERCENTILE(store_delay_rate, 0.5) as median,
    PERCENTILE(store_delay_rate, 0.75) as q3,
    MAX(store_delay_rate) as max_value,
    AVG(store_delay_rate) as mean_value
  FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay
  GROUP BY high_delay_flag
  
  UNION ALL
  
  SELECT 
    'region_vendor_avg_delay',
    high_delay_flag,
    CASE WHEN high_delay_flag = 0 THEN 'Normal Delay' ELSE 'High Delay' END,
    MIN(region_vendor_avg_delay),
    PERCENTILE(region_vendor_avg_delay, 0.25),
    PERCENTILE(region_vendor_avg_delay, 0.5),
    PERCENTILE(region_vendor_avg_delay, 0.75),
    MAX(region_vendor_avg_delay),
    AVG(region_vendor_avg_delay)
  FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay
  GROUP BY high_delay_flag
  
  UNION ALL
  
  SELECT 
    'overall_carrier_avg_delay',
    high_delay_flag,
    CASE WHEN high_delay_flag = 0 THEN 'Normal Delay' ELSE 'High Delay' END,
    MIN(overall_carrier_avg_delay),
    PERCENTILE(overall_carrier_avg_delay, 0.25),
    PERCENTILE(overall_carrier_avg_delay, 0.5),
    PERCENTILE(overall_carrier_avg_delay, 0.75),
    MAX(overall_carrier_avg_delay),
    AVG(overall_carrier_avg_delay)
  FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay
  GROUP BY high_delay_flag
  
  UNION ALL
  
  SELECT 
    'region_temp_controlled_ratio',
    high_delay_flag,
    CASE WHEN high_delay_flag = 0 THEN 'Normal Delay' ELSE 'High Delay' END,
    MIN(region_temp_controlled_ratio),
    PERCENTILE(region_temp_controlled_ratio, 0.25),
    PERCENTILE(region_temp_controlled_ratio, 0.5),
    PERCENTILE(region_temp_controlled_ratio, 0.75),
    MAX(region_temp_controlled_ratio),
    AVG(region_temp_controlled_ratio)
  FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay
  GROUP BY high_delay_flag
  
  ORDER BY feature, high_delay_flag
"""))

# COMMAND ----------

# DBTITLE 1,Delay by State Analysis
# Top 15 states by average delay
display(spark.sql("""
  SELECT 
    store_state,
    COUNT(store_id) as store_count,
    ROUND(AVG(avg_delay_minutes), 2) as avg_delay,
    SUM(high_delay_flag) as high_delay_count,
    ROUND(100.0 * SUM(high_delay_flag) / COUNT(store_id), 2) as high_delay_pct
  FROM kaustavpaul_demo.ace_demo.ml_features_delivery_delay
  GROUP BY store_state
  ORDER BY avg_delay DESC
  LIMIT 15
"""))

# COMMAND ----------

# MAGIC %md
# MAGIC ## Summary
# MAGIC
# MAGIC The feature engineering pipeline has successfully created a comprehensive dataset with:
# MAGIC * **30+ engineered features** from 4 source tables
# MAGIC * **Store-level metrics**: Location, revenue, delivery volume, delay patterns
# MAGIC * **Regional aggregates**: Vendor performance, carrier benchmarks, product characteristics
# MAGIC * **Interaction features**: Store vs regional performance comparisons
# MAGIC * **Binary target variable**: High delay classification (>30 minutes)
# MAGIC
# MAGIC Key insights from visualizations:
# MAGIC * Regional patterns show significant variation in delay rates
# MAGIC * Vendor risk levels correlate with store delays
# MAGIC * Temperature and product mix impact delivery performance
# MAGIC * Revenue segments show different delay characteristics

# COMMAND ----------

# MAGIC %md
# MAGIC ## 8. Native Python Visualizations
# MAGIC
# MAGIC Matplotlib and Seaborn charts for deeper insights

# COMMAND ----------

# DBTITLE 1,Load and Prepare Data
# Load feature data into pandas for visualization
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (14, 6)

# Load the feature table
df = spark.table("kaustavpaul_demo.ace_demo.ml_features_delivery_delay").toPandas()

print(f"✓ Loaded {len(df):,} stores for visualization")
print(f"✓ Target distribution: {df['high_delay_flag'].value_counts().to_dict()}")
print(f"✓ Delay statistics: min={df['avg_delay_minutes'].min():.1f}, max={df['avg_delay_minutes'].max():.1f}, median={df['avg_delay_minutes'].median():.1f}")

# Handle outliers for better visualization (cap at 99th percentile)
for col in ['avg_delay_minutes', 'store_weekly_revenue', 'total_deliveries']:
    p99 = df[col].quantile(0.99)
    df[f'{col}_capped'] = df[col].clip(upper=p99)
    
print("\n✓ Data prepared with outlier handling for visualization")

# COMMAND ----------

# DBTITLE 1,Target Distribution & Key Insights
# Comprehensive target analysis
fig = plt.figure(figsize=(16, 10))
gs = fig.add_gridspec(3, 3, hspace=0.3, wspace=0.3)

# 1. Target Distribution - Pie Chart
ax1 = fig.add_subplot(gs[0, 0])
target_counts = df['high_delay_flag'].value_counts()
colors = ['#2ecc71', '#e74c3c']
labels = ['Normal Delay (≤30 min)', 'High Delay (>30 min)']
ax1.pie(target_counts, labels=labels, autopct='%1.1f%%', colors=colors, startangle=90)
ax1.set_title('Target Distribution', fontsize=12, fontweight='bold')

# 2. Delay Distribution Histogram
ax2 = fig.add_subplot(gs[0, 1:])
ax2.hist([df[df['high_delay_flag']==0]['avg_delay_minutes_capped'], 
          df[df['high_delay_flag']==1]['avg_delay_minutes_capped']], 
         bins=30, label=['Normal Delay', 'High Delay'], color=colors, alpha=0.7)
ax2.set_xlabel('Average Delay (minutes)', fontsize=10)
ax2.set_ylabel('Number of Stores', fontsize=10)
ax2.set_title('Delay Distribution by Category', fontsize=12, fontweight='bold')
ax2.legend()
ax2.grid(alpha=0.3)

# 3. Top Feature Correlations
ax3 = fig.add_subplot(gs[1, :])
key_features = ['store_delay_rate', 'region_vendor_avg_delay', 'region_vendor_delay_rate',
                'region_high_risk_vendor_count', 'overall_carrier_avg_delay', 
                'region_temp_controlled_ratio', 'store_avg_temperature']
corr_with_target = df[key_features + ['high_delay_flag']].corr()['high_delay_flag'].drop('high_delay_flag').sort_values(ascending=False)
colors_bar = ['#e74c3c' if x > 0 else '#2ecc71' for x in corr_with_target]
ax3.barh(range(len(corr_with_target)), corr_with_target.values, color=colors_bar, alpha=0.7)
ax3.set_yticks(range(len(corr_with_target)))
ax3.set_yticklabels([x.replace('_', ' ').title() for x in corr_with_target.index], fontsize=9)
ax3.set_xlabel('Correlation with High Delay', fontsize=10)
ax3.set_title('Feature Correlations with Target Variable', fontsize=12, fontweight='bold')
ax3.axvline(x=0, color='black', linestyle='-', linewidth=0.5)
ax3.grid(axis='x', alpha=0.3)

# 4. Revenue vs Delay Scatter
ax4 = fig.add_subplot(gs[2, 0])
scatter = ax4.scatter(df['store_weekly_revenue_capped']/1000, df['avg_delay_minutes_capped'],
                     c=df['high_delay_flag'], cmap='RdYlGn_r', alpha=0.4, s=30)
ax4.set_xlabel('Weekly Revenue ($K)', fontsize=10)
ax4.set_ylabel('Avg Delay (min)', fontsize=10)
ax4.set_title('Revenue vs Delay', fontsize=11, fontweight='bold')
ax4.grid(alpha=0.3)

# 5. Vendor Risk Impact
ax5 = fig.add_subplot(gs[2, 1])
risk_bins = pd.cut(df['region_high_risk_vendor_count'], bins=[-1, 0, 2, 100], labels=['No Risk', '1-2 High Risk', '3+ High Risk'])
risk_delay = df.groupby(risk_bins)['high_delay_flag'].mean() * 100
ax5.bar(range(len(risk_delay)), risk_delay.values, color=['#2ecc71', '#f39c12', '#e74c3c'], alpha=0.7)
ax5.set_xticks(range(len(risk_delay)))
ax5.set_xticklabels(risk_delay.index, fontsize=9)
ax5.set_ylabel('High Delay %', fontsize=10)
ax5.set_title('Vendor Risk Impact', fontsize=11, fontweight='bold')
ax5.grid(axis='y', alpha=0.3)

# 6. Temperature Impact
ax6 = fig.add_subplot(gs[2, 2])
temp_bins = pd.cut(df['store_avg_temperature'], bins=5)
temp_delay = df.groupby(temp_bins)['high_delay_flag'].mean() * 100
temp_labels = [f"{int(i.left)}-{int(i.right)}°F" for i in temp_delay.index]
ax6.bar(range(len(temp_delay)), temp_delay.values, color='coral', alpha=0.7)
ax6.set_xticks(range(len(temp_delay)))
ax6.set_xticklabels(temp_labels, fontsize=8, rotation=45)
ax6.set_ylabel('High Delay %', fontsize=10)
ax6.set_title('Temperature Impact', fontsize=11, fontweight='bold')
ax6.grid(axis='y', alpha=0.3)

plt.suptitle('Delivery Delay Analysis - Key Insights Dashboard', fontsize=16, fontweight='bold', y=0.995)
plt.show()

print("\n📊 Key Insights:")
print(f"  • High delay rate: {(df['high_delay_flag'].sum() / len(df) * 100):.1f}%")
print(f"  • Strongest positive correlation: {corr_with_target.idxmax().replace('_', ' ')} ({corr_with_target.max():.3f})")
print(f"  • Average delay: {df['avg_delay_minutes'].mean():.1f} minutes")

# COMMAND ----------

# DBTITLE 1,Regional & Segment Analysis
# Comprehensive regional and segment analysis
fig, axes = plt.subplots(2, 2, figsize=(16, 10))

# 1. Top 10 Regions by Delay
ax1 = axes[0, 0]
regional_stats = df.groupby('region_id').agg({
    'store_id': 'count',
    'avg_delay_minutes': 'mean',
    'high_delay_flag': lambda x: (x.sum() / len(x) * 100)
}).reset_index()
regional_stats.columns = ['region_id', 'store_count', 'avg_delay', 'high_delay_pct']
top_regions = regional_stats.nlargest(10, 'avg_delay')
ax1.barh(top_regions['region_id'], top_regions['avg_delay'], color='steelblue', alpha=0.7)
ax1.set_xlabel('Average Delay (minutes)', fontsize=11)
ax1.set_ylabel('Region ID', fontsize=11)
ax1.set_title('Top 10 Regions by Average Delay', fontsize=13, fontweight='bold')
ax1.grid(axis='x', alpha=0.3)

# 2. Revenue Segment Analysis
ax2 = axes[0, 1]
df['revenue_segment'] = pd.cut(df['store_weekly_revenue'], 
                                bins=[0, 50000, 100000, float('inf')],
                                labels=['Low', 'Medium', 'High'])
revenue_stats = df.groupby('revenue_segment', observed=True).agg({
    'store_id': 'count',
    'high_delay_flag': lambda x: (x.sum() / len(x) * 100)
}).reset_index()
revenue_stats.columns = ['segment', 'count', 'high_delay_pct']
colors_rev = ['#e74c3c', '#f39c12', '#2ecc71']
ax2.bar(revenue_stats['segment'], revenue_stats['high_delay_pct'], color=colors_rev, alpha=0.7)
ax2.set_ylabel('High Delay %', fontsize=11)
ax2.set_xlabel('Revenue Segment', fontsize=11)
ax2.set_title('High Delay % by Revenue Segment', fontsize=13, fontweight='bold')
ax2.grid(axis='y', alpha=0.3)
for i, v in enumerate(revenue_stats['high_delay_pct']):
    ax2.text(i, v + 1, f'{v:.1f}%', ha='center', fontweight='bold', fontsize=10)

# 3. State Analysis (Top 10)
ax3 = axes[1, 0]
state_stats = df.groupby('store_state').agg({
    'store_id': 'count',
    'avg_delay_minutes': 'mean'
}).reset_index()
state_stats.columns = ['state', 'count', 'avg_delay']
top_states = state_stats.nlargest(10, 'avg_delay')
ax3.barh(top_states['state'], top_states['avg_delay'], color='coral', alpha=0.7)
ax3.set_xlabel('Average Delay (minutes)', fontsize=11)
ax3.set_ylabel('State', fontsize=11)
ax3.set_title('Top 10 States by Average Delay', fontsize=13, fontweight='bold')
ax3.grid(axis='x', alpha=0.3)

# 4. Delivery Volume vs Delay Rate
ax4 = axes[1, 1]
# Use qcut without labels to avoid mismatch when duplicates are dropped
volume_bins = pd.qcut(df['total_deliveries'], q=5, duplicates='drop')
volume_stats = df.groupby(volume_bins, observed=True).agg({
    'store_delay_rate': 'mean',
    'store_id': 'count'
}).reset_index()
volume_stats.columns = ['volume', 'avg_delay_rate', 'count']
# Convert interval index to string for better display
volume_stats['volume'] = volume_stats['volume'].astype(str)
ax4.bar(volume_stats['volume'], volume_stats['avg_delay_rate'], color='teal', alpha=0.7)
ax4.set_ylabel('Average Delay Rate', fontsize=11)
ax4.set_xlabel('Delivery Volume Range', fontsize=11)
ax4.set_title('Delay Rate by Delivery Volume', fontsize=13, fontweight='bold')
ax4.grid(axis='y', alpha=0.3)
ax4.tick_params(axis='x', rotation=45, labelsize=9)
for i, v in enumerate(volume_stats['avg_delay_rate']):
    ax4.text(i, v + 0.005, f'{v:.3f}', ha='center', fontweight='bold', fontsize=9)

plt.suptitle('Regional & Segment Analysis', fontsize=16, fontweight='bold')
plt.tight_layout()
plt.show()

print("\n📍 Regional Insights:")
print(f"  • Regions analyzed: {df['region_id'].nunique()}")
print(f"  • States analyzed: {df['store_state'].nunique()}")
print(f"  • Highest delay region: {top_regions.iloc[0]['region_id']} ({top_regions.iloc[0]['avg_delay']:.1f} min)")
