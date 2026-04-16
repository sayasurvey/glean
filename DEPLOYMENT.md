# Glean デプロイメントガイド

このドキュメントでは、Nuxt3アプリケーションをAWS Lambda + API Gateway + S3 + CloudFrontで静的ホスティングする手順を説明します。

## 前提条件

- AWS アカウント
- AWS CLI がインストール・設定済み（`aws configure`）
- SAM CLI がインストール済み（[インストール手順](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)）
- Node.js 22.x 以上
- npm または yarn
- 独自ドメイン（取得済み）
- ACM 証明書（us-east-1 リージョン）

## アーキテクチャ概要

```
ブラウザ
  ↓ HTTPS（独自ドメイン）
CloudFront
  ├── /api/* → API Gateway → Lambda（OGP取得 / Gemini要約）
  └── /* → S3（Nuxt3静的ファイル）
            ↓
       Firebase（認証・DB）
```

## Step 1: ACM 証明書の取得

CloudFront で独自ドメインを使用するには、**us-east-1 リージョン**で ACM 証明書が必要です。

```bash
# 証明書をリクエスト（us-east-1）
aws acm request-certificate \
  --region us-east-1 \
  --domain-name app.example.com \
  --validation-method DNS

# 出力から Certificate ARN をメモ
# 例: arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012
```

### 証明書の検証

AWS Certificate Manager コンソール（us-east-1）から以下を実行：

1. リクエストした証明書を選択
2. 「検証」タブで CNAME レコードを確認
3. 外部 DNS プロバイダーにそれぞれの CNAME レコードを追加
4. 検証完了まで待つ（通常 5-15 分）

## Step 2: AWS SSM に機密情報を登録

Firebase サービスアカウント JSON と Gemini API キーを AWS SSM Parameter Store に登録します。

```bash
# Firebase Service Account JSON を登録
aws ssm put-parameter \
  --name /glean/firebase-service-account \
  --value "$(cat path/to/serviceAccount.json)" \
  --type SecureString \
  --region ap-northeast-1

# Gemini API キーを登録
aws ssm put-parameter \
  --name /glean/gemini-api-key \
  --value "YOUR_GEMINI_API_KEY" \
  --type SecureString \
  --region ap-northeast-1
```

> **セキュリティに関する注意**
> - `serviceAccount.json` と Gemini API キーは絶対にリポジトリに含めないでください
> - SSM Parameter Store では KMS 暗号化で保護されます

## Step 3: SAM デプロイ設定をカスタマイズ

`infra/samconfig.toml` を編集して、独自ドメイン情報を設定します。

```toml
[default.deploy.parameters]
stack_name = "glean"
region = "ap-northeast-1"
parameter_overrides = [
  "DomainName=app.example.com",
  "AcmCertificateArn=arn:aws:acm:us-east-1:123456789012:certificate/xxxxx",
  "AllowedOrigin=https://app.example.com"
]
```

## Step 4: バックエンドのビルド・デプロイ

```bash
cd /Users/yona/glean

# デプロイスクリプトに実行権を付与（初回のみ）
chmod +x infra/scripts/deploy-backend.sh

# バックエンドをデプロイ
infra/scripts/deploy-backend.sh
```

このスクリプトが実行する処理：
1. Lambda 関数の依存パッケージをインストール
2. TypeScript をコンパイル（各 Lambda）
3. SAM でビルド
4. AWS にデプロイ

デプロイ完了後、以下の情報が出力されます：
- CloudFront Domain Name（d...cloudfront.net）
- API Gateway Endpoint
- S3 バケット名
- CloudFront Distribution ID

## Step 5: 外部 DNS に CNAME を追加

CloudFront をカスタムドメインで利用するため、DNS プロバイダーに CNAME レコードを追加します。

```
CNAME レコード：
  名前: app.example.com
  値: d123456.cloudfront.net
```

DNS の反映に 5-15 分かかります。確認方法：

```bash
nslookup app.example.com
```

## Step 6: フロントエンドのビルド・デプロイ

```bash
# フロントエンドデプロイスクリプトに実行権を付与（初回のみ）
chmod +x infra/scripts/deploy-frontend.sh

# フロントエンドをビルド・デプロイ
infra/scripts/deploy-frontend.sh
```

