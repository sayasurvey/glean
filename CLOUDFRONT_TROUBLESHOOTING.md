# CloudFront 504 Gateway Timeout トラブルシューティング

## 問題

2026年4月16日、カスタムドメイン `https://www.myglean.jp/` にアクセスすると以下のエラーが発生していた：

```
504 Gateway Timeout ERROR
The request could not be satisfied.
We can't connect to the server for this app or website at this time.
```

**エラー詳細：**
- ステータス: HTTP 504
- エラーソース: CloudFront
- Request ID: 0J-8Y_Zs6q-yP7nNCpcKoCozeNmSi6Kt9g6dvxuvAK-4BzwdSmsWQA==
- 生成元: cloudfront (CloudFront) HTTP3 Server

## 🔴 根本原因

CloudFront の Origin（オリジン）設定で **複数の設定ミス** がありました：

### 1. OriginProtocolPolicy の設定ミス（主原因）

| 項目 | 値 |
|------|-----|
| Origin DomainName | `glean-frontend-827251793719.s3-website-ap-northeast-1.amazonaws.com` |
| OriginProtocolPolicy | `https-only` ❌ |

**問題：**
- S3 の**静的ウェブサイトエンドポイント**は HTTP プロトコルのみをサポート
- CloudFront が HTTPS でアクセスしようとしても、S3 が応答しない
- 30秒のタイムアウト後に 504 エラーが返されていた

### 2. DefaultRootObject が未設定

| 項目 | 値 |
|------|-----|
| DefaultRootObject | （空） ❌ |

**問題：**
- CloudFront がルートパス（/）へのリクエストを受け取ったとき、どのファイルを返すべきか不明
- index.html を自動的に返すルールがなかった

## ✅ 実施した対応

### 1. OriginProtocolPolicy を修正

```yaml
# 変更前
OriginProtocolPolicy: https-only

# 変更後
OriginProtocolPolicy: http-only
```

**理由：** S3 の静的ウェブサイトエンドポイントは HTTP エンドポイントであるため

**コマンド：**
```bash
aws cloudfront get-distribution-config --id E34RAQL5CJ9YR2 > /tmp/cf-config.json
# OriginProtocolPolicy を http-only に変更
aws cloudfront update-distribution \
  --id E34RAQL5CJ9YR2 \
  --distribution-config file:///tmp/cf-config-fix.json \
  --if-match "$ETAG"
```

### 2. DefaultRootObject を設定

```yaml
# 変更前
DefaultRootObject: ""

# 変更後
DefaultRootObject: index.html
```

**理由：** CloudFront がルートへのアクセスで index.html を返すようにするため

**コマンド：**
```bash
aws cloudfront update-distribution \
  --id E34RAQL5CJ9YR2 \
  --distribution-config file:///tmp/cf-config-updated.json \
  --if-match "$ETAG"
```

### 3. CloudFront キャッシュを無効化

最新の設定が即座に反映されるようにキャッシュを無効化：

```bash
aws cloudfront create-invalidation \
  --distribution-id E34RAQL5CJ9YR2 \
  --paths "/*"
```

**結果：**
- Invalidation ID: `IC6FG0S5DDJMBVPK33Z35O5N7W`
- Status: `InProgress` → `Completed`

## 🧪 修正後の検証

### CloudFront デフォルトドメインでのテスト ✅

```bash
curl -I https://dqnp19fhc2hkx.cloudfront.net/
```

**結果：**
```
HTTP/2 200 OK
content-type: text/html
content-length: 1106
x-cache: Hit from cloudfront
via: 1.1 36ccdb9f21575bdbc1202eb40db5a1d2.cloudfront.net (CloudFront)
```

✅ **正常に動作** している確認できた

### S3 バケットへの直接アクセステスト ✅

```bash
curl -I http://glean-frontend-827251793719.s3-website-ap-northeast-1.amazonaws.com/index.html
```

**結果：**
```
HTTP/1.1 200 OK
Content-Type: text/html
ETag: "ee9d1ef60398e597eb6a6cbe2bcce39f"
```

✅ S3 側は正常に動作

### S3 バケットの内容確認 ✅

```bash
aws s3 ls s3://glean-frontend-827251793719/ --recursive | grep index.html
```

**結果：**
```
2026-04-16 00:34:33       1106 index.html
```

✅ `index.html` が正しく配置されている

## 📋 修正前後の比較

| 項目 | 修正前 | 修正後 |
|------|--------|---------|
| OriginProtocolPolicy | `https-only` | `http-only` ✅ |
| DefaultRootObject | （空） | `index.html` ✅ |
| CloudFront Status | `InProgress` | `Deployed` ✅ |
| デフォルトドメインへのアクセス | 504 ❌ | 200 ✅ |
| キャッシュ | Error | Hit from cloudfront ✅ |

## 🔗 カスタムドメイン設定の完了

