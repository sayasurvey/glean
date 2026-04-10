# タスク: ユーザー認証機能

- [x] 1. 認証関連の型定義を作成
  - File: src/types/auth.ts
  - `UserProfile`、`AuthErrorMap`のTypeScriptインターフェースを定義
  - Firebase Authのユーザー型を拡張した型を定義
  - Purpose: 認証機能全体の型安全性を確立する
  - _Requirements: 要件1〜6_
  - _Prompt: Role: TypeScript Developer specializing in type systems | Task: Create TypeScript interfaces for UserProfile (Firestore), AuthErrorMap (Firebase error code → Japanese message mapping) following the design document data models. Use Firebase Auth's User type from firebase/auth. | Restrictions: Do not create unnecessary wrapper types, use Firebase SDK's built-in types where possible, follow project's strict TypeScript mode | Success: All interfaces compile without errors, proper use of Firebase types, full type coverage for auth feature_

- [x] 2. Firebaseプラグインを作成
  - File: src/plugins/firebase.client.ts
  - Firebaseアプリの初期化（環境変数から設定値を取得）
  - Firebase Authインスタンスの提供（`useFirebaseAuth()`）
  - `.client.ts`サフィックスでクライアントサイド専用とする
  - Purpose: Firebase SDKの初期化とAuthインスタンスのアプリ全体への提供
  - _Requirements: 要件5（認証状態の管理）_
  - _Prompt: Role: Nuxt 3 Developer with Firebase expertise | Task: Create a Nuxt 3 client-side plugin that initializes Firebase app using NUXT_PUBLIC_ environment variables and provides Firebase Auth instance via useFirebaseAuth() composable. Use Firebase modular API (v10). | Restrictions: Must use .client.ts suffix for client-only execution, use runtimeConfig for env vars, do not initialize Firebase if already initialized, use modular imports (firebase/app, firebase/auth) for tree-shaking | Success: Firebase initializes correctly on client, Auth instance is accessible throughout the app, no SSR errors_

- [x] 3. useAuth Composableを作成
  - File: src/composables/useAuth.ts
  - リアクティブ状態: `currentUser`, `isAuthenticated`, `isLoading`, `error`
  - メソッド: `loginWithGoogle()`, `loginWithEmail()`, `signupWithEmail()`, `logout()`, `resetPassword()`, `resendVerificationEmail()`
  - `onAuthStateChanged`による認証状態の監視
  - Firebaseエラーコードから日本語メッセージへのマッピング
  - Purpose: 認証に関するすべてのロジックとリアクティブ状態を一元管理
  - _Leverage: src/plugins/firebase.client.ts, src/types/auth.ts_
  - _Requirements: 要件1〜6_
  - _Prompt: Role: Vue 3/Nuxt 3 Developer with Composables expertise | Task: Implement useAuth composable with all auth methods (Google login, email login, signup, logout, password reset, resend verification) and reactive state (currentUser, isAuthenticated, isLoading, error). Use Firebase modular API, map Firebase error codes to Japanese messages per design doc error handling section. Use onAuthStateChanged for auth state monitoring. | Restrictions: Must use Vue 3 Composition API, handle all 7 error scenarios from design doc, use GoogleAuthProvider for Google login popup, do not expose Firebase internals to consumers | Success: All auth methods work correctly, error messages display in Japanese, auth state is reactive and synced with Firebase_

- [x] 4. Firestoreユーザープロファイル作成ロジックを追加
  - File: src/composables/useAuth.ts（タスク3に追加）
  - 初回Google認証時にFirestoreにUserProfileドキュメントを作成
  - 初回メールサインアップ時にFirestoreにUserProfileドキュメントを作成
  - Purpose: ユーザープロファイルデータの永続化
  - _Leverage: src/types/auth.ts_
  - _Requirements: 要件1.3, 要件2.4_
  - _Prompt: Role: Firebase Developer with Firestore expertise | Task: Add Firestore user profile creation to useAuth composable. On first Google login or email signup, create a UserProfile document in 'users' collection with uid, email, displayName, photoURL, provider, createdAt, updatedAt. Check if profile exists before creating to avoid duplicates. | Restrictions: Use Firebase modular API (doc, setDoc, getDoc from firebase/firestore), handle Firestore errors gracefully, do not overwrite existing profiles | Success: UserProfile is created on first auth, subsequent logins do not duplicate profiles, Firestore operations handle errors properly_

- [x] 5. 認証ミドルウェアを作成
  - File: src/middleware/auth.client.ts
  - 未認証ユーザーの保護ページアクセスをブロック
  - 認証状態ロード完了まで待機してからリダイレクト判定
  - 未認証時は`/login`にリダイレクト
  - Purpose: ルートガードによる保護ページのアクセス制御
  - _Leverage: src/composables/useAuth.ts_
  - _Requirements: 要件5.3_
  - _Prompt: Role: Nuxt 3 Developer specializing in middleware | Task: Create a client-side route middleware (auth.client.ts) that checks authentication state using useAuth composable. Wait for isLoading to be false before checking isAuthenticated. Redirect to /login if not authenticated. | Restrictions: Must use .client.ts suffix for SPA/S3 deployment compatibility, use defineNuxtRouteMiddleware, handle the async auth state loading properly, do not block rendering unnecessarily | Success: Protected pages redirect to login when unauthenticated, authenticated users can access protected pages, no flash of protected content_

