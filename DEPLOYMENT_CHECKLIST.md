# デプロイ前チェックリスト

デプロイを開始する前に、以下のチェックリストを確認してください。

## 📋 環境準備

### ローカル環境

- [ ] Node.js 22.x 以上がインストール済み
  ```bash
  node --version
  ```

- [ ] npm がインストール済み
  ```bash
  npm --version
  ```

- [ ] プロジェクトの依存パッケージがインストール済み
  ```bash
  cd /Users/yona/glean
  npm install
  ```

### AWS 環境

- [ ] AWS アカウント作成済み
- [ ] AWS CLI がインストール済み
  ```bash
  aws --version
  ```

- [ ] AWS CLI が設定済み（認証情報が正しく設定されている）
  ```bash
  aws sts get-caller-identity
  ```
  
  出力例：
  ```json
  {
      "UserId": "AIDAI...",
      "Account": "123456789012",
      "Arn": "arn:aws:iam::123456789012:user/your-username"
  }
  ```

- [ ] SAM CLI がインストール済み
  ```bash
  sam --version
  ```

- [ ] AWS IAM ユーザーが以下の権限を持っている：
  - CloudFormation 権限（`cloudformation:*`）
  - Lambda 権限（`lambda:*`）
  - API Gateway 権限（`apigateway:*`）
  - S3 権限（`s3:*`）
  - CloudFront 権限（`cloudfront:*`）
  - IAM 権限（`iam:CreateRole`, `iam:PutRolePolicy` など）
  - SSM 権限（`ssm:GetParameter`）

---

## 🌐 ドメイン・DNS 準備

### ドメイン取得

- [ ] お名前.com でドメイン取得済み
  - [ ] ドメイン名：`_________________` （例：app.example.com）
  - [ ] ドメインが有効化済み
  - [ ] ドメイン管理画面にアクセスできる

### DNS 設定（後で実施）

- [ ] お名前.com の DNS 管理画面にアクセス可能
  - 参考：https://www.onamae.com/service/dns/

---

## 🔐 AWS 証明書（ACM）準備

### ACM 証明書

- [ ] **us-east-1 リージョン**で ACM 証明書をリクエスト済み
  ```bash
  aws acm request-certificate \
    --region us-east-1 \
    --domain-name app.example.com \
    --validation-method DNS
  ```

- [ ] 証明書 ARN をメモ済み
  ```
  Certificate ARN: arn:aws:acm:us-east-1:123456789012:certificate/xxxxx
  ```

- [ ] AWS Console（us-east-1）で検証用 CNAME レコード情報を確認済み
  ```
  Domain: _abc123def456.app.example.com
  Name:   _xyz789.acm-validations.aws
  ```

- [ ] お名前.com で ACM 検証用 CNAME レコードを追加済み
  - [ ] 全ての検証用レコードを追加済み

- [ ] 証明書の検証が完了（`ValidationStatus: SUCCESS`）
  ```bash
  aws acm describe-certificate \
    --region us-east-1 \
    --certificate-arn arn:aws:acm:us-east-1:123456789012:certificate/xxxxx
  ```

---

## 🔑 Firebase 準備

### Firebase プロジェクト

- [ ] Firebase プロジェクト作成済み
- [ ] Firestore Database 作成済み
- [ ] Authentication 有効化済み
  - [ ] Google 認証
  - [ ] メール/パスワード認証

### Firebase Service Account

- [ ] Firebase Console から Service Account JSON をダウンロード済み
  - Firebase Console → プロジェクト設定 → サービスアカウント → 新しい秘密鍵を生成

- [ ] ファイルパス確認：
  ```
  Path: _________________ （例：/Users/yona/serviceAccount.json）
  ```

- [ ] JSON ファイルが有効か確認
  ```bash
  cat /Users/yona/serviceAccount.json | jq '.'
  ```

---

## 🤖 Gemini API 準備

- [ ] Google Cloud プロジェクト作成済み
- [ ] Generative AI API 有効化済み
- [ ] API キー作成済み
  - Google Cloud Console → APIs & Services → Credentials

- [ ] API キー値をメモ済み
  ```
  API Key: AIza___________________________
  ```

