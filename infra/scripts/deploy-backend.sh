#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$INFRA_DIR")"

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}Glean Backend Deployment${NC}"
echo -e "${YELLOW}================================${NC}"

# 1. Install dependencies
echo -e "\n${YELLOW}[1/3] Installing dependencies...${NC}"
cd "$INFRA_DIR/lambdas/shared"
npm install
echo -e "${GREEN}✓ shared dependencies installed${NC}"

cd "$INFRA_DIR/lambdas/ogp"
npm install
echo -e "${GREEN}✓ ogp dependencies installed${NC}"

cd "$INFRA_DIR/lambdas/gemini"
npm install
echo -e "${GREEN}✓ gemini dependencies installed${NC}"

# 2. Build SAM project
echo -e "\n${YELLOW}[2/3] Building SAM project...${NC}"
cd "$INFRA_DIR"
sam build

echo -e "${GREEN}✓ SAM build completed${NC}"

# 3. Deploy stack
echo -e "\n${YELLOW}[3/3] Deploying CloudFormation stack...${NC}"
sam deploy

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}Backend deployment completed!${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "\nNext steps:"
echo -e "1. Run: ${YELLOW}bash $SCRIPT_DIR/deploy-frontend.sh${NC}"
