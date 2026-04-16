# お名前.com + CloudFront デプロイメント手順

このドキュメントは、お名前.com でドメイン取得・管理する場合の詳細な手順です。

## 前提条件

- AWS アカウント
- お名前.com でドメイン取得済み（例：`app.example.com`）
- AWS CLI がインストール・設定済み
- SAM CLI がインストール済み

## ステップバイステップガイド

### ステップ 1: ACM 証明書をリクエスト（us-east-1）

CloudFront は **us-east-1 リージョン**の ACM 証明書のみ対応しています。

#### 1-1. ターミナルで実行

```bash
aws acm request-certificate \
  --region us-east-1 \
  --domain-name app.example.com \
  --subject-alternative-names www.app.example.com \
  --validation-method DNS
```

実行後、以下のような出力が返ります：

```json
{
    "CertificateArn": "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"
}
```

**この CertificateArn をメモしておいてください。** 後で samconfig.toml に設定します。

#### 1-2. AWS Management Console で DNS 検証レコードを確認

1. [AWS Certificate Manager コンソール](https://us-east-1.console.aws.amazon.com/acm/home?region=us-east-1) を開く
2. 「東部（N. バージニア）」リージョンであることを確認
3. 自分でリクエストした証明書を選択
4. 「検証」タブをクリック
5. CNAME レコード情報が表示されます：

```
Domain: _abc123def456.app.example.com
Name:   _xyz789.acm-validations.aws
```

> 通常 2 つのレコード（app.example.com と www.app.example.com 用）が表示されます

#### 1-3. お名前.com で CNAME レコードを追加

1. [お名前.com 管理画面](https://www.onamae.com/) にログイン
2. 「ドメイン一覧」から該当ドメインを選択
3. 「DNS設定」→「DNS レコード設定」を開く
4. 「追加」ボタンで新規レコード作成
5. 以下を入力：

```
ホスト名（サブドメイン）: _abc123def456
種別: CNAME
内容: _xyz789.acm-validations.aws
TTL: 3600
```

> **複数レコードがある場合は全て追加してください**

6. 「確認」→「登録」をクリック

#### 1-4. 証明書の検証完了を確認

```bash
# 検証状態をポーリング
while true; do
  STATUS=$(aws acm describe-certificate \
    --region us-east-1 \
    --certificate-arn arn:aws:acm:us-east-1:123456789012:certificate/xxxxx \
    --query 'Certificate.ValidationOptions[0].ValidationStatus' \
    --output text)
  
  if [ "$STATUS" = "SUCCESS" ]; then
    echo "✅ 証明書検証完了！"
    break
  else
    echo "⏳ 検証中... ステータス: $STATUS"
    sleep 30
  fi
done
```

通常 **5-15 分**で検証完了します。

---

### ステップ 2: AWS SSM に機密情報を登録（ap-northeast-1）

```bash
# Firebase Service Account を登録
aws ssm put-parameter \
  --name /glean/firebase-service-account \
  --value "$(cat path/to/serviceAccount.json)" \
  --type SecureString \
  --region ap-northeast-1

# Gemini API キーを登録
aws ssm put-parameter \
  --name /glean/gemini-api-key \
  --value "sk-..." \
  --type SecureString \
  --region ap-northeast-1
```

---

### ステップ 3: samconfig.toml を編集

`infra/samconfig.toml` を編集して、自分のドメイン情報を設定します。

```toml
[default.deploy.parameters]
stack_name = "glean"
region = "ap-northeast-1"
parameter_overrides = [
  "DomainName=app.example.com",
  "AcmCertificateArn=arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012",
  "AllowedOrigin=https://app.example.com"
]
```

**各項目の説明：**

| パラメータ | 説明 | 例 |
|----------|------|-----|
| `DomainName` | お名前.com で登録したドメイン | `app.example.com` |
| `AcmCertificateArn` | ステップ 1 でメモした証明書 ARN | `arn:aws:acm:us-east-1:...` |
| `AllowedOrigin` | CORS 許可オリジン（DomainName と同じ） | `https://app.example.com` |

---

### ステップ 4: バックエンド（Lambda）をデプロイ

```bash
cd /Users/yona/glean

# 実行権を付与（初回のみ）
chmod +x infra/scripts/deploy-backend.sh

# デプロイ実行
infra/scripts/deploy-backend.sh
```

完了後、CloudFormation のスタック出力から以下をメモします：

```
✓ CloudFrontDomain: d123456abcdef.cloudfront.net
✓ FrontendBucket: glean-frontend-123456789012
✓ DistributionId: E123ABC456DEF
```

---

### ステップ 5: お名前.com で CloudFront CNAME を設定

1. [お名前.com 管理画面](https://www.onamae.com/) にログイン
2. 「ドメイン一覧」から該当ドメインを選択
3. 「DNS設定」→「DNS レコード設定」を開く
4. **`app.example.com`** のレコード（A または CNAME）を編集：

```
ホスト名（サブドメイン）: app
種別: CNAME
内容: d123456abcdef.cloudfront.net
TTL: 3600
```

5. 「確認」→「登録」をクリック

> **既存の A レコードがある場合は削除してください**

**DNS 反映待機**（5-15 分）

反映確認：
```bash
nslookup app.example.com
# 返り値に d123456abcdef.cloudfront.net が含まれれば OK
```

---

### ステップ 6: フロントエンド（Nuxt）をデプロイ

```bash
chmod +x infra/scripts/deploy-frontend.sh

infra/scripts/deploy-frontend.sh
```

スクリプトが自動的に以下を実行します：
1. Nuxt をビルド（`npm run generate`）
2. S3 に静的ファイルをアップロード
3. CloudFront キャッシュを無効化

---

### ステップ 7: 動作確認

ブラウザで `https://app.example.com` にアクセス

#### チェックリスト

- [ ] ページが読み込まれる
- [ ] HTTPS で接続できる（🔒 マーク表示）
- [ ] Firebase 認証が機能する
- [ ] 記事登録（OGP + Gemini 要約）が動作する

---

## トラブルシューティング

### 問題: "This site can't be reached"

**原因：** DNS が反映されていない、または CNAME 設定が間違っている

**解決方法：**

```bash
# DNS 設定確認
nslookup app.example.com
dig app.example.com

# キャッシュをクリア（Windows の場合）
ipconfig /flushdns

# macOS の場合
sudo dscacheutil -flushcache
```

### 問題: "Certificate verification failed"

**原因：** ACM 証明書の検証が完了していない、または CNAME が不正

**解決方法：**

```bash
# 証明書の状態を確認
aws acm describe-certificate \
  --region us-east-1 \
  --certificate-arn arn:aws:acm:us-east-1:123456789012:certificate/xxxxx
```

出力で `ValidationStatus: SUCCESS` になるまで待機

### 問題: "504 Gateway Timeout"

**原因：** Lambda がタイムアウトしている（OGP 取得に時間がかかっている）

**解決方法：** CloudWatch Logs でエラーを確認

```bash
# OGP Lambda のログを確認
aws logs tail /aws/lambda/glean-ogp --follow --region ap-northeast-1
```

---

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

---

## セキュリティチェックリスト

デプロイ完了後：

- [ ] S3 バケットが **パブリックアクセスブロック** 有効か
- [ ] CloudFront で HTTP → HTTPS リダイレクト有効か
- [ ] Lambda 関数が **正しい IAM ロール**で動作しているか
- [ ] Firebase Service Account JSON が **リポジトリに含まれていないか**
- [ ] Gemini API Key が **環境変数として安全に管理**されているか

---

## お名前.com でよくある設定ミス

| ミス | 原因 | 解決方法 |
|------|------|---------|
| DNS が反映されない | TTL が長い | TTL を 3600 以下に設定 |
| 証明書検証に失敗 | CNAME が間違っている | お名前.com で CNAME レコードを正確に入力 |
| HTTPS エラー | 証明書が検証されていない | AWS Console で ValidationStatus を確認 |
| CloudFront エラー | ドメイン設定が間違っている | samconfig.toml の DomainName と実際の CNAME が一致しているか確認 |

---

## 参考資料

- [お名前.com DNS 設定ガイド](https://www.onamae.com/service/dns/)
- [AWS ACM ドキュメント](https://docs.aws.amazon.com/acm/)
- [CloudFront カスタムドメイン設定](https://docs.aws.amazon.com/cloudfront/latest/developerguide/using-https-alternate-domain-names.html)
- [AWS SAM ドキュメント](https://docs.aws.amazon.com/serverless-application-model/)