---

## 📝 AWS SSM Parameter Store に登録

### Firebase Service Account

- [ ] SSM に Firebase Service Account を登録済み
  ```bash
  aws ssm put-parameter \
    --name /glean/firebase-service-account \
    --value "$(cat /Users/yona/serviceAccount.json)" \
    --type SecureString \
    --region ap-northeast-1
  ```

### Gemini API Key

- [ ] SSM に Gemini API Key を登録済み
  ```bash
  aws ssm put-parameter \
    --name /glean/gemini-api-key \
    --value "AIza___________________________" \
    --type SecureString \
    --region ap-northeast-1
  ```

---

## ⚙️ デプロイ設定

### samconfig.toml 編集

- [ ] `infra/samconfig.toml` を編集済み
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

- [ ] DomainName が正しいか確認
- [ ] AcmCertificateArn が正しいか確認
- [ ] AllowedOrigin が DomainName と一致しているか確認

### デプロイスクリプト

- [ ] デプロイスクリプトに実行権を付与済み
  ```bash
  chmod +x infra/scripts/deploy-backend.sh
  chmod +x infra/scripts/deploy-frontend.sh
  ```

---

## 🔍 コード確認

### Nuxt3 設定

- [ ] `nuxt.config.ts` に `apiBase` が設定されているか確認
  ```typescript
  apiBase: process.env.NUXT_PUBLIC_API_BASE ?? '',
  ```

- [ ] `nitro.preset: 'static'` が設定されているか確認

### フロントエンド API 呼び出し

- [ ] `src/composables/usePosts.ts` が `apiBase` を使用しているか確認
  ```typescript
  const apiBase = config.public.apiBase as string
  ogpData = await $fetch<OgpData>(`${apiBase}/api/ogp`, ...)
  ```

- [ ] `src/components/PostRegistrationForm.vue` が `apiBase` を使用しているか確認

---

## 🧪 ローカルテスト（オプション）

### SAM Local でのテスト

- [ ] SAM Local で Lambda をテスト済み（オプション）
  ```bash
  cd infra
  sam local start-api --env-vars .env.local
  ```

- [ ] API エンドポイントが応答しているか確認
  ```bash
  curl -H "Authorization: Bearer TEST_TOKEN" \
    "http://localhost:4000/api/ogp?url=https://example.com"
  ```

### Nuxt Local での開発

- [ ] Nuxt 開発サーバーがビルドできるか確認
  ```bash
  npm run build
  npm run generate
  ```

- [ ] `.output/public/` ディレクトリが生成されるか確認

---

## 📋 デプロイ実行準備

### デプロイ順序確認

- [ ] 以下の順序で実施することを確認
  1. ACM 証明書リクエスト + 検証 ✓
  2. AWS SSM にシークレット登録 ✓
  3. samconfig.toml 編集 ✓
  4. バックエンド（Lambda）デプロイ ← **ここから実行開始**
  5. お名前.com で CloudFront CNAME 設定
  6. DNS 反映待機（5-15 分）
  7. フロントエンド（Nuxt）デプロイ
  8. 動作確認

---

## ✅ チェックリスト完了

全ての項目をチェックしたら、以下のコマンドでデプロイを開始します：

```bash
cd /Users/yona/glean

# ステップ 1: バックエンドをデプロイ
infra/scripts/deploy-backend.sh

# CloudFront Domain をメモして、お名前.com で CNAME を設定
# 例：d123456abcdef.cloudfront.net

# ステップ 2: DNS が反映されるまで待機（5-15 分）
# nslookup app.example.com で確認

# ステップ 3: フロントエンドをデプロイ
infra/scripts/deploy-frontend.sh
```

---

## 🆘 問題が発生した場合

各ドキュメントを参照してください：

- **一般的なデプロイ情報** → `DEPLOYMENT.md`
- **お名前.com 固有の手順** → `DEPLOYMENT_ONAMAE.md`
- **トラブルシューティング** → 各ドキュメントの同じセクション

---

**チェックリスト完了日時：** `_____________`

**デプロイ実行日時：** `_____________`

**デプロイ完了日時：** `_____________`
