# Alternative Solutions for Hardcoded Path Issues

## Issue 1: Hardcoded Workspace Paths

**Current Problem**:
```python
# pipelines/transform/bronze_logistics.py:9
sys.path.insert(0, '/Workspace/Users/kaustav.paul@databricks.com/ace-demo/pipelines')
```

---

### **Alternative 1: Environment Variables (Recommended for Shared Demos)**

**Approach**: Use DLT pipeline configuration + environment variables

**Implementation**:
```python
# pipelines/transform/bronze_logistics.py
import dlt
import sys
import os

# Get workspace path from DLT configuration or environment
WORKSPACE_PATH = spark.conf.get("WORKSPACE_PATH", os.getenv("WORKSPACE_PATH"))
sys.path.insert(0, f'{WORKSPACE_PATH}/pipelines')

from config.config import LOGISTICS_SCHEMA, TELEMETRY_PATH, TELEMETRY_CHECKPOINT
```

**Pipeline Config**:
```json
{
  "configuration": {
    "WORKSPACE_PATH": "/Workspace/Users/${current_user}/ace-demo"
  }
}
```

**Pros**:
- ✅ Works across different users automatically
- ✅ Easy to override for different environments
- ✅ Standard Databricks pattern
- ✅ No code changes needed per user

**Cons**:
- ⚠️ Requires updating pipeline_config.json
- ⚠️ Users must understand DLT configuration

**Best For**: Production deployments, shared demos, multi-user environments

---

### **Alternative 2: Dynamic Path Resolution (Zero Configuration)**

**Approach**: Calculate workspace path dynamically using `dbutils`

**Implementation**:
```python
# pipelines/transform/bronze_logistics.py
import dlt
import sys

# Dynamically determine workspace path from notebook context
def get_workspace_root():
    """Auto-detect workspace path from current notebook location"""
    try:
        # Get current notebook path
        notebook_path = dbutils.notebook.entry_point.getDbutils().notebook().getContext().notebookPath().get()
        # Extract workspace root (everything before /pipelines/)
        if '/pipelines/' in notebook_path:
            return notebook_path.split('/pipelines/')[0]
        else:
            # Fallback: assume standard structure
            return '/'.join(notebook_path.split('/')[:-2])
    except:
        # Fallback for local development or testing
        return '/Workspace/Users/kaustav.paul@databricks.com/ace-demo'

WORKSPACE_ROOT = get_workspace_root()
sys.path.insert(0, f'{WORKSPACE_ROOT}/pipelines')

from config.config import LOGISTICS_SCHEMA, TELEMETRY_PATH, TELEMETRY_CHECKPOINT
```

**Pros**:
- ✅ Zero configuration required
- ✅ Works for any user automatically
- ✅ Self-contained solution
- ✅ No pipeline config changes needed

**Cons**:
- ⚠️ Relies on `dbutils` (not available in local testing)
- ⚠️ Slightly more complex logic
- ⚠️ Harder to override for custom deployments

**Best For**: Quick demos, user-shared notebooks, minimal setup scenarios

---

### **Alternative 3: Relative Imports (Cleanest Approach)**

**Approach**: Restructure code to avoid `sys.path` manipulation entirely

**Implementation**:

**Option 3A: Use Databricks-style relative imports**
```python
# pipelines/transform/bronze_logistics.py
import dlt
from pipelines.config.config import LOGISTICS_SCHEMA, TELEMETRY_PATH, TELEMETRY_CHECKPOINT

# Rest of code...
```

**Pipeline Config** (key addition):
```json
{
  "configuration": {
    "spark.databricks.python.path": "/Workspace/Users/${current_user}/ace-demo"
  }
}
```

**Option 3B: Package-based approach**
```bash
# Restructure as a proper Python package
ace-hardware-demo/
├── setup.py  # New file
├── ace_demo/  # Rename pipelines/
│   ├── __init__.py
│   ├── config/
│   ├── transform/
│   └── analytics/
```

```python
# setup.py
from setuptools import setup, find_packages

setup(
    name="ace-demo",
    version="1.0.0",
    packages=find_packages(),
    install_requires=['pyspark>=3.5.0']
)
```

```python
# pipelines/transform/bronze_logistics.py
import dlt
from ace_demo.config.config import LOGISTICS_SCHEMA, TELEMETRY_PATH, TELEMETRY_CHECKPOINT
```

**Pros**:
- ✅ No `sys.path` manipulation (cleaner)
- ✅ Standard Python packaging
- ✅ Works in local testing and Databricks
- ✅ Better for version control and distribution

