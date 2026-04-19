#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Error: $ENV_FILE not found. Copy infra/.env.example to infra/.env and fill in the values.${NC}"
  exit 1
fi
set -a; source "$ENV_FILE"; set +a

REGION="ap-northeast-1"
DOMAIN_NAME="${DOMAIN_NAME:-myglean.jp}"
WWW_DOMAIN_NAME="www.${DOMAIN_NAME}"

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}Glean Frontend Infrastructure${NC}"
echo -e "${YELLOW}================================${NC}"

# 1. Get backend API endpoint
echo -e "\n${YELLOW}[1/3] Retrieving backend API endpoint...${NC}"
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name glean \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

if [ -z "$API_ENDPOINT" ]; then
  echo -e "${RED}Error: Could not retrieve API endpoint from glean stack${NC}"
  exit 1
fi

# API Gatewayのドメイン部分を抽出（例: rxjsg35iph.execute-api.ap-northeast-1.amazonaws.com）
API_DOMAIN=$(echo "$API_ENDPOINT" | sed 's|https://||' | cut -d'/' -f1)
API_STAGE=$(echo "$API_ENDPOINT" | sed 's|https://[^/]*/||' | cut -d'/' -f1)

echo -e "${GREEN}✓ API Endpoint: $API_ENDPOINT${NC}"

# 2. Find existing CloudFront distribution
echo -e "\n${YELLOW}[2/3] Finding CloudFront distribution for $DOMAIN_NAME...${NC}"
DIST_ID=$(aws cloudfront list-distributions \
  --region "$REGION" \
  --query "DistributionList.Items[?Aliases.Items[?contains(@, '$DOMAIN_NAME')]].Id" \
  --output text)

if [ -z "$DIST_ID" ] || [ "$DIST_ID" == "None" ]; then
  echo -e "${RED}Error: CloudFront distribution for $DOMAIN_NAME not found${NC}"
  echo -e "${YELLOW}Tip: Run the initial setup manually or contact the administrator.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Distribution found: $DIST_ID${NC}"

# 3. Check and update API Gateway origin
echo -e "\n${YELLOW}[3/3] Verifying API Gateway routing in CloudFront...${NC}"

CONFIG_JSON=$(aws cloudfront get-distribution-config --id "$DIST_ID" --region "$REGION" --output json)
ETAG=$(echo "$CONFIG_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['ETag'])")

CURRENT_API_DOMAIN=$(echo "$CONFIG_JSON" | python3 -c "
import json, sys
config = json.load(sys.stdin)['DistributionConfig']
for origin in config['Origins']['Items']:
    if origin.get('Id') == 'ApiGatewayOrigin':
        print(origin['DomainName'])
        break
" 2>/dev/null || echo "")

CURRENT_ALIASES=$(echo "$CONFIG_JSON" | python3 -c "
import json, sys
config = json.load(sys.stdin)['DistributionConfig']
print(' '.join(config.get('Aliases', {}).get('Items', [])))
" 2>/dev/null || echo "")

WWW_MISSING=true
if echo "$CURRENT_ALIASES" | grep -q "$WWW_DOMAIN_NAME"; then
  WWW_MISSING=false
fi

if [ "$CURRENT_API_DOMAIN" == "$API_DOMAIN" ] && [ "$WWW_MISSING" == "false" ]; then
  echo -e "${GREEN}✓ API Gateway origin and aliases are already up-to-date${NC}"
  echo -e "\n${GREEN}================================${NC}"
  echo -e "${GREEN}Frontend infrastructure is configured!${NC}"
  echo -e "${GREEN}================================${NC}"
  exit 0
fi

if [ "$CURRENT_API_DOMAIN" != "$API_DOMAIN" ]; then
  echo -e "${YELLOW}  API origin current: ${CURRENT_API_DOMAIN:-'(not set)'}${NC}"
  echo -e "${YELLOW}  API origin new:     $API_DOMAIN${NC}"
fi
if [ "$WWW_MISSING" == "true" ]; then
  echo -e "${YELLOW}  Adding alias: $WWW_DOMAIN_NAME${NC}"
fi
echo -e "${YELLOW}  Updating CloudFront distribution...${NC}"

UPDATED_CONFIG=$(echo "$CONFIG_JSON" | python3 -c "
import json, sys

data = json.load(sys.stdin)
config = data['DistributionConfig']
api_domain = '$API_DOMAIN'
api_stage = '/$API_STAGE'
www_domain = '$WWW_DOMAIN_NAME'

# Update ApiGatewayOrigin domain
for origin in config['Origins']['Items']:
    if origin.get('Id') == 'ApiGatewayOrigin':
        origin['DomainName'] = api_domain
        origin['OriginPath'] = api_stage
        break

# Add www alias if not present
aliases = config.setdefault('Aliases', {'Quantity': 0, 'Items': []})
if www_domain not in aliases.get('Items', []):
    aliases['Items'].append(www_domain)
    aliases['Quantity'] = len(aliases['Items'])

print(json.dumps(config))
")

aws cloudfront update-distribution \
  --id "$DIST_ID" \
  --region "$REGION" \
  --distribution-config "$UPDATED_CONFIG" \
  --if-match "$ETAG" \
  --output json > /dev/null

echo -e "${GREEN}✓ CloudFront distribution updated${NC}"

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}Frontend infrastructure deployed!${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "CloudFront Distribution: $DIST_ID"
echo -e "API Gateway Origin: $API_DOMAIN"
