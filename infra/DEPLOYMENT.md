# Glean アプリケーション デプロイメントガイド

## 概要

Glean アプリケーションは以下の構成でデプロイされています：

```
ブラウザ (https://myglean.jp)
  ↓ HTTPS
CloudFront (カスタムドメイン、ACM証明書)
  ├── /api/* → API Gateway → Lambda（OGP / Gemini）
  └── /* → S3（Nuxt3 静的ファイル）
              ↓
         Firebase（Auth + Firestore）
```

## デプロイメント手順

### 1. バックエンド（Lambda + API Gateway）のデプロイ

```bash
cd infra
bash scripts/deploy-backend.sh
```

このステップで以下がデプロイされます：
- AWS Lambda Layer: glean-shared-deps（共有コード）
- AWS Lambda Function: glean-ogp（OGP取得）
- AWS Lambda Function: glean-gemini（Gemini要約生成）
- AWS API Gateway: glean-api（REST API、CORS設定済み）

**出力例：**
```
ApiEndpoint: https://rxjsg35iph.execute-api.ap-northeast-1.amazonaws.com/prod
```

### 2. フロントエンド（S3）のセットアップ

S3 バケットが自動的に作成されます：
```bash
aws cloudformation describe-stacks \
  --stack-name glean-s3-frontend \
  --region ap-northeast-1 \
  --query 'Stacks[0].Outputs[0].OutputValue' \
  --output text
```

### 3. フロントエンド ファイルのデプロイ

Nuxt アプリケーションをビルドして S3 にアップロード：
```bash
bash infra/scripts/deploy-frontend-files.sh
```

このスクリプトが実行する処理：
1. バックエンド API エンドポイント取得
2. `npm run generate` で Nuxt をビルド
3. `.output/public/` を S3 に同期

### 4. CloudFront 設定（手動）

現在、AWS CloudFormation の Early Validation エラーにより、自動デプロイができません。
以下の手順で手動設定してください：

#### AWS コンソールでの設定

1. **CloudFront Distribution 作成**
   - AWS CloudFront コンソール → Create Distribution
   - Origin Settings:
     - Domain Name: `glean-frontend-[AccountId].s3.ap-northeast-1.amazonaws.com`
     - Origin Access: Origin access control settings
     - Create new OAC: `glean-frontend-oac`

2. **キャッシュ動作設定**
   - Default cache behavior:
     - Allowed HTTP methods: GET, HEAD, OPTIONS
     - Viewer protocol policy: Redirect HTTP to HTTPS
     - Cache policy: CachingOptimized
   - Error responses:
     - 404 → 200 /index.html（SPA フォールバック）

3. **カスタムドメイン設定**
   - Alternate domain names (CNAMEs): `myglean.jp`
   - Custom SSL certificate: 証明書 ARN を指定

4. **S3 バケットポリシー自動更新**
   - CloudFront はバケットポリシーを自動的に更新します

#### AWS CLI での設定

テンプレートファイルで再度試行：
```bash
aws cloudformation deploy \
  --template-file infra/template-frontend.yaml \
  --stack-name glean-frontend \
  --region ap-northeast-1
```

### 5. DNS 設定

独自ドメイン（myglean.jp）の DNS 設定に CNAME レコードを追加：

```
CNAME: myglean.jp → [CloudFront DomainName]
例: myglean.jp CNAME d1234567890.cloudfront.net
```

## 検証方法

### バックエンド API の動作確認

```bash
# OGP 取得エンドポイント
curl -H "Authorization: Bearer [Firebase Token]" \
  "https://rxjsg35iph.execute-api.ap-northeast-1.amazonaws.com/prod/api/ogp?url=https://example.com"

# Gemini 要約エンドポイント
curl -X POST \
  -H "Authorization: Bearer [Firebase Token]" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","ogTitle":"Title","ogDescription":"Desc"}' \
  "https://rxjsg35iph.execute-api.ap-northeast-1.amazonaws.com/prod/api/gemini"
```

### フロントエンドの動作確認

CloudFront が設定されたら、https://myglean.jp でアプリケーションにアクセス

## トラブルシューティング

### CloudFront Early Validation エラー

**原因：** AWS の制約により、特定の CloudFront 設定の組み合わせが Early Validation を通過しません

**解決策：**
1. AWS コンソール（https://console.aws.amazon.com/cloudfront/）で手動設定
2. テンプレートを段階的に簡略化して再度試行
3. AWS Support に問い合わせ

### S3 へのアップロードが失敗

```bash
# S3 アクセス権限確認
aws s3 ls s3://glean-frontend-[AccountId]/

# デバッグ オプション付き同期
aws s3 sync --dryrun --delete .output/public/ s3://glean-frontend-[AccountId]/
```

### Lambda 関数の動作確認

```bash
# OGP Lambda ログ確認
aws logs tail /aws/lambda/glean-ogp --follow --region ap-northeast-1

# Gemini Lambda ログ確認
aws logs tail /aws/lambda/glean-gemini --follow --region ap-northeast-1
```

## リソース一覧

| リソース | 名前 | 説明 |
|---------|------|------|
| Lambda | glean-ogp | OGP データ取得 |
| Lambda | glean-gemini | Gemini 要約生成 |
| Lambda Layer | glean-shared-deps | 共有コード（Firebase認証） |
| API Gateway | glean-api | REST API |
| S3 Bucket | glean-frontend-[AccountId] | フロントエンドファイル |
| CloudFront | (手動設定) | CDN + カスタムドメイン |

## 環境変数

### Lambda 関数で使用される SSM パラメータ

```bash
# Firebase Service Account（作成済み）
/glean/firebase-service-account

# Gemini API Key（作成済み）
/glean/gemini-api-key
```

SSM パラメータの確認：
```bash
aws ssm get-parameter --name /glean/firebase-service-account --with-decryption --region ap-northeast-1
```

## 次のステップ

1. CloudFront を完全に設定
2. カスタムドメインで動作確認
3. 記事登録フロー全体の E2E テスト
4. パフォーマンスチューニング

---

生成日: 2026-04-15
