# Firebase 設定ガイド

Google認証がうまくいかない場合の対応手順

## 1. 認可済みドメインの設定

Firebase Console で以下を設定してください：

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 対象のプロジェクト（`glean-e78f5`）を選択
3. 左メニューから **Authentication** → **Settings** をクリック
4. **承認済みドメイン** セクションまでスクロール
5. 以下のドメインが両方追加されているか確認：
   - `myglean.jp`
   - `www.myglean.jp`

ドメインがない場合は、右下の **+追加 URL** ボタンから追加してください。

## 2. OAuth 設定の確認

1. **Authentication** → **Sign-in method** をクリック
2. **Google** が有効（ブルー）になっているか確認
3. サポートメール が設定されているか確認

## 3. Google Cloud Console でのリダイレクト URI 設定

Firebase Authentication は自動的に Google Cloud Console と連携しています。しかし、念のため確認してください：

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクト `glean-e78f5` を選択
3. **APIs & Services** → **Credentials** をクリック
4. Web アプリケーション認証情報をクリック
5. **Authorized JavaScript origins** に以下が含まれているか確認：
   - `https://myglean.jp`
   - `https://www.myglean.jp`

6. **Authorized redirect URIs** に以下が含まれているか確認：
   - `https://glean-e78f5.firebaseapp.com/__/auth/handler`
   - `https://www.myglean.jp/`（ホームページURL）

不足している場合は追加してください。

## 4. 環境変数の確認

`.env` ファイルで以下の値が正しく設定されているか確認：

```
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=glean-e78f5.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=glean-e78f5
```

## 5. デバッグ方法

ブラウザで Google 認証がうまくいかない場合：

1. `https://www.myglean.jp/login/` を開く
2. F12 キーでブラウザの開発者ツールを開く
3. **Console** タブを確認
4. ログインページの右下の **デバッグ** ボタンをクリック
5. 認証状態とエラーメッセージを確認

ブラウザコンソールに出力されるログから、以下を確認してください：

- `[Firebase] アプリケーション初期化完了` - Firebase が正常に初期化されている
- `[Auth] Google認証開始...` - Google 認証がトリガーされている
- `[Auth] ポップアップ認証成功:` または `[Auth] リダイレクト認証成功:` - 認証が成功している
- エラーメッセージが表示されている場合は、その内容を確認

## 6. よくあるエラーと対応

### `auth/unauthorized-domain` エラー
**原因**: Firebase Console で承認済みドメインが設定されていない

**対応**: 上記の「認可済みドメインの設定」を実施

### `auth/operation-not-allowed` エラー
**原因**: Firebase Authentication で Google サインインが有効になっていない

**対応**: Firebase Console → Authentication → Sign-in method → Google を有効にする

### ポップアップがブロックされる
**原因**: ブラウザのポップアップ設定

**対応**: ブラウザのポップアップ許可設定を確認、または自動的にリダイレクト認証に切り替わります

## 7. デプロイ後の動作確認

本番環境にデプロイ後、以下を確認してください：

1. `https://www.myglean.jp/login/` を開く
2. 「Googleでログイン」ボタンをクリック
3. Google ログイン画面が表示される
4. Google アカウントでログイン
5. ホームページ（`/`）にリダイレクトされることを確認
