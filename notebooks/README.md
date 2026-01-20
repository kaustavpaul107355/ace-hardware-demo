# ACE Hardware ML Feature Engineering Notebooks

## Overview

This directory contains ML feature engineering notebooks that prepare data from the gold layer tables for machine learning models.

## Notebooks

### `ace-ml-feature-process.py`

**Purpose**: Creates a comprehensive feature table for delivery delay prediction ML models.

**Data Sources** (from Gold Layer):
- `store_delay_metrics` - Store performance and delay patterns
- `vendor_performance` - Regional vendor reliability metrics
- `carrier_performance` - Overall carrier performance benchmarks
- `product_category_metrics` - Product-specific delay patterns

**Output Table**: `kaustavpaul_demo.ace_demo.ml_features_delivery_delay`

**Target Variable**: `high_delay_flag` 
- Binary classification: 1 if `avg_delay_minutes > 30`, else 0
- Predicts which stores are likely to experience high delivery delays

**Features Engineered** (30+ features):

1. **Store Performance Features**:
   - Store delay rate, average shipment value
   - Total deliveries, max delay minutes
   - Store location (lat/long), weekly revenue
   - Average temperature

2. **Regional Vendor Features**:
   - Vendor count by region
   - Regional vendor average delay
   - Regional vendor delay rate
   - High-risk vendor count
   - Total value delivered by region vendors

3. **Carrier Benchmark Features**:
   - Overall carrier average delay
   - Overall carrier max delay
   - Overall carrier delay rate

4. **Product Category Features**:
   - Temperature-controlled units (count & ratio)
   - Regional product average delay
   - Regional product average temperature

5. **Interaction Features**:
   - Store vs regional vendor delay difference
   - Store vs carrier delay difference  
   - Store vs regional vendor rate difference

**Notebook Sections**:

1. **Feature Table Creation** - SQL-based feature engineering with CTEs
2. **Data Preview** - Sample rows from feature table
3. **Summary Statistics** - Table schema and statistics
4. **Target Distribution** - Class balance analysis
5. **Feature Correlation** - Correlation with target variable
6. **Visualizations**:
   - Regional delay analysis
   - Revenue segment analysis
   - Temperature impact on delays
   - Vendor risk impact analysis
7. **Advanced Python Visualizations**:
   - Feature distribution comparisons
   - Correlation heatmaps
   - Regional & segment analysis
   - Multi-panel dashboards

**ML Use Cases**:

1. **Stockout Risk Prediction**: Predict which stores need safety stock due to delay risk
2. **Route Optimization**: Identify high-delay routes for carrier negotiations
3. **Vendor Selection**: Score vendors based on predicted impact on delays
4. **Inventory Planning**: Forecast delivery delays for replenishment timing

**Key Insights from Analysis**:

- High delay stores typically have:
  - Higher regional vendor delay rates
  - More high-risk vendors in their region
  - Higher temperature-controlled product ratios
  - Lower delivery volumes

- Strong positive correlations with high delay:
  - Regional vendor delay rate
  - Store delay rate (historical)
  - High-risk vendor count
  - Temperature-controlled ratio

**Next Steps** (as documented in notebook):

1. **Data Exploration**: Analyze feature distributions and correlations
2. **Feature Selection**: Identify most predictive features
3. **Model Training**: Train classification model (e.g., XGBoost, Random Forest)
4. **Model Evaluation**: Validate on held-out test set
5. **Model Deployment**: Register model in MLflow and deploy to serving endpoint
6. **Monitoring**: Track prediction accuracy and model drift

## Running the Notebooks

### In Databricks Workspace:

1. Navigate to `/Workspace/Users/kaustav.paul@databricks.com/ace-demo/notebooks/`
2. Open `ace-ml-feature-process`
3. Attach to a cluster with ML runtime (DBR 14.3 LTS ML or higher recommended)
4. Run all cells (Runtime: ~2-3 minutes depending on data size)

### Prerequisites:

- ✅ DLT pipeline must be run first to create gold tables
- ✅ Gold tables must contain data:
  - `store_delay_metrics`
  - `vendor_performance`
  - `carrier_performance`
  - `product_category_metrics`

### Cluster Requirements:

- **Runtime**: Databricks Runtime 14.3 LTS ML or higher
- **Node Type**: Standard_DS3_v2 or equivalent (8 GB memory minimum)
- **Workers**: 2-4 workers recommended for visualization performance
- **Libraries**: Pre-installed in ML runtime (pandas, matplotlib, seaborn, numpy)

## Feature Table Schema

The output `ml_features_delivery_delay` table contains:

- **5** identifier/categorical columns (store_id, store_name, city, state, region)
- **25+** numerical features
- **1** binary target variable (`high_delay_flag`)

Total: ~30 columns ready for ML model training

## Integration with ML Workflows

This feature table can be used with:

1. **Databricks AutoML**: Automated model training
2. **MLflow**: Model tracking and registry
3. **Feature Store**: For feature reuse across models
4. **Model Serving**: Real-time or batch inference

## Updates

**Last Modified**: January 20, 2026  
**Version**: 1.0  
**Author**: Databricks Field Engineering
