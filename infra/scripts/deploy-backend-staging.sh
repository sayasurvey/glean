#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"

# .env.staging を読み込む
STAGING_ENV_FILE="$INFRA_DIR/.env.staging"
if [ ! -f "$STAGING_ENV_FILE" ]; then
  echo -e "${RED}Error: $STAGING_ENV_FILE not found. Copy .env.staging.example to .env.staging and fill in the values.${NC}"
  exit 1
fi
set -a; source "$STAGING_ENV_FILE"; set +a

if [ -z "$SAM_S3_BUCKET" ]; then
  echo -e "${RED}Error: SAM_S3_BUCKET が設定されていません。infra/.env.staging を確認してください。${NC}"
  exit 1
fi

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}Glean Backend Deployment (staging)${NC}"
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
sam build --config-file samconfig-staging.toml --s3-bucket "$SAM_S3_BUCKET"

echo -e "${GREEN}✓ SAM build completed${NC}"

# 3. Deploy stack
echo -e "\n${YELLOW}[3/3] Deploying CloudFormation stack (glean-staging)...${NC}"
sam deploy --config-file samconfig-staging.toml --s3-bucket "$SAM_S3_BUCKET"

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}Backend staging deployment completed!${NC}"
echo -e "${GREEN}================================${NC}"

# staging API エンドポイントを表示
STAGING_API=$(aws cloudformation describe-stacks \
  --stack-name glean-staging \
  --region ap-northeast-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text 2>/dev/null || echo "")

if [ -n "$STAGING_API" ]; then
  echo -e "API Endpoint: ${YELLOW}$STAGING_API${NC}"
fi

echo -e "\nNext steps:"
echo -e "1. Run: ${YELLOW}bash $SCRIPT_DIR/deploy-frontend-staging.sh${NC}"