CloudFront が正常に動作するようになったため、カスタムドメイン（`myglean.jp`）を使用するには **お名前.com での DNS 設定** が必要です。

### 対応内容

**お名前.com 管理画面でのDNS設定：**

1. [お名前.com](https://www.onamae.com/) にログイン
2. ドメイン一覧から `myglean.jp` を選択
3. DNS設定 → DNS レコード設定を開く
4. **CNAME レコードを追加**：

```
ホスト名（サブドメイン）: myglean
種別: CNAME
内容: dqnp19fhc2hkx.cloudfront.net
TTL: 3600
```

※ `www.myglean.jp` の場合は `ホスト名: www` に設定

5. 「確認」→「登録」をクリック
6. DNS が反映されるまで待機（通常 5-15 分）

### DNS 反映確認コマンド

```bash
# 反映確認
nslookup myglean.jp
dig myglean.jp

# 正常な応答例
# myglean.jp  canonical name = dqnp19fhc2hkx.cloudfront.net.
```

### 完了後のアクセス確認

```bash
# HTTPS でアクセス可能になる
curl -I https://myglean.jp/

# 期待される応答
# HTTP/2 200 OK
# x-cache: Hit from cloudfront
```

## 📚 参考資料

### 関連設定

- **CloudFront Distribution ID**: `E34RAQL5CJ9YR2`
- **CloudFront DomainName**: `dqnp19fhc2hkx.cloudfront.net`
- **S3 Bucket**: `glean-frontend-827251793719`
- **S3 Static Website Endpoint**: `glean-frontend-827251793719.s3-website-ap-northeast-1.amazonaws.com`
- **ACM Certificate ARN**: `arn:aws:acm:us-east-1:827251793719:certificate/dc94828b-d733-43a6-9cd2-fd760afcae71`
- **カスタムドメイン**: `myglean.jp`, `www.myglean.jp`

### CloudFront Origin 設定（修正後）

```json
{
  "Id": "glean-frontend-827251793719.s3-website-ap-northeast-1.amazonaws.com-mo0xpkwzm4t",
  "DomainName": "glean-frontend-827251793719.s3-website-ap-northeast-1.amazonaws.com",
  "CustomOriginConfig": {
    "HTTPPort": 80,
    "HTTPSPort": 443,
    "OriginProtocolPolicy": "http-only",
    "OriginSslProtocols": ["TLSv1.2"],
    "OriginReadTimeout": 30,
    "OriginKeepaliveTimeout": 5
  }
}
```

### CloudFront Distribution 設定（修正後）

```json
{
  "DefaultRootObject": "index.html",
  "Enabled": true,
  "HttpVersion": "http2and3",
  "ViewerCertificate": {
    "ACMCertificateArn": "arn:aws:acm:us-east-1:827251793719:certificate/dc94828b-d733-43a6-9cd2-fd760afcae71",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "Aliases": {
    "Items": ["myglean.jp", "www.myglean.jp"]
  }
}
```

## ⚠️ 今後の注意点

### S3 静的ウェブサイトエンドポイントを使用する場合

1. **CloudFront Origin のプロトコル設定**
   - OriginProtocolPolicy: `http-only` を使用
   - CustomOriginConfig を設定（S3 の通常のドメイン名ではなく、静的ウェブサイトエンドポイント用）

2. **セキュリティ上の考慮**
   - CloudFront 側で HTTP → HTTPS にリダイレクト
   - Viewer Protocol Policy: `redirect-to-https` を設定
   - エンドユーザーは常に HTTPS でアクセス

3. **キャッシュ設定**
   - DefaultRootObject を必ず設定
   - エラーページ（404.html, 200.html）の配置を確認

### 代替案：S3 RegionalDomainName + OAC

より安全な構成として、S3 の RegionalDomainName を使用し、Origin Access Control（OAC）で署名付きリクエストを送信する方法もあります：

```yaml
Origins:
  - Id: S3Origin
    DomainName: glean-frontend-827251793719.s3.ap-northeast-1.amazonaws.com
    OriginAccessControlId: <OAC_ID>
    # S3OriginConfig（従来の OAI の場合）は使用しない
```

この場合は、HTTPS でのアクセスが可能になり、セキュリティが向上します。

## 📝 トラブルシューティング履歴

| 日時 | 内容 | 結果 |
|------|------|------|
| 2026-04-16 11:15 | OriginProtocolPolicy を `http-only` に変更 | ✅ |
| 2026-04-16 11:16 | DefaultRootObject を `index.html` に設定 | ✅ |
| 2026-04-16 11:17 | CloudFront キャッシュを無効化（/\*） | ✅ |
| 2026-04-16 11:18 | CloudFront 更新完了（Deployed） | ✅ |
| 2026-04-16 11:19 | CloudFront デフォルトドメインでの検証 | ✅ 200 OK |

---

**最終更新：** 2026-04-16  
**作成者：** Claude Code  
**ステータス：** ✅ 修正完了・検証済み
