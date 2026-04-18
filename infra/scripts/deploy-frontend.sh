#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Error: $ENV_FILE not found. Copy infra/.env.example to infra/.env and fill in the values.${NC}"
  exit 1
fi
set -a; source "$ENV_FILE"; set +a

# Configuration
STACK_NAME="glean"
REGION="ap-northeast-1"
API_ENDPOINT=""
BUCKET_NAME="$S3_BUCKET_NAME"
DISTRIBUTION_ID=""

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}Glean Frontend Deployment${NC}"
echo -e "${YELLOW}================================${NC}"

# 1. Get API Endpoint from CloudFormation
echo -e "\n${YELLOW}[1/4] Retrieving API Endpoint...${NC}"
STACK_OUTPUTS=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs' \
  --output json)

API_ENDPOINT=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="ApiEndpoint") | .OutputValue')

if [ -z "$API_ENDPOINT" ]; then
  echo -e "${RED}Error: Could not retrieve API Endpoint${NC}"
  exit 1
fi

echo -e "${GREEN}✓ API Endpoint retrieved${NC}"
echo "  API Endpoint: $API_ENDPOINT"
echo "  S3 Bucket: $BUCKET_NAME"

# 2. Build Nuxt application
echo -e "\n${YELLOW}[2/4] Building Nuxt application...${NC}"
cd "$(dirname "$0")/../../"
echo -e "  Cleaning build cache..."
rm -rf .nuxt .output
export NUXT_PUBLIC_API_BASE="$API_ENDPOINT"
npm run generate

if [ ! -d ".output/public" ]; then
  echo -e "${RED}Error: Nuxt build failed or output directory not found${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Nuxt build completed${NC}"

# 3. Sync to S3
echo -e "\n${YELLOW}[3/4] Syncing files to S3...${NC}"
aws s3 sync \
  --region "$REGION" \
  --delete \
  .output/public/ \
  "s3://$BUCKET_NAME/"

echo -e "${GREEN}✓ Files synced to S3${NC}"

# 4. CloudFront cache invalidation (if Distribution exists)
echo -e "\n${YELLOW}[4/4] CloudFront cache invalidation...${NC}"
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --region "$REGION" \
  --query "DistributionList.Items[?Comment=='glean'].Id" \
  --output text 2>/dev/null || echo "")

if [ -z "$DISTRIBUTION_ID" ] || [ "$DISTRIBUTION_ID" == "None" ]; then
  echo -e "${YELLOW}⚠ CloudFront Distribution not found (skipping cache invalidation)${NC}"
  echo -e "${YELLOW}You can create it manually in AWS Console or use:${NC}"
  echo -e "  aws cloudfront create-distribution --origin-domain-name ${BUCKET_NAME}.s3.${REGION}.amazonaws.com"
else
  INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

  echo -e "${GREEN}✓ Cache invalidation created (ID: $INVALIDATION_ID)${NC}"

  # Wait for invalidation
  aws cloudfront wait invalidation-completed \
    --distribution-id "$DISTRIBUTION_ID" \
    --id "$INVALIDATION_ID"

  echo -e "${GREEN}✓ Cache invalidation completed${NC}"
fi

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}Frontend deployment completed!${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "S3 Bucket: s3://$BUCKET_NAME"
if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
  DIST_DOMAIN=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query 'Distribution.DomainName' --output text)
  echo -e "CloudFront URL: https://$DIST_DOMAIN"
  echo -e "Custom Domain: https://myglean.jp"
fi
