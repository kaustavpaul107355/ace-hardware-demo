#!/bin/bash
# sync-all.sh
# Master sync script - syncs ALL components (pipelines, notebooks, scripts, and app)
# Usage: ./sync-all.sh [PROFILE] [deploy_app]

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Default values
PROFILE=${1:-e2-demo-field}
DEPLOY_APP=${2:-no}
EMAIL="kaustav.paul@databricks.com"
APP_NAME="ace-supply-chain-app"

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                 ACE DEMO - MASTER SYNC                        ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Profile: $PROFILE"
echo "Deploy App: $DEPLOY_APP"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACE_DEMO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${YELLOW}📁 Working Directory: $ACE_DEMO_ROOT${NC}"
echo ""

# ============================================================================
# STEP 1: Sync Pipelines, Notebooks, and Scripts
# ============================================================================
echo -e "${BLUE}[1/3] Syncing Pipelines, Notebooks & Scripts...${NC}"
echo "──────────────────────────────────────────────────────────────"

if [ -f "$ACE_DEMO_ROOT/scripts/sync-pipelines-notebooks.sh" ]; then
    cd "$ACE_DEMO_ROOT"
    ./scripts/sync-pipelines-notebooks.sh "$PROFILE"
    echo ""
else
    echo -e "${RED}❌ Pipeline sync script not found!${NC}"
    exit 1
fi

# ============================================================================
# STEP 2: Sync App (UI + Backend)
# ============================================================================
echo -e "${BLUE}[2/3] Syncing Databricks App (UI + Backend)...${NC}"
echo "──────────────────────────────────────────────────────────────"

APP_DIR="$ACE_DEMO_ROOT/logistics_app_ui"
if [ -d "$APP_DIR" ] && [ -f "$APP_DIR/scripts/sync-to-workspace.sh" ]; then
    cd "$APP_DIR"
    ./scripts/sync-to-workspace.sh "$PROFILE" "$EMAIL"
    echo ""
else
    echo -e "${RED}❌ App sync script not found!${NC}"
    exit 1
fi

# ============================================================================
# STEP 3: Deploy App (Optional)
# ============================================================================
if [ "$DEPLOY_APP" = "yes" ] || [ "$DEPLOY_APP" = "y" ]; then
    echo -e "${BLUE}[3/3] Deploying Databricks App...${NC}"
    echo "──────────────────────────────────────────────────────────────"
    
    databricks apps deploy "$APP_NAME" \
      --source-code-path "/Workspace/Users/$EMAIL/ace-demo/app" \
      --profile "$PROFILE"
    
    echo ""
    echo -e "${GREEN}✅ App deployed successfully!${NC}"
    echo ""
    echo "App URL: https://ace-supply-chain-app-1444828305810485.aws.databricksapps.com"
else
    echo -e "${BLUE}[3/3] Skipping App Deployment${NC}"
    echo "──────────────────────────────────────────────────────────────"
    echo "To deploy the app, run:"
    echo "  ./sync-all.sh $PROFILE yes"
fi

echo ""
echo "══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ SYNC COMPLETE!${NC}"
echo "══════════════════════════════════════════════════════════════"
echo ""
echo "📊 Synced Components:"
echo "  ✅ Pipelines (Bronze → Silver → Gold)"
echo "  ✅ Notebooks (ML Feature Processing)"
echo "  ✅ Scripts (Data Generation)"
echo "  ✅ App Backend (Python HTTP Server)"
echo "  ✅ App Frontend (React UI)"
echo ""
echo "🔗 View in Workspace:"
echo "  https://e2-demo-field-eng.cloud.databricks.com/workspace/Workspace/Users/$EMAIL/ace-demo"
echo ""

if [ "$DEPLOY_APP" != "yes" ] && [ "$DEPLOY_APP" != "y" ]; then
    echo "💡 To also deploy the app, run:"
    echo "  ./scripts/sync-all.sh $PROFILE yes"
    echo ""
fi
