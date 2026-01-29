#!/bin/bash
# deploy-app.sh
# Deploys ACE Logistics Dashboard to Databricks Apps platform
# Usage: ./scripts/deploy-app.sh [PROFILE] [EMAIL] [APP_NAME]

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
PROFILE=${1:-e2-demo-field}
EMAIL=${2:-kaustav.paul@databricks.com}
APP_NAME=${3:-ace-supply-chain-app}

echo -e "${BLUE}🚀 Deploying ACE Supply Chain Dashboard to Databricks Apps${NC}"
echo "=================================================="
echo "Profile: $PROFILE"
echo "User: $EMAIL"
echo "App: $APP_NAME"
echo ""

# Check if workspace is ready
WORKSPACE_PATH="/Workspace/Users/$EMAIL/ace-demo/app"
echo -e "${YELLOW}Checking workspace...${NC}"

# Deploy app
echo -e "\n${YELLOW}Initiating deployment...${NC}"
echo "This may take 20-60 seconds..."

START_TIME=$(date +%s)

databricks apps deploy "$APP_NAME" \
  --source-code-path "$WORKSPACE_PATH" \
  --profile "$PROFILE"

DEPLOY_EXIT_CODE=$?
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "=================================================="

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment initiated successfully!${NC}"
    echo -e "${GREEN}   Duration: ${DURATION}s${NC}"
    echo ""
    echo "Checking deployment status..."
    sleep 5
    
    # Check app status
    STATUS=$(databricks apps get "$APP_NAME" --profile "$PROFILE" --output json 2>/dev/null | jq -r '.active_deployment.status.state // "UNKNOWN"')
    
    if [ "$STATUS" = "SUCCEEDED" ]; then
        echo -e "${GREEN}✅ App is RUNNING${NC}"
        APP_URL=$(databricks apps get "$APP_NAME" --profile "$PROFILE" --output json 2>/dev/null | jq -r '.url // "unknown"')
        echo -e "${GREEN}   URL: $APP_URL${NC}"
    elif [ "$STATUS" = "IN_PROGRESS" ]; then
        echo -e "${YELLOW}⏳ Deployment in progress...${NC}"
        echo "   Check status: databricks apps get $APP_NAME --profile $PROFILE"
    else
        echo -e "${YELLOW}⚠️  Status: $STATUS${NC}"
        echo "   Check logs: databricks apps get $APP_NAME --profile $PROFILE"
    fi
    
    exit 0
else
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "   Check app status: databricks apps get $APP_NAME --profile $PROFILE"
    exit 1
fi
