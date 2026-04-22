#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$SCRIPT_DIR/../../"
REGION="ap-northeast-1"
BACKEND_STACK_NAME="glean-staging"
# CloudFront Distribution ID の保存先 SSM パラメータ
SSM_DIST_ID="/glean-staging/cloudfront-distribution-id"

# .env.staging を読み込む（OAC IDなどステージング固有の設定）
STAGING_ENV_FILE="$INFRA_DIR/.env.staging"
if [ ! -f "$STAGING_ENV_FILE" ]; then
  echo -e "${RED}Error: $STAGING_ENV_FILE not found. Copy .env.staging.example to .env.staging and fill in the values.${NC}"
  exit 1
fi
set -a; source "$STAGING_ENV_FILE"; set +a

if [ -z "$CLOUDFRONT_OAC_ID" ]; then
  echo -e "${RED}Error: CLOUDFRONT_OAC_ID が設定されていません。infra/.env.staging を確認してください。${NC}"
  exit 1
fi
OAC_ID="$CLOUDFRONT_OAC_ID"

# AWSアカウントIDを動的取得
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET_NAME="glean-frontend-staging-${ACCOUNT_ID}"

# ルートの .env（Firebase設定等）を読み込む
ROOT_ENV_FILE="$ROOT_DIR/.env"
if [ ! -f "$ROOT_ENV_FILE" ]; then
  echo -e "${RED}Error: $ROOT_ENV_FILE not found. Copy .env.example to .env and fill in the values.${NC}"
  exit 1
fi
set -a; source "$ROOT_ENV_FILE"; set +a

# 必須環境変数の検証
MISSING_VARS=()
REQUIRED_VARS=(
  "NUXT_PUBLIC_FIREBASE_API_KEY"
  "NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
  "NUXT_PUBLIC_FIREBASE_PROJECT_ID"
  "NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
  "NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
  "NUXT_PUBLIC_FIREBASE_APP_ID"
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

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}Glean Frontend Deployment (staging)${NC}"
echo -e "${YELLOW}================================${NC}"

# 1. Get API Endpoint from staging backend stack
echo -e "\n${YELLOW}[1/6] Retrieving staging API Endpoint...${NC}"
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name "$BACKEND_STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

if [ -z "$API_ENDPOINT" ]; then
  echo -e "${RED}Error: Could not retrieve API Endpoint from $BACKEND_STACK_NAME stack${NC}"
  echo -e "${YELLOW}Hint: Run deploy-backend-staging.sh first${NC}"
  exit 1
fi

API_DOMAIN=$(echo "$API_ENDPOINT" | sed 's|https://||' | cut -d'/' -f1)
echo -e "${GREEN}✓ API Endpoint: $API_ENDPOINT${NC}"

# 2. S3 バケット作成（なければ）
echo -e "\n${YELLOW}[2/6] Setting up S3 bucket...${NC}"
if aws s3api head-bucket --bucket "$BUCKET_NAME" --region "$REGION" 2>/dev/null; then
  echo -e "${GREEN}✓ S3 bucket already exists: $BUCKET_NAME${NC}"
else
  aws s3api create-bucket \
    --bucket "$BUCKET_NAME" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"
  aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
      BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
  echo -e "${GREEN}✓ S3 bucket created: $BUCKET_NAME${NC}"
fi

# 3. CloudFront Distribution 作成（なければ）
echo -e "\n${YELLOW}[3/6] Setting up CloudFront distribution...${NC}"
DISTRIBUTION_ID=$(aws ssm get-parameter \
  --name "$SSM_DIST_ID" \
  --region "$REGION" \
  --query 'Parameter.Value' --output text 2>/dev/null || echo "")