- [x] 6. AuthLoginFormコンポーネントを作成
  - File: src/components/AuthLoginForm.vue
  - メールアドレス/パスワード入力フォーム
  - バリデーション（メール形式、パスワード必須）
  - ローディング状態とエラー表示
  - ログイン成功時に`emit('success')`
  - Purpose: メール認証のログインUI
  - _Leverage: src/composables/useAuth.ts_
  - _Requirements: 要件3_
  - _Prompt: Role: Vue 3 Frontend Developer with Tailwind CSS | Task: Create AuthLoginForm component with email/password inputs, client-side validation, loading state, error display, and success emit. Style with Tailwind CSS. Use useAuth composable for loginWithEmail. Show link to signup and password reset pages. | Restrictions: Use Vue 3 script setup with TypeScript, Tailwind CSS only for styling, emit success event on login, display Japanese error messages from useAuth | Success: Form validates inputs, shows loading during auth, displays errors from Firebase, emits success on login, responsive design_

- [x] 7. AuthSignupFormコンポーネントを作成
  - File: src/components/AuthSignupForm.vue
  - メールアドレス/パスワード/パスワード確認入力フォーム
  - バリデーション（メール形式、パスワード8文字以上、パスワード一致確認）
  - ローディング状態とエラー表示
  - サインアップ成功時に`emit('success')`
  - Purpose: メール認証のサインアップUI
  - _Leverage: src/composables/useAuth.ts_
  - _Requirements: 要件2_
  - _Prompt: Role: Vue 3 Frontend Developer with Tailwind CSS | Task: Create AuthSignupForm component with email, password, and password confirmation inputs. Validate email format, password minimum 8 characters, and password match. Use useAuth composable for signupWithEmail. Show success message about verification email. | Restrictions: Use Vue 3 script setup with TypeScript, Tailwind CSS only, emit success event, display validation errors in Japanese, include link to login page | Success: Form validates all inputs correctly, shows loading state, handles signup errors, emits success with verification email notice_

- [x] 8. AuthResetPasswordFormコンポーネントを作成
  - File: src/components/AuthResetPasswordForm.vue
  - メールアドレス入力フォーム
  - 送信完了メッセージの表示
  - 送信完了時に`emit('sent')`
  - Purpose: パスワードリセットメール送信UI
  - _Leverage: src/composables/useAuth.ts_
  - _Requirements: 要件6_
  - _Prompt: Role: Vue 3 Frontend Developer with Tailwind CSS | Task: Create AuthResetPasswordForm component with email input. On submit, call resetPassword from useAuth. Always show success message regardless of email existence (security). Include link back to login page. | Restrictions: Use Vue 3 script setup with TypeScript, Tailwind CSS only, emit sent event, do not reveal whether email exists in system, display Japanese messages | Success: Form sends reset email, shows generic success message for security, handles errors gracefully, links back to login_

- [x] 9. AuthGoogleButtonコンポーネントを作成
  - File: src/components/AuthGoogleButton.vue
  - Googleログインボタンの表示
  - ローディング状態の管理
  - ログイン成功時に`emit('success')`
  - Purpose: Google認証のワンクリックログインUI
  - _Leverage: src/composables/useAuth.ts_
  - _Requirements: 要件1_
  - _Prompt: Role: Vue 3 Frontend Developer with Tailwind CSS | Task: Create AuthGoogleButton component with a styled Google login button. Use useAuth composable for loginWithGoogle. Show loading state during authentication. Handle popup cancel gracefully (no error shown). | Restrictions: Use Vue 3 script setup with TypeScript, Tailwind CSS only, emit success event, include Google icon/branding, handle popup-closed-by-user silently | Success: Button triggers Google popup login, shows loading state, emits success, handles cancel without error, accessible and well-styled_

- [x] 10. ログインページを作成
  - File: src/pages/login.vue
  - AuthLoginFormとAuthGoogleButtonを配置
  - ログイン成功時にメイン画面（`/`）へ遷移
  - 認証済みユーザーは自動的にメイン画面へリダイレクト
  - サインアップページ・パスワードリセットページへのリンク
  - Purpose: ログインページの統合
  - _Leverage: src/components/AuthLoginForm.vue, src/components/AuthGoogleButton.vue_
  - _Requirements: 要件1, 要件3_
  - _Prompt: Role: Nuxt 3 Page Developer | Task: Create login page composing AuthLoginForm and AuthGoogleButton components. Redirect to / on successful login. If already authenticated, redirect to / immediately. Add divider between email and Google login sections. Include links to /signup and /reset-password. | Restrictions: Use Nuxt 3 page conventions, Tailwind CSS for layout, use navigateTo for redirects, check auth state on mount | Success: Page displays both login methods, redirects on success, redirects if already authenticated, responsive layout_

