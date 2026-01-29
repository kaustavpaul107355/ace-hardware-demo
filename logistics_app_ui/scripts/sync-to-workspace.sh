#!/bin/bash
# sync-to-workspace.sh
# Syncs local code to Databricks Workspace for app deployment
# Usage: ./scripts/sync-to-workspace.sh [PROFILE] [EMAIL]

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Default values
PROFILE=${1:-e2-demo-field}
EMAIL=${2:-kaustav.paul@databricks.com}
WORKSPACE_PATH="/Workspace/Users/$EMAIL/ace-demo/app"
LOCAL_PATH="$(pwd)"

echo -e "${BLUE}📁 Syncing ACE Logistics Dashboard to Workspace${NC}"
echo "=================================================="
echo "Profile: $PROFILE"
echo "Local: $LOCAL_PATH"
echo "Remote: $WORKSPACE_PATH"
echo ""

# Build frontend first
echo -e "${YELLOW}Building frontend...${NC}"
npm run build

# Create workspace directory if it doesn't exist
echo -e "${YELLOW}Creating workspace directory...${NC}"
databricks workspace mkdirs "$WORKSPACE_PATH" --profile "$PROFILE" 2>/dev/null || true

# Sync files
echo -e "${YELLOW}Syncing files to workspace...${NC}"

# Sync app.yaml
echo "  ✓ Syncing app.yaml..."
databricks workspace import \
  "$WORKSPACE_PATH/app.yaml" \
  --file "$LOCAL_PATH/app.yaml" \
  --format AUTO \
  --overwrite \
  --profile "$PROFILE"

# Sync backend
echo "  ✓ Syncing backend/..."
databricks workspace import-dir \
  "$LOCAL_PATH/backend" \
  "$WORKSPACE_PATH/backend" \
  --overwrite \
  --profile "$PROFILE"

# Sync built frontend
echo "  ✓ Syncing dist/ (built frontend)..."
databricks workspace import-dir \
  "$LOCAL_PATH/dist" \
  "$WORKSPACE_PATH/dist" \
  --overwrite \
  --profile "$PROFILE"

# Sync requirements (done via import-dir, so skip this redundant step)
# echo "  ✓ Syncing requirements.txt..."

echo ""
echo -e "${GREEN}✅ Sync complete!${NC}"
echo ""
echo "Files synced to: $WORKSPACE_PATH"
echo ""
echo "Next steps:"
echo "  1. Review files: databricks workspace list $WORKSPACE_PATH --profile $PROFILE"
echo "  2. Deploy app: ./scripts/deploy-app.sh $PROFILE $EMAIL ace-supply-chain-app"