このスクリプトが実行する処理：
1. Nuxt3 を静的サイト生成（`npm run generate`）
2. `.output/public/` の内容を S3 に同期
3. HTML ファイルのキャッシュを無効化
4. CloudFront のキャッシュを無効化

## Step 7: 動作確認

独自ドメイン（例：`https://app.example.com`）でアプリケーションにアクセスして以下を確認します：

- [ ] ページが正常に読み込まれる
- [ ] Firebase 認証が動作する（ログイン・サインアップ）
- [ ] 記事登録フローが動作する
  - [ ] URL を入力してOGP情報が取得される
  - [ ] Gemini API で要約が生成される
  - [ ] Firestore に記事が保存される
- [ ] 既存記事の一覧が表示される
- [ ] 削除機能が動作する

## トラブルシューティング

### AWS CLI エラー: "AccessDenied"

```
An error occurred (AccessDenied) when calling the ... operation
```

**解決方法：** AWS 認証情報の権限を確認

```bash
aws sts get-caller-identity
```

必要な IAM ポリシー：
- `cloudformation:*`
- `lambda:*`
- `apigateway:*`
- `s3:*`
- `cloudfront:*`
- `ssm:GetParameter`
- `iam:*`（SAM が IAM ロール作成に必要）

### CloudFront で 503 Service Unavailable

**原因：** API Gateway が正常に動作していない

```bash
# Lambda 関数のログを確認
aws logs tail /aws/lambda/glean-ogp --follow --region ap-northeast-1
aws logs tail /aws/lambda/glean-gemini --follow --region ap-northeast-1
```

### Lambda でタイムアウト

**原因：** OGP 取得が遅い、ネットワークの問題

```bash
# Lambda のメモリを増やす（template.yaml の MemorySize を編集）
# または、タイムアウト時間を増やす（Timeout を編集）
```

### 記事登録時に 401 Unauthorized

**原因：** Firebase トークン検証失敗

確認項目：
- [ ] `FIREBASE_SERVICE_ACCOUNT` が正しく設定されているか
- [ ] フロントエンドの Firebase 認証が機能しているか
- [ ] Authorization ヘッダーが正しく送信されているか

```bash
# Lambda の認証ロジックをテスト
sam local start-api --env-vars infra/.env.local
```

## ローカル開発・テスト

### SAM Local でのテスト

```bash
cd infra

# Lambda ローカルサーバーを起動
sam local start-api --env-vars .env.local --port 4000

# 別ターミナルでテスト
curl -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  "http://localhost:4000/api/ogp?url=https://example.com"
```

### Nuxt Local での開発

```bash
# Nuxt 開発サーバーを起動
NUXT_PUBLIC_API_BASE=http://localhost:4000 npm run dev
```

このときフロントエンド（localhost:3000）から Lambda Local（localhost:4000）の API を呼び出します。

## 本番環境での注意事項

- [ ] CloudFront で HTTPS が有効か確認（自動リダイレクト）
- [ ] CloudFront でログが記録されているか確認（トラブルシューティング用）
- [ ] S3 バケットがパブリックアクセスをブロックしているか確認
- [ ] Lambda 関数が定期的に呼ばれることで Cold Start を最小化
- [ ] Lambda のメモリサイズを本番ワークロードに合わせて調整
- [ ] SAM でデプロイ時に `confirm_changeset = true` に設定（変更確認）

## 更新手順

### フロントエンドのみ更新

```bash
infra/scripts/deploy-frontend.sh
```

### バックエンド（Lambda）のみ更新

```bash
cd infra
sam build
sam deploy
```

### 両方更新

```bash
infra/scripts/deploy-backend.sh
infra/scripts/deploy-frontend.sh
```

## CloudFormation スタックの削除

デプロイしたリソースをすべて削除する場合：

```bash
aws cloudformation delete-stack --stack-name glean --region ap-northeast-1

# 削除が完了するまで待機
aws cloudformation wait stack-delete-complete --stack-name glean --region ap-northeast-1
```

> **警告：** S3 バケット内のファイルが削除されます

## 参考資料

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Nuxt Deployment](https://nuxt.com/docs/guide/deploy/static-hosting)
