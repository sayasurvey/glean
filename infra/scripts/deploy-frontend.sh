#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/../../"

# ルートの .env（Firebase設定等）を読み込む
ROOT_ENV_FILE="$ROOT_DIR/.env"
if [ ! -f "$ROOT_ENV_FILE" ]; then
  echo -e "${RED}Error: $ROOT_ENV_FILE not found. Copy .env.example to .env and fill in the values.${NC}"
  exit 1
fi
set -a; source "$ROOT_ENV_FILE"; set +a

# infra/.env（AWS設定）を読み込む
ENV_FILE="$SCRIPT_DIR/../.env"
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Error: $ENV_FILE not found. Copy infra/.env.example to infra/.env and fill in the values.${NC}"
  exit 1
fi
set -a; source "$ENV_FILE"; set +a

# 必須環境変数の検証（空のままビルドすると白画面になるため事前に確認）
MISSING_VARS=()
REQUIRED_VARS=(
  "NUXT_PUBLIC_FIREBASE_API_KEY"
  "NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
  "NUXT_PUBLIC_FIREBASE_PROJECT_ID"
  "NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
  "NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
  "NUXT_PUBLIC_FIREBASE_APP_ID"
  "S3_BUCKET_NAME"
)
for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    MISSING_VARS+=("$VAR")
  fi
done
if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo -e "${RED}Error: 以下の必須環境変数が設定されていません:${NC}"
  for VAR in "${MISSING_VARS[@]}"; do
    echo -e "${RED}  - $VAR${NC}"
  done
  echo -e "${YELLOW}ヒント: .env ファイルに値を設定してください${NC}"
  exit 1
fi
echo -e "${GREEN}✓ 環境変数の検証完了${NC}"

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
NODE_ENV=production npm run generate

if [ ! -d ".output/public" ]; then
  echo -e "${RED}Error: Nuxt build failed or output directory not found${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Nuxt build completed${NC}"

# 3. Sync to S3
echo -e "\n${YELLOW}[3/4] Syncing files to S3...${NC}"

# HTMLファイル: ブラウザキャッシュ禁止（デプロイ後に必ず最新を取得させる）
aws s3 sync \
  --region "$REGION" \
  --delete \
  --exclude "*" \
  --include "*.html" \
  --cache-control "no-store" \
  .output/public/ \
  "s3://$BUCKET_NAME/"
echo -e "${GREEN}  ✓ HTMLファイルを同期 (Cache-Control: no-store)${NC}"

# JS/CSS/画像: 長期キャッシュ（コンテンツハッシュ付きファイル名のため安全）
aws s3 sync \
  --region "$REGION" \
  --delete \
  --exclude "*.html" \
  --cache-control "max-age=31536000, immutable" \
  .output/public/ \
  "s3://$BUCKET_NAME/"
echo -e "${GREEN}  ✓ 静的アセットを同期 (Cache-Control: max-age=31536000, immutable)${NC}"

# public/ ディレクトリの静的ファイル（favicon, ogp等）を明示的にアップロード
if [ -d "public" ] && [ "$(ls -A public 2>/dev/null)" ]; then
  aws s3 sync \
    --region "$REGION" \
    --cache-control "max-age=86400" \
    public/ \
    "s3://$BUCKET_NAME/"
  echo -e "${GREEN}  ✓ public/ ディレクトリを同期 (Cache-Control: max-age=86400)${NC}"
fi

echo -e "${GREEN}✓ Files synced to S3${NC}"

# 4. CloudFront cache invalidation (if Distribution exists)
echo -e "\n${YELLOW}[4/4] CloudFront cache invalidation...${NC}"
# バケット名をオリジンとして使用するDistribution IDを検索
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?contains(Origins.Items[0].DomainName, '${BUCKET_NAME}')].Id" \
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