- [x] 11. サインアップページを作成
  - File: src/pages/signup.vue
  - AuthSignupFormとAuthGoogleButtonを配置
  - サインアップ成功時にメール確認待ち画面を表示
  - ログインページへのリンク
  - Purpose: サインアップページの統合
  - _Leverage: src/components/AuthSignupForm.vue, src/components/AuthGoogleButton.vue_
  - _Requirements: 要件2_
  - _Prompt: Role: Nuxt 3 Page Developer | Task: Create signup page composing AuthSignupForm and AuthGoogleButton components. On email signup success, show verification email sent message. On Google signup, redirect to /. Include link to /login. | Restrictions: Use Nuxt 3 page conventions, Tailwind CSS, handle both signup flows differently (email needs verification, Google is immediate) | Success: Page displays both signup methods, handles email verification flow, redirects Google signups, responsive layout_

- [x] 12. パスワードリセットページを作成
  - File: src/pages/reset-password.vue
  - AuthResetPasswordFormを配置
  - ログインページへの戻りリンク
  - Purpose: パスワードリセットページの統合
  - _Leverage: src/components/AuthResetPasswordForm.vue_
  - _Requirements: 要件6_
  - _Prompt: Role: Nuxt 3 Page Developer | Task: Create reset-password page with AuthResetPasswordForm component. Include prominent link back to /login. Simple, focused layout. | Restrictions: Use Nuxt 3 page conventions, Tailwind CSS, minimal page with clear purpose | Success: Page displays reset form, links back to login, clean and focused layout_

- [x] 13. Nuxt設定をSPAモードに更新
  - File: nuxt.config.ts（既存ファイルを修正）
  - `ssr: false`を設定
  - Firebase環境変数の`runtimeConfig`設定を追加
  - Purpose: S3静的ホスティング対応のSPAモード設定
  - _Requirements: デプロイメント要件_
  - _Prompt: Role: Nuxt 3 Configuration Expert | Task: Update nuxt.config.ts to set ssr: false for SPA mode. Add runtimeConfig.public with all Firebase environment variables (NUXT_PUBLIC_FIREBASE_API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID). | Restrictions: Do not remove existing configuration, only add/modify what's needed for auth and SPA mode | Success: App runs in SPA mode, Firebase config is accessible via useRuntimeConfig(), nuxt generate produces static files_

- [x] 14. useAuthコンポーザブルのユニットテストを作成
  - File: src/composables/__tests__/useAuth.test.ts
  - 各認証メソッドの成功・失敗テスト
  - エラーメッセージマッピングのテスト
  - 認証状態変更監視のテスト
  - Firebase Authのモック化
  - Purpose: 認証ロジックの信頼性を担保
  - _Leverage: src/composables/useAuth.ts_
  - _Requirements: 要件1〜6_
  - _Prompt: Role: Vue/Nuxt Testing Expert with Vitest | Task: Write comprehensive unit tests for useAuth composable. Mock Firebase Auth SDK (signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut, sendPasswordResetEmail, sendEmailVerification, onAuthStateChanged). Test all methods for success and failure. Test Japanese error message mapping. | Restrictions: Use Vitest, mock Firebase completely, test each method independently, cover all 7 error scenarios from design doc | Success: All auth methods tested for success/failure, error mapping verified, auth state changes tested, good coverage_

- [x] 15. 認証ミドルウェアの統合テストを作成
  - File: src/middleware/__tests__/auth.client.test.ts
  - 未認証時のリダイレクトテスト
  - 認証済み時のアクセス許可テスト
  - ローディング中の動作テスト
  - Purpose: ルートガードの正確な動作を検証
  - _Leverage: src/middleware/auth.client.ts, src/composables/useAuth.ts_
  - _Requirements: 要件5.3_
  - _Prompt: Role: Nuxt 3 Testing Expert | Task: Write integration tests for auth middleware. Test redirect to /login when unauthenticated, allow access when authenticated, wait for auth loading to complete before redirecting. Mock useAuth composable state. | Restrictions: Use Vitest, mock useAuth composable, test middleware behavior in isolation | Success: All redirect scenarios tested, loading state handling verified, middleware works correctly for all auth states_

- [x] 16. E2Eテストを作成
  - File: e2e/auth.spec.ts
  - メール/パスワードサインアップフロー
  - メール/パスワードログインフロー
  - パスワードリセットフロー
  - 未認証リダイレクトフロー
  - ログアウトフロー
  - Purpose: ユーザー視点での認証フロー全体の検証
  - _Requirements: 要件1〜6_
  - _Prompt: Role: E2E Testing Expert with Playwright | Task: Write Playwright E2E tests for auth flows: email signup, email login, password reset, unauthenticated redirect, and logout. Use Firebase Auth Emulator for testing. | Restrictions: Use Playwright, set up Firebase Emulator for test isolation, test real user workflows, do not test internal implementation | Success: All auth user journeys tested end-to-end, tests run against Firebase Emulator, reliable and maintainable tests_
