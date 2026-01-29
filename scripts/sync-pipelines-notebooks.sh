#!/bin/bash
# sync-pipelines-notebooks.sh
# Syncs pipelines, notebooks, and scripts between local and Databricks Workspace
# Usage: ./sync-pipelines-notebooks.sh [PROFILE]

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Default values
PROFILE=${1:-e2-demo-field}
EMAIL="kaustav.paul@databricks.com"
WORKSPACE_PATH="/Workspace/Users/$EMAIL/ace-demo"
LOCAL_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}📦 Syncing ACE Demo Pipelines & Notebooks to Workspace${NC}"
echo "=========================================================="
echo "Profile: $PROFILE"
echo "Local: $LOCAL_PATH"
echo "Remote: $WORKSPACE_PATH"
echo ""

# Create workspace directories if they don't exist
echo -e "${YELLOW}Creating workspace directories...${NC}"
databricks workspace mkdirs "$WORKSPACE_PATH" --profile "$PROFILE" 2>/dev/null || true
databricks workspace mkdirs "$WORKSPACE_PATH/pipelines" --profile "$PROFILE" 2>/dev/null || true
databricks workspace mkdirs "$WORKSPACE_PATH/pipelines/config" --profile "$PROFILE" 2>/dev/null || true
databricks workspace mkdirs "$WORKSPACE_PATH/pipelines/transform" --profile "$PROFILE" 2>/dev/null || true
databricks workspace mkdirs "$WORKSPACE_PATH/pipelines/analytics" --profile "$PROFILE" 2>/dev/null || true
databricks workspace mkdirs "$WORKSPACE_PATH/notebooks" --profile "$PROFILE" 2>/dev/null || true
databricks workspace mkdirs "$WORKSPACE_PATH/scripts" --profile "$PROFILE" 2>/dev/null || true

# Sync files
echo -e "${YELLOW}Syncing files to workspace...${NC}"
echo ""

# 1. Sync pipelines/config
if [ -d "$LOCAL_PATH/pipelines/config" ]; then
    echo "  ✓ Syncing pipelines/config/..."
    databricks workspace import-dir \
      "$LOCAL_PATH/pipelines/config" \
      "$WORKSPACE_PATH/pipelines/config" \
      --overwrite \
      --profile "$PROFILE"
fi

# 2. Sync pipelines/transform
if [ -d "$LOCAL_PATH/pipelines/transform" ]; then
    echo "  ✓ Syncing pipelines/transform/..."
    databricks workspace import-dir \
      "$LOCAL_PATH/pipelines/transform" \
      "$WORKSPACE_PATH/pipelines/transform" \
      --overwrite \
      --profile "$PROFILE"
fi

# 3. Sync pipelines/analytics
if [ -d "$LOCAL_PATH/pipelines/analytics" ]; then
    echo "  ✓ Syncing pipelines/analytics/..."
    databricks workspace import-dir \
      "$LOCAL_PATH/pipelines/analytics" \
      "$WORKSPACE_PATH/pipelines/analytics" \
      --overwrite \
      --profile "$PROFILE"
fi

# 4. Sync notebooks
if [ -d "$LOCAL_PATH/notebooks" ]; then
    echo "  ✓ Syncing notebooks/..."
    databricks workspace import-dir \
      "$LOCAL_PATH/notebooks" \
      "$WORKSPACE_PATH/notebooks" \
      --overwrite \
      --profile "$PROFILE"
fi

# 5. Sync scripts
if [ -d "$LOCAL_PATH/scripts" ]; then
    echo "  ✓ Syncing scripts/..."
    # Only sync Python files from scripts
    for file in "$LOCAL_PATH/scripts"/*.py; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            echo "    - $filename"
            databricks workspace import \
              "$WORKSPACE_PATH/scripts/$filename" \
              --file "$file" \
              --format AUTO \
              --overwrite \
              --profile "$PROFILE"
        fi
    done
fi

# 6. Sync README
if [ -f "$LOCAL_PATH/README.md" ]; then
    echo "  ✓ Syncing README.md..."
    databricks workspace import \
      "$WORKSPACE_PATH/README.md" \
      --file "$LOCAL_PATH/README.md" \
      --format AUTO \
      --overwrite \
      --profile "$PROFILE"
fi

echo ""
echo -e "${GREEN}✅ Sync complete!${NC}"
echo ""
echo "Files synced to: $WORKSPACE_PATH"
echo ""
echo "Verify sync:"
echo "  databricks workspace list $WORKSPACE_PATH --profile $PROFILE"
echo ""
echo "View in browser:"
echo "  https://e2-demo-field-eng.cloud.databricks.com/workspace$WORKSPACE_PATH"
echo ""
