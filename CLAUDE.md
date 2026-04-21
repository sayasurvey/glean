# プロジェクト概要
エンジニアやAIなどITに関心を持っている人が技術ブログなどを自分用にブログの記事一覧の形でOGPの画像と概要説明をタイル形式で表示するアプリ
タイルを選択するともとの記事や投稿を新しいタブで開く

> このファイルは変更ログとして使用しない。変更履歴はCHANGELOG.mdに記録すること。

## ディレクトリ構成

| ディレクトリ | 役割 |
|-------------|------|
| src/components/ | Vueコンポーネント |
| src/composables/ | カスタムフック |
| src/api/ | API呼び出しロジック |
| src/types/ | TypeScript型定義 |
| src/utils/ | 汎用ユーティリティ |

## 技術スタック

- Nuxt
- Vue
- TypeScript 5 (strictモード)
- Tailwind CSS
- Vite
- Vitest
- Playwright

## 設計原則

- 関係する技術などはタグをつける
- タイトルやタグ、Geminiにまとめてもらった投稿の概要を検索することができる
- 認証やデータの登録はfirebaseを使用する
- Google認証とメールアドレスの認証ができる
- 投稿の概要はGeminiのAPIでまとめる

## コーディング規約

- 2スペースインデント
- セミコロン省略
- 関数コンポーネントはアロー関数で定義
- propsの型定義は必須

## よく使うコマンド

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm test` | テスト実行 |
| `npm run lint` | ESLint実行 |
| `npm run build` | 本番ビルド |

## トラブルシューティング

### デプロイ後に画面が真っ白になる

**原因**: `npm run dev`（開発サーバー）が起動中のまま `nuxt generate` を実行すると、
devモードの `.nuxt` キャッシュがビルドに混入し、HTMLが `@vite/client` や
`/_nuxt/Users/yona/glean/node_modules/...` などの開発専用パスを参照してしまう。

**確認方法**:
```bash
# CloudFrontのHTMLにdevパスが含まれているか確認
curl -s https://<CloudFront URL>/ | grep -o 'src="/_nuxt/[^"]*"'
# → ハッシュ付きファイル名（例: t9NwAA9h.js）ならOK
# → @vite/client や絶対パス（/Users/...）なら問題あり
```

**対処法**:
```bash
# 1. devサーバーを停止
pkill -f "nuxt dev"

# 2. キャッシュを完全クリア
rm -rf .nuxt .output node_modules/.cache

# 3. 再デプロイ
bash infra/scripts/deploy-frontend-staging.sh  # ステージング
bash infra/scripts/deploy-frontend.sh           # 本番
```

デプロイスクリプトはこの対処を自動で行うよう修正済みだが、
スクリプト外で手動ビルドする場合は上記の手順を実施すること。

## GitHubのPRのテンプレート
### 概要
<!-- PRの背景・目的・概要 -->
### 関連タスク
<!-- 関連するIssueやチケットのリンクを貼る。Issueの場合は、「#<IssueNumber>」でリンクできる -->
### やったこと
<!-- このPRで何をしたのか？ -->
### やらないこと
<!-- このPRでやらないことは何か？ -->
### 影響範囲
<!-- 影響を及ぼす範囲や他の機能への影響 -->
### テスト
<!-- テスト方法や結果 -->
### スクショまたは動画
<!-- 画面のスクショや動画 -->
### 備考
<!-- レビュワーへの伝達事項や残しておきたい情報 -->