**Cons**:
- ⚠️ Requires restructuring project
- ⚠️ More setup overhead (pip install, wheel building)
- ⚠️ Overkill for simple demos

**Best For**: Production codebases, reusable packages, complex projects

---

### **Alternative 4: Symbolic Constants File**

**Approach**: Create a separate paths configuration file

**Implementation**:
```python
# pipelines/workspace_config.py (NEW FILE)
import os

# Detect current user from environment or use default
CURRENT_USER = os.getenv("DATABRICKS_USER", "kaustav.paul@databricks.com")
WORKSPACE_ROOT = f"/Workspace/Users/{CURRENT_USER}/ace-demo"

# Derived paths
PIPELINES_ROOT = f"{WORKSPACE_ROOT}/pipelines"
```

```python
# pipelines/transform/bronze_logistics.py
import dlt
import sys
from pipelines.workspace_config import PIPELINES_ROOT

sys.path.insert(0, PIPELINES_ROOT)
from config.config import LOGISTICS_SCHEMA, TELEMETRY_PATH, TELEMETRY_CHECKPOINT
```

**Pros**:
- ✅ Centralized path management
- ✅ Easy to find and update
- ✅ Single file to modify per deployment
- ✅ Can include other workspace-specific configs

**Cons**:
- ⚠️ Still requires one file to be edited
- ⚠️ `DATABRICKS_USER` env var might not be set
- ⚠️ Adds extra import

**Best For**: Teams with standardized workspace structure, mid-size projects

---

### **Alternative 5: Workspace Init Script**

**Approach**: Use Databricks init scripts to set PYTHONPATH globally

**Implementation**:

**Create init script**:
```bash
# /Workspace/Shared/init-scripts/ace-demo-pythonpath.sh
#!/bin/bash

# Set PYTHONPATH for all notebooks in workspace
export PYTHONPATH="$PYTHONPATH:/Workspace/Users/${DB_USER}/ace-demo/pipelines"
```

**Configure cluster/pipeline** to use this init script

**Pipeline code** (no sys.path needed):
```python
# pipelines/transform/bronze_logistics.py
import dlt
from config.config import LOGISTICS_SCHEMA, TELEMETRY_PATH, TELEMETRY_CHECKPOINT
# Works because PYTHONPATH is set globally
```

**Pros**:
- ✅ Code is cleanest (no path manipulation)
- ✅ Applies to all notebooks on cluster
- ✅ One-time cluster setup

**Cons**:
- ⚠️ Requires cluster admin access
- ⚠️ Hidden configuration (not obvious from code)
- ⚠️ Harder to debug if misconfigured

**Best For**: Organization-wide deployments, enterprise environments

---

### **Comparison Table: Workspace Path Solutions**

| Solution | Setup Complexity | Code Cleanliness | Portability | Best Use Case |
|----------|------------------|------------------|-------------|---------------|
| **Alt 1: Env Variables** | 🟡 Medium | 🟢 Good | ⭐⭐⭐⭐⭐ | **Recommended Default** |
| **Alt 2: Dynamic Resolution** | 🟢 Low | 🟡 Medium | ⭐⭐⭐⭐ | Quick demos |
| **Alt 3: Relative Imports** | 🔴 High | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Production apps |
| **Alt 4: Symbolic Constants** | 🟢 Low | 🟡 Medium | ⭐⭐⭐ | Team projects |
| **Alt 5: Init Scripts** | 🔴 High | ⭐⭐⭐⭐⭐ | ⭐⭐ | Enterprise |

---

## Issue 2: Pipeline Config Uses Old Paths

**Current Problem**:
```json
{
  "libraries": [
    {
      "notebook": {
        "path": "/Workspace/Users/.../pipelines/bronze_logistics.py"
      }
    }
  ]
}
```

**Should reference**: `/pipelines/transform/bronze_logistics.py`

---

### **Alternative 1: Manual Update (Simple Fix)**

**Approach**: Directly edit `pipeline_config.json`

**Implementation**:
```json
{
  "name": "ace_logistics_pipeline",
  "catalog": "kaustavpaul_demo",
  "target": "ace_demo",
  "libraries": [
    {
      "notebook": {
        "path": "/Workspace/Users/kaustav.paul@databricks.com/ace-demo/pipelines/transform/bronze_logistics.py"
      }
    },
    {
      "notebook": {
        "path": "/Workspace/Users/kaustav.paul@databricks.com/ace-demo/pipelines/transform/bronze_dimensions.py"
      }
    },
    {
      "notebook": {
        "path": "/Workspace/Users/kaustav.paul@databricks.com/ace-demo/pipelines/transform/silver_logistics.py"
      }
    },
    {
      "notebook": {
        "path": "/Workspace/Users/kaustav.paul@databricks.com/ace-demo/pipelines/transform/gold_flo_metrics.py"
      }
    },
    {
      "notebook": {
        "path": "/Workspace/Users/kaustav.paul@databricks.com/ace-demo/pipelines/analytics/analytics_views.sql"
      }
    }
  ]
}
```

