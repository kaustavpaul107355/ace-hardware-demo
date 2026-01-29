#!/bin/bash

# ACE Logistics Dashboard - Quick Start Script
# This script helps you set up and run the dashboard quickly

set -e  # Exit on error

echo "🚀 ACE Hardware Logistics Dashboard - Quick Start"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the logistics_app_ui directory${NC}"
    exit 1
fi

echo "Step 1: Installing Frontend Dependencies"
echo "----------------------------------------"
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi
echo ""

echo "Step 2: Installing Backend Dependencies"
echo "---------------------------------------"
cd backend
if [ ! -d "../venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv ../venv
    source ../venv/bin/activate
    echo "Installing Python packages..."
    pip install -r requirements.txt
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
    source ../venv/bin/activate
fi
cd ..
echo ""

echo "Step 3: Environment Configuration"
echo "---------------------------------"
if [ ! -f ".env" ]; then
    echo "Creating frontend .env file..."
    cp .env.example .env
    echo -e "${GREEN}✓ Frontend .env created${NC}"
else
    echo -e "${GREEN}✓ Frontend .env already exists${NC}"
fi

if [ ! -f "backend/.env" ]; then
    echo "Creating backend .env file..."
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}⚠ Please edit backend/.env with your Databricks credentials!${NC}"
    echo ""
    echo "Required values:"
    echo "  - DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/your-warehouse-id"
    echo "  - DATABRICKS_ACCESS_TOKEN=dapi1234567890abcdef"
    echo ""
    read -p "Press Enter after you've updated backend/.env..."
else
    echo -e "${GREEN}✓ Backend .env already exists${NC}"
fi
echo ""

echo "Step 4: Testing Backend Connection"
echo "-----------------------------------"
echo "Starting backend API (will run for 5 seconds to test)..."
cd backend
timeout 5 python app.py > /tmp/ace-backend.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 2

# Test health endpoint
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API is running and healthy${NC}"
    kill $BACKEND_PID 2>/dev/null || true
else
    echo -e "${YELLOW}⚠ Backend API test skipped (will start in next step)${NC}"
    kill $BACKEND_PID 2>/dev/null || true
fi
echo ""

echo "=================================================="
echo "✅ Setup Complete!"
echo "=================================================="
echo ""
echo "To start the dashboard, open TWO terminal windows:"
echo ""
echo -e "${YELLOW}Terminal 1 (Backend):${NC}"
echo "  cd $(pwd)/backend"
echo "  source ../venv/bin/activate"
echo "  python app.py"
echo ""
echo -e "${YELLOW}Terminal 2 (Frontend):${NC}"
echo "  cd $(pwd)"
echo "  npm run dev"
echo ""
echo "Then open your browser to: ${GREEN}http://localhost:5173${NC}"
echo ""
echo "📚 Documentation:"
echo "  - Quick Start: README.md"
echo "  - Backend API: backend/README.md"
echo "  - Feasibility Study: ../UI_FEASIBILITY_ASSESSMENT.md"
echo ""
echo "Happy demoing! 🎉"
