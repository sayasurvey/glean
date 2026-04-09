# プロジェクト概要
エンジニアやAIなどITに関心を持っている人が技術ブログやXの投稿などを自分用にブログの記事一覧の形でOGPの画像と概要説明をタイル形式で表示するアプリ
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