**Pros**:
- ✅ Immediate fix (5 minutes)
- ✅ No code changes
- ✅ Clear and explicit

**Cons**:
- ⚠️ Still has hardcoded username
- ⚠️ Manual process
- ⚠️ Easy to forget when adding new notebooks

**Best For**: Quick fix while planning longer-term solution

---

### **Alternative 2: Templated Config with Variables**

**Approach**: Use environment variables in config file

**Implementation**:

**Create**: `pipeline_config.template.json`
```json
{
  "name": "ace_logistics_pipeline",
  "catalog": "${CATALOG}",
  "target": "${SCHEMA}",
  "libraries": [
    {
      "notebook": {
        "path": "${WORKSPACE_PATH}/pipelines/transform/bronze_logistics.py"
      }
    },
    {
      "notebook": {
        "path": "${WORKSPACE_PATH}/pipelines/transform/bronze_dimensions.py"
      }
    },
    {
      "notebook": {
        "path": "${WORKSPACE_PATH}/pipelines/transform/silver_logistics.py"
      }
    },
    {
      "notebook": {
        "path": "${WORKSPACE_PATH}/pipelines/transform/gold_flo_metrics.py"
      }
    },
    {
      "notebook": {
        "path": "${WORKSPACE_PATH}/pipelines/analytics/analytics_views.sql"
      }
    }
  ],
  "configuration": {
    "WORKSPACE_PATH": "${WORKSPACE_PATH}"
  }
}
```

**Create setup script**: `scripts/setup_pipeline_config.sh`
```bash
#!/bin/bash

# Get user input or use defaults
CATALOG=${CATALOG:-"kaustavpaul_demo"}
SCHEMA=${SCHEMA:-"ace_demo"}
WORKSPACE_USER=${DATABRICKS_USER:-"kaustav.paul@databricks.com"}
WORKSPACE_PATH="/Workspace/Users/${WORKSPACE_USER}/ace-demo"

# Generate pipeline_config.json from template
sed -e "s|\${CATALOG}|${CATALOG}|g" \
    -e "s|\${SCHEMA}|${SCHEMA}|g" \
    -e "s|\${WORKSPACE_PATH}|${WORKSPACE_PATH}|g" \
    pipeline_config.template.json > pipeline_config.json

echo "✅ Generated pipeline_config.json for user: ${WORKSPACE_USER}"
```

**Usage**:
```bash
# User runs once during setup
./scripts/setup_pipeline_config.sh
```

**Pros**:
- ✅ Template is portable
- ✅ Easy to regenerate for different users
- ✅ Keeps original as template
- ✅ Can version-control template

**Cons**:
- ⚠️ Requires running setup script
- ⚠️ Generated file must be in .gitignore
- ⚠️ Extra step for users

**Best For**: Multi-user demos, different environment deployments

---

### **Alternative 3: Use Databricks CLI to Create Pipeline**

**Approach**: Don't use JSON file at all - create pipeline via CLI

**Implementation**:

**Create**: `scripts/create_pipeline.sh`
```bash
#!/bin/bash

# Load configuration
source .env

CATALOG="${CATALOG:-kaustavpaul_demo}"
SCHEMA="${SCHEMA:-ace_demo}"
WORKSPACE_PATH="${WORKSPACE_PATH:-/Workspace/Users/${DATABRICKS_USER}/ace-demo}"

# Create DLT pipeline using Databricks CLI
databricks pipelines create \
  --name "ace_logistics_pipeline" \
  --catalog "$CATALOG" \
  --target "$SCHEMA" \
  --notebook "$WORKSPACE_PATH/pipelines/transform/bronze_logistics.py" \
  --notebook "$WORKSPACE_PATH/pipelines/transform/bronze_dimensions.py" \
  --notebook "$WORKSPACE_PATH/pipelines/transform/silver_logistics.py" \
  --notebook "$WORKSPACE_PATH/pipelines/transform/gold_flo_metrics.py" \
  --notebook "$WORKSPACE_PATH/pipelines/analytics/analytics_views.sql" \
  --continuous false \
  --channel "PREVIEW" \
  --configuration "WORKSPACE_PATH=$WORKSPACE_PATH" \
  > pipeline_id.txt

echo "✅ Pipeline created with ID: $(cat pipeline_id.txt)"
echo "View at: ${DATABRICKS_HOST}/pipelines/$(cat pipeline_id.txt)"
```

