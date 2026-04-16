#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}Glean Frontend Infrastructure${NC}"
echo -e "${YELLOW}================================${NC}"

# Get backend API endpoint from existing stack
echo -e "\n${YELLOW}[1/2] Retrieving backend API endpoint...${NC}"
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name glean \
  --region ap-northeast-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

if [ -z "$API_ENDPOINT" ]; then
  echo -e "${RED}Error: Could not retrieve API endpoint from glean stack${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Backend API Endpoint: $API_ENDPOINT${NC}"

# Deploy CloudFormation stack for frontend infrastructure
echo -e "\n${YELLOW}[2/2] Deploying CloudFront + S3 infrastructure...${NC}"
cd "$(dirname "$0")/../"

aws cloudformation deploy \
  --template-file template-frontend.yaml \
  --stack-name glean-frontend \
  --region ap-northeast-1 \
  --parameter-overrides \
    BackendApiEndpoint="$API_ENDPOINT" \
    DomainName=myglean.jp \
    AcmCertificateArn=arn:aws:acm:us-east-1:YOUR_ACCOUNT_ID:certificate/YOUR_CERT_ID \
  --capabilities CAPABILITY_IAM

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}Frontend infrastructure deployed!${NC}"
echo -e "${GREEN}================================${NC}"