if [ -z "$DISTRIBUTION_ID" ] || [ "$DISTRIBUTION_ID" == "None" ]; then
  echo -e "${YELLOW}  Creating new CloudFront distribution...${NC}"

  DIST_CONFIG=$(cat <<DISTEOF
{
  "CallerReference": "glean-staging-$(date +%s)",
  "Origins": {
    "Quantity": 2,
    "Items": [
      {
        "Id": "S3Origin",
        "DomainName": "${BUCKET_NAME}.s3.${REGION}.amazonaws.com",
        "OriginAccessControlId": "${OAC_ID}",
        "S3OriginConfig": {"OriginAccessIdentity": ""}
      },
      {
        "Id": "ApiOrigin",
        "DomainName": "${API_DOMAIN}",
        "OriginPath": "/staging",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only",
          "OriginSslProtocols": {"Quantity": 1, "Items": ["TLSv1.2"]}
        }
      }
    ]
  },
  "DefaultRootObject": "index.html",
  "CacheBehaviors": {
    "Quantity": 1,
    "Items": [
      {
        "PathPattern": "/api/*",
        "TargetOriginId": "ApiOrigin",
        "ViewerProtocolPolicy": "https-only",
        "AllowedMethods": {
          "Quantity": 7,
          "Items": ["GET","HEAD","OPTIONS","PUT","PATCH","POST","DELETE"],
          "CachedMethods": {"Quantity": 2, "Items": ["GET","HEAD"]}
        },
        "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
        "OriginRequestPolicyId": "b689b0a8-53d0-40ab-baf2-68738e2966ac",
        "Compress": true
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3Origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET","HEAD"],
      "CachedMethods": {"Quantity": 2, "Items": ["GET","HEAD"]}
    },
    "Compress": true
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {"ErrorCode": 404, "ResponsePagePath": "/index.html", "ResponseCode": "200", "ErrorCachingMinTTL": 10},
      {"ErrorCode": 403, "ResponsePagePath": "/index.html", "ResponseCode": "200", "ErrorCachingMinTTL": 10}
    ]
  },
  "Comment": "Glean Staging",
  "Enabled": true,
  "HttpVersion": "http2",
  "IsIPV6Enabled": true
}
DISTEOF
)

  DIST_RESULT=$(aws cloudfront create-distribution \
    --distribution-config "$DIST_CONFIG" \
    --output json)

  DISTRIBUTION_ID=$(echo "$DIST_RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin)['Distribution']['Id'])")
  CLOUDFRONT_DOMAIN=$(echo "$DIST_RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin)['Distribution']['DomainName'])")

  # Distribution ID を SSM に保存
  aws ssm put-parameter \
    --name "$SSM_DIST_ID" \
    --value "$DISTRIBUTION_ID" \
    --type String \
    --region "$REGION" \
    --overwrite

  # S3 バケットポリシーを設定
  aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy "{
      \"Version\": \"2012-10-17\",
      \"Statement\": [{
        \"Effect\": \"Allow\",
        \"Principal\": {\"Service\": \"cloudfront.amazonaws.com\"},
        \"Action\": \"s3:GetObject\",
        \"Resource\": \"arn:aws:s3:::${BUCKET_NAME}/*\",
        \"Condition\": {
          \"StringEquals\": {
            \"AWS:SourceArn\": \"arn:aws:cloudfront::${ACCOUNT_ID}:distribution/${DISTRIBUTION_ID}\"
          }
        }
      }]
    }"

  echo -e "${GREEN}✓ CloudFront distribution created: $DISTRIBUTION_ID${NC}"
  echo -e "${YELLOW}  ⚠ Distribution のデプロイ完了まで数分かかる場合があります${NC}"
else
  CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
    --id "$DISTRIBUTION_ID" \
    --query 'Distribution.DomainName' --output text)
  echo -e "${GREEN}✓ CloudFront distribution exists: $DISTRIBUTION_ID${NC}"
fi

echo -e "${GREEN}✓ Staging URL: https://$CLOUDFRONT_DOMAIN${NC}"

# 4. Build Nuxt application
echo -e "\n${YELLOW}[4/6] Building Nuxt application...${NC}"
cd "$ROOT_DIR"

# 開発サーバーが起動中の場合、ビルドキャッシュが混入して空白ページになるため事前に停止する
pkill -f "nuxt dev" 2>/dev/null || true
pkill -f "nuxt/dist/dev" 2>/dev/null || true
sleep 1

rm -rf .nuxt .output node_modules/.cache
export NUXT_PUBLIC_API_BASE="$API_ENDPOINT"
NODE_ENV=production npm run generate

if [ ! -d ".output/public" ]; then
  echo -e "${RED}Error: Nuxt build failed or output directory not found${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Nuxt build completed${NC}"

# 5. Sync to S3
echo -e "\n${YELLOW}[5/6] Syncing files to S3...${NC}"
aws s3 sync \
  --region "$REGION" \
  --delete \
  --exclude "*" \
  --include "*.html" \
  --cache-control "no-store" \
  .output/public/ \
  "s3://$BUCKET_NAME/"
echo -e "${GREEN}  ✓ HTMLファイルを同期 (Cache-Control: no-store)${NC}"

aws s3 sync \
  --region "$REGION" \
  --delete \
  --exclude "*.html" \
  --cache-control "max-age=31536000, immutable" \
  .output/public/ \
  "s3://$BUCKET_NAME/"
echo -e "${GREEN}  ✓ 静的アセットを同期 (Cache-Control: max-age=31536000, immutable)${NC}"

if [ -d "public" ] && [ "$(ls -A public 2>/dev/null)" ]; then
  aws s3 sync \
    --region "$REGION" \
    --cache-control "max-age=86400" \
    public/ \
    "s3://$BUCKET_NAME/"
  echo -e "${GREEN}  ✓ public/ ディレクトリを同期 (Cache-Control: max-age=86400)${NC}"
fi

# 6. CloudFront キャッシュ無効化
echo -e "\n${YELLOW}[6/6] CloudFront cache invalidation...${NC}"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)
echo -e "${GREEN}  ✓ キャッシュ無効化作成 (ID: $INVALIDATION_ID)${NC}"

aws cloudfront wait invalidation-completed \
  --distribution-id "$DISTRIBUTION_ID" \
  --id "$INVALIDATION_ID"
echo -e "${GREEN}  ✓ キャッシュ無効化完了${NC}"

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}Frontend staging deployment completed!${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "S3 Bucket:    s3://$BUCKET_NAME"
echo -e "Staging URL:  ${YELLOW}https://$CLOUDFRONT_DOMAIN${NC}"
