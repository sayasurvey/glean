# glean

エンジニアやAIなどITに関心を持っている人が、技術ブログなどの記事をOGP画像と概要説明をタイル形式で表示・管理するアプリです。  
タイルを選択すると元の記事を新しいタブで開きます。

## スクリーンショット

### ログイン

<img width="1359" height="789" alt="ログイン画面" src="https://github.com/user-attachments/assets/36a38bcc-d521-4ec6-af7a-259dc9a79f66" />

### 記事一覧

<img width="1357" height="787" alt="記事一覧画面" src="https://github.com/user-attachments/assets/22ea2d8c-3f93-4697-9bd2-107fdf7e921f" />

## 機能

- **記事一覧のタイル表示** — OGP画像・タイトル・概要・タグをカード形式で表示
- **URL登録** — URLを入力するとOGPを自動取得し、Gemini AIが記事概要を生成
- **タグ管理** — 記事にタグを付けて分類
- **検索** — タイトル・タグ・概要によるキーワード検索
- **ページネーション** — 記事一覧のページ分割表示
- **ユーザー認証** — Google認証・メールアドレス/パスワード認証・パスワードリセット

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Nuxt 3 / Vue 3 |
| 言語 | TypeScript 5（strictモード） |
| スタイル | Tailwind CSS |
| 認証・DB | Firebase Authentication / Firestore |
| AI | Gemini API（記事概要の自動生成） |
| OGP取得 | AWS Lambda |
| ホスティング | AWS S3 + CloudFront |
| テスト | Vitest / Playwright |
| 開発環境 | Docker |

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/sayasurvey/glean.git
cd glean
```

### 2. 環境変数を設定

`.env.example` をコピーして `.env` を作成し、各値を設定します。

```bash
cp .env.example .env
```

| 変数名 | 説明 |
|--------|------|
| `NUXT_PUBLIC_GTAG_ID` | Google Analytics の測定ID |
| `NUXT_PUBLIC_FIREBASE_API_KEY` | Firebase API キー |
| `NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth ドメイン |
| `NUXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase プロジェクトID |
| `NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage バケット |
| `NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `NUXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin SDK のサービスアカウントキー（JSON を1行に圧縮）|

### 3. Docker で起動

```bash
docker compose up
```

ブラウザで `http://localhost:3000` を開きます。

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm test` | ユニットテスト実行 |
| `npm run test:e2e` | E2Eテスト実行 |
| `npm run lint` | ESLint実行 |
| `npm run build` | 本番ビルド |
| `npm run generate` | 静的ファイル生成 |

## ディレクトリ構成

```
src/
├── components/     # Vueコンポーネント
├── composables/    # カスタムフック
├── middleware/     # ルートガード
├── pages/          # ページコンポーネント
├── plugins/        # Nuxtプラグイン
├── types/          # TypeScript型定義
└── utils/          # 汎用ユーティリティ
server/
└── api/            # サーバーサイドAPI（OGP取得・Gemini連携）
infra/              # AWSインフラ構成（SAM / デプロイスクリプト）
e2e/                # Playwright E2Eテスト
```

## デプロイ

本番環境は AWS S3 + CloudFront でホストしています。

```bash
# ステージング
bash infra/scripts/deploy-frontend-staging.sh

# 本番
bash infra/scripts/deploy-frontend.sh
```

デプロイスクリプトはdevサーバーの停止・キャッシュクリア・CloudFrontキャッシュ無効化を自動で行います。