**Pros**:
- ✅ No JSON file needed
- ✅ Fully programmatic
- ✅ Easy to automate
- ✅ Can include in setup automation

**Cons**:
- ⚠️ Requires Databricks CLI installed
- ⚠️ No visual config file to reference
- ⚠️ Pipeline updates require CLI commands

**Best For**: CI/CD pipelines, automated deployments, infrastructure as code

---

### **Alternative 4: Databricks Asset Bundles (DABs)**

**Approach**: Use modern Databricks Asset Bundle format

**Implementation**:

**Create**: `databricks.yml`
```yaml
bundle:
  name: ace-hardware-demo

workspace:
  host: ${DATABRICKS_HOST}

variables:
  catalog:
    default: kaustavpaul_demo
    description: Unity Catalog name
  
  schema:
    default: ace_demo
    description: Schema name
  
  workspace_path:
    default: /Workspace/Users/${workspace.current_user.userName}/ace-demo
    description: Workspace root path

resources:
  pipelines:
    ace_logistics_pipeline:
      name: ace_logistics_pipeline
      catalog: ${var.catalog}
      target: ${var.schema}
      
      libraries:
        - notebook:
            path: ${var.workspace_path}/pipelines/transform/bronze_logistics.py
        - notebook:
            path: ${var.workspace_path}/pipelines/transform/bronze_dimensions.py
        - notebook:
            path: ${var.workspace_path}/pipelines/transform/silver_logistics.py
        - notebook:
            path: ${var.workspace_path}/pipelines/transform/gold_flo_metrics.py
        - notebook:
            path: ${var.workspace_path}/pipelines/analytics/analytics_views.sql
      
      clusters:
        - label: default
          autoscale:
            min_workers: 1
            max_workers: 5
            mode: ENHANCED
      
      configuration:
        WORKSPACE_PATH: ${var.workspace_path}
      
      continuous: false
      channel: PREVIEW
      photon: false

targets:
  dev:
    mode: development
    workspace:
      host: https://e2-demo-field-eng.cloud.databricks.com
  
  prod:
    mode: production
    workspace:
      host: ${DATABRICKS_HOST}
```

**Deployment**:
```bash
# Validate bundle
databricks bundle validate

# Deploy to dev
databricks bundle deploy -t dev

# Deploy to prod
databricks bundle deploy -t prod
```

**Pros**:
- ✅ Modern Databricks standard
- ✅ Automatic user resolution (`${workspace.current_user.userName}`)
- ✅ Environment management (dev/prod)
- ✅ Full workspace deployment (notebooks, jobs, pipelines)
- ✅ Validation before deployment

**Cons**:
- ⚠️ Requires learning new format
- ⚠️ More complex initial setup
- ⚠️ Requires Databricks CLI v0.200+

**Best For**: Modern Databricks projects, production deployments, enterprise

---

### **Alternative 5: Python-based Configuration**

**Approach**: Generate config from Python script

**Implementation**:

**Create**: `scripts/generate_pipeline_config.py`
```python
#!/usr/bin/env python3
import json
import os
from pathlib import Path

def generate_pipeline_config(
    catalog: str = "kaustavpaul_demo",
    schema: str = "ace_demo",
    workspace_user: str = None,
):
    """Generate pipeline_config.json for current user/environment"""
    
    # Auto-detect user if not provided
    if workspace_user is None:
        workspace_user = os.getenv("DATABRICKS_USER", "kaustav.paul@databricks.com")
    
    workspace_path = f"/Workspace/Users/{workspace_user}/ace-demo"
    
    # Define pipeline structure
    notebooks = [
        "pipelines/transform/bronze_logistics.py",
        "pipelines/transform/bronze_dimensions.py",
        "pipelines/transform/silver_logistics.py",
        "pipelines/transform/gold_flo_metrics.py",
        "pipelines/analytics/analytics_views.sql",
    ]
    
    config = {
        "name": "ace_logistics_pipeline",
        "catalog": catalog,
        "target": schema,
        "clusters": [
            {
                "label": "default",
                "autoscale": {
                    "min_workers": 1,
                    "max_workers": 5,
                    "mode": "ENHANCED"
                }
            }
        ],
        "libraries": [
            {"notebook": {"path": f"{workspace_path}/{nb}"}}
            for nb in notebooks
        ],
        "configuration": {
            "WORKSPACE_PATH": workspace_path,
            "TELEMETRY_PATH": f"/Volumes/{catalog}/{schema}/ace_files/data/telemetry/",
            "DIMENSIONS_PATH": f"/Volumes/{catalog}/{schema}/ace_files/data/dimensions",
        },
        "channel": "PREVIEW",
        "photon": False,
        "continuous": False
    }
    
    # Write to file
    output_path = Path(__file__).parent.parent / "pipeline_config.json"
    with open(output_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"✅ Generated {output_path}")
    print(f"   User: {workspace_user}")
    print(f"   Catalog: {catalog}")
    print(f"   Schema: {schema}")
    
    return config

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Generate DLT pipeline config")
    parser.add_argument("--catalog", default="kaustavpaul_demo")
    parser.add_argument("--schema", default="ace_demo")
    parser.add_argument("--user", help="Databricks username (email)")
    
    args = parser.parse_args()
    generate_pipeline_config(args.catalog, args.schema, args.user)
```

