#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

REGION="ap-northeast-1"
BUCKET_NAME=""
API_ENDPOINT=""

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}Glean Frontend Deployment${NC}"
echo -e "${YELLOW}================================${NC}"

# 1. Get S3 bucket name
echo -e "\n${YELLOW}[1/4] Retrieving S3 bucket name...${NC}"
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name glean-s3-frontend \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[0].OutputValue' \
  --output text)

if [ -z "$BUCKET_NAME" ]; then
  echo -e "${RED}Error: Could not retrieve S3 bucket name${NC}"
  exit 1
fi

echo -e "${GREEN}✓ S3 Bucket: $BUCKET_NAME${NC}"

# 2. Get backend API endpoint
echo -e "\n${YELLOW}[2/4] Retrieving backend API endpoint...${NC}"
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name glean \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

if [ -z "$API_ENDPOINT" ]; then
  echo -e "${RED}Error: Could not retrieve API endpoint${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Backend API Endpoint: $API_ENDPOINT${NC}"

# 3. Build Nuxt application
echo -e "\n${YELLOW}[3/4] Building Nuxt application...${NC}"
cd "$(dirname "$0")/../../"
export NUXT_PUBLIC_API_BASE="$API_ENDPOINT"
npm run generate

if [ ! -d ".output/public" ]; then
  echo -e "${RED}Error: Nuxt build failed${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Nuxt build completed${NC}"

# 4. Sync to S3
echo -e "\n${YELLOW}[4/4] Syncing files to S3...${NC}"
aws s3 sync \
  --region "$REGION" \
  --delete \
  .output/public/ \
  "s3://$BUCKET_NAME/"

echo -e "${GREEN}✓ Files synced to S3${NC}"

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}Frontend files deployed!${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "\nNext: Configure CloudFront to point to: s3://$BUCKET_NAME"