**Usage**:
```bash
# Generate for current user
python scripts/generate_pipeline_config.py

# Generate for specific user
python scripts/generate_pipeline_config.py --user john.doe@company.com

# Generate for different catalog/schema
python scripts/generate_pipeline_config.py --catalog my_catalog --schema my_schema
```

**Pros**:
- ✅ Type-safe configuration
- ✅ Easy to add validation logic
- ✅ Can auto-detect environment
- ✅ Programmatic and extensible
- ✅ No external dependencies

**Cons**:
- ⚠️ Requires running Python script
- ⚠️ One more tool in the chain

**Best For**: Python-heavy teams, custom validation needs, complex configs

---

### **Comparison Table: Pipeline Config Solutions**

| Solution | Setup Time | Maintenance | Automation | Best Use Case |
|----------|-----------|-------------|------------|---------------|
| **Alt 1: Manual Update** | 5 min | Low | ❌ None | Quick fix |
| **Alt 2: Template + Script** | 15 min | Medium | 🟡 Bash | **Recommended** |
| **Alt 3: Databricks CLI** | 10 min | Low | ✅ Full | CI/CD pipelines |
| **Alt 4: Asset Bundles** | 30 min | Low | ⭐⭐⭐⭐⭐ | **Modern standard** |
| **Alt 5: Python Generator** | 20 min | Medium | ✅ Full | Custom validation |

---

## Recommended Combination

For **maximum portability and ease of use**, I recommend:

### For Workspace Paths:
**Use Alternative 1 (Environment Variables)** + **Alternative 2 (Dynamic Resolution) as fallback**

```python
# pipelines/transform/bronze_logistics.py
import dlt
import sys
import os

def get_workspace_path():
    """Get workspace path with multiple fallback options"""
    # Option 1: From DLT pipeline configuration
    try:
        workspace_path = spark.conf.get("WORKSPACE_PATH")
        if workspace_path:
            return workspace_path
    except:
        pass
    
    # Option 2: From environment variable
    workspace_path = os.getenv("WORKSPACE_PATH")
    if workspace_path:
        return workspace_path
    
    # Option 3: Auto-detect from notebook context
    try:
        notebook_path = dbutils.notebook.entry_point.getDbutils().notebook().getContext().notebookPath().get()
        if '/pipelines/' in notebook_path:
            return notebook_path.split('/pipelines/')[0]
    except:
        pass
    
    # Option 4: Fallback to default (for local testing)
    return '/Workspace/Users/kaustav.paul@databricks.com/ace-demo'

WORKSPACE_PATH = get_workspace_path()
sys.path.insert(0, f'{WORKSPACE_PATH}/pipelines')

from config.config import LOGISTICS_SCHEMA, TELEMETRY_PATH, TELEMETRY_CHECKPOINT
```

### For Pipeline Config:
**Use Alternative 2 (Template + Script)** for now, plan migration to **Alternative 4 (DABs)** for future

This gives you:
- ✅ Works out-of-box for most users (dynamic detection)
- ✅ Easy to override when needed (env vars)
- ✅ Portable config generation (template)
- ✅ Future-ready for modern Databricks (DABs migration path)

---

## Implementation Priority

1. **Immediate** (5 min): Manual update pipeline_config.json paths
2. **Phase 1** (30 min): Add dynamic workspace path detection
3. **Phase 2** (1 hour): Create config template + generation script
4. **Phase 3** (Future): Migrate to Databricks Asset Bundles

---

Would you like me to implement any of these alternatives?
