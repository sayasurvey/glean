# タスク: 投稿一覧・登録機能 (post-management)

- [x] 1. 設定・Firebase基盤の更新
  - File: nuxt.config.ts (変更), src/plugins/firebase.client.ts (変更)
  - nuxt.config.tsのruntimeConfig privateセクションにgeminiApiKeyを追加
  - firebase.client.tsにFirestoreインスタンス初期化とuseFirebaseDb関数を追加
  - Purpose: Gemini APIキーのサーバーサイド保護とFirestoreアクセス基盤の確立
  - _Leverage: src/plugins/firebase.client.ts（既存パターン踏襲）_
  - _Requirements: 要件1（記事登録）, 要件6（Gemini概要生成）_
  - _Prompt: Implement the task for spec post-management, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Nuxt 3 Configuration Expert | Task: Add geminiApiKey from NUXT_GEMINI_API_KEY env var to the private runtimeConfig section in nuxt.config.ts. Also add Firestore initialization to src/plugins/firebase.client.ts by importing getFirestore, initializing dbInstance after app init, and exporting useFirebaseDb function following the same singleton pattern as useFirebaseAuth. | Restrictions: Keep Gemini key in private runtimeConfig not public, follow existing initializeApp with getApps check, do not remove existing config | Success: useFirebaseDb returns Firestore instance, runtimeConfig geminiApiKey accessible in server routes, existing auth still works. Mark task in-progress in tasks.md, log with log-implementation, mark completed._

- [x] 2. 投稿関連の型定義を作成
  - File: src/types/post.ts
  - Post, CreatePostInput, OgpData, GeminiSummaryData, PostErrorMap, TagSuggestionインターフェースを定義
  - Purpose: 投稿機能全体の型安全性を確立する
  - _Leverage: src/types/auth.ts（型定義パターン参照）_
  - _Requirements: 要件1〜6（全要件の型基盤）_
  - _Prompt: Implement the task for spec post-management, first run spec-workflow-guide to get the workflow guide then implement the task: Role: TypeScript Developer specializing in type systems | Task: Create src/types/post.ts with these interfaces: Post with fields id/uid/url/title/description/ogpImageUrl(string or null)/tags(string array)/createdAt(Timestamp)/updatedAt(Timestamp); CreatePostInput as Pick of Post omitting id/uid/createdAt/updatedAt; OgpData with title/description/imageUrl(string or null)/siteName(string or null); GeminiSummaryData with summary string; PostErrorMap as record mapping error code string to Japanese message string; TagSuggestion with name and count fields. Import Timestamp from firebase/firestore using import type. | Restrictions: Follow src/types/auth.ts pattern, use import type for Firebase types, TypeScript strict mode, no classes only interfaces | Success: All interfaces compile, Timestamp used correctly, PostErrorMap follows AuthErrorMap pattern. Mark task in-progress in tasks.md, log with log-implementation, mark completed._

- [x] 3. OGPフェッチサーバーAPIを作成
  - File: server/api/ogp.ts
  - GET /api/ogp?url=encoded-url でOGPメタデータを取得
  - 正規表現でog:title/description/image/site_nameを抽出
  - Purpose: CORSを回避したサーバーサイドOGPフェッチプロキシ
  - _Leverage: Nuxt server routes（defineEventHandler）_
  - _Requirements: 要件1.1（OGP取得）_
  - _Prompt: Implement the task for spec post-management, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Nuxt 3 Server Routes Developer | Task: Create server/api/ogp.ts using defineEventHandler. Accept GET request with query param named url. Validate URL format using try/catch with new URL(). Fetch HTML using $fetch with 8000ms timeout and User-Agent header. Extract og:title, og:description, og:image, og:site_name using regex on the HTML string. Return object with title/description/imageUrl/siteName fields. Handle invalid URL with createError statusCode 400, handle fetch failure by returning partial data with null fallbacks. | Restrictions: No external npm packages for parsing (use regex only), server-side only, validate URL before fetching, do not expose internal errors | Success: Returns correct OGP data for common URLs, handles missing fields with null, proper error codes. Mark task in-progress in tasks.md, log with log-implementation, mark completed._

- [x] 4. Gemini概要生成サーバーAPIを作成
  - File: server/api/gemini.ts
  - POST /api/gemini でOGP情報からGemini APIを使い日本語概要を生成
  - @google/generative-aiパッケージをnpm installして使用
  - Purpose: Gemini APIキーをサーバーサイドに隔離した概要生成エンドポイント
  - _Leverage: nuxt.config.tsのruntimeConfig.geminiApiKey（タスク1で追加）_
  - _Requirements: 要件6（Gemini APIによる概要生成）_
  - _Prompt: Implement the task for spec post-management, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Nuxt 3 Server Developer with Gemini AI expertise | Task: Run npm install @google/generative-ai. Create server/api/gemini.ts using defineEventHandler. Accept POST request with body containing url/ogTitle/ogDescription fields. Read geminiApiKey from useRuntimeConfig(). Initialize GoogleGenerativeAI with the key and use gemini-1.5-flash model. Send a Japanese summarization prompt asking for 150 char summary of the article based on title and description. Return object with summary field. On any API error return empty summary string without throwing. | Restrictions: API key from private runtimeConfig only, never expose to client, validate request body, return empty summary on failure to not block article registration | Success: Returns Japanese summary under 150 chars, key never in client bundle, empty summary on failure. Mark task in-progress in tasks.md, log with log-implementation, mark completed._

- [x] 5. usePosts コンポーザブルを作成
  - File: src/composables/usePosts.ts
  - リアクティブ状態: posts, isLoading, error（ファイルスコープ、useAuthパターン）
  - メソッド: fetchPosts, addPost, deletePost, stopListening
  - onSnapshotによるリアルタイム購読
  - Purpose: 投稿のCRUD操作とFirestoreリアルタイム同期を一元管理
  - _Leverage: src/composables/useAuth.ts（パターン）, src/plugins/firebase.client.ts, src/types/post.ts_
  - _Requirements: 要件1（登録）, 要件2（一覧）, 要件4（削除）_
  - _Prompt: Implement the task for spec post-management, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Vue 3/Nuxt 3 Developer with Firebase Firestore expertise | Task: Create src/composables/usePosts.ts following exact same pattern as useAuth.ts with file-scope refs and readonly exports. State: posts as Ref of Post array, isLoading boolean ref, error string-or-null ref, unsubscribe variable. Methods: fetchPosts(uid) starts onSnapshot query on posts collection filtered by uid ordered by createdAt desc; addPost(url, tags) calls $fetch to /api/ogp then /api/gemini then calls addDoc on posts collection with uid/url/title/description/ogpImageUrl/tags/serverTimestamp fields, then upserts tags using writeBatch; deletePost(postId) checks ownership then calls deleteDoc; stopListening calls unsubscribe. Define PostErrorMap with Japanese error messages. | Restrictions: File-scope state pattern like useAuth, use useFirebaseDb() not getFirestore(), check uid before delete, handle OGP and Gemini failures gracefully by continuing with empty values, modular Firestore API | Success: Real-time updates via onSnapshot, addPost handles partial failures, deletePost checks ownership, Japanese error messages. Mark task in-progress in tasks.md, log with log-implementation, mark completed._

- [x] 6. useSearch コンポーザブルを作成
  - File: src/composables/useSearch.ts
  - keywordとactiveTagsによるクライアントサイドフィルタリング
  - filteredPosts（computed）とavailableTags（computed）を提供
  - Purpose: Firestoreクエリ不要なクライアントサイド検索・フィルタロジック
  - _Leverage: src/types/post.ts_
  - _Requirements: 要件3（検索・フィルタリング）_
  - _Prompt: Implement the task for spec post-management, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Vue 3 Developer specializing in Composition API | Task: Create src/composables/useSearch.ts that accepts posts as a readonly Ref of Post array. Export keyword as string ref, activeTags as string array ref, filteredPosts as computed ref that filters posts by keyword (case-insensitive match against title and description) AND by activeTags (post must contain all active tags), availableTags as computed ref of unique sorted tags from all posts, clearSearch function that resets keyword and activeTags. | Restrictions: Client-side filtering only no Firestore queries, use computed for reactivity, case-insensitive keyword search, AND condition for tags | Success: filteredPosts reacts to keyword and activeTags changes, availableTags reflects current posts, clears correctly. Mark task in-progress in tasks.md, log with log-implementation, mark completed._

- [x] 7. TagInput コンポーネントを作成
  - File: src/components/TagInput.vue
  - タグの追加・削除・入力補完UI
  - Props: modelValue(string array), suggestions(TagSuggestion array), maxTags(number)
  - Purpose: 再利用可能なタグ入力補完コンポーネント
  - _Requirements: 要件5（タグ管理）_
  - _Prompt: Implement the task for spec post-management, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Vue 3 Frontend Developer with Tailwind CSS | Task: Create src/components/TagInput.vue with Vue 3 script setup TypeScript. Props: modelValue as string array for v-model, suggestions as TagSuggestion array for autocomplete, maxTags number defaulting to 10. Features: text input shows dropdown filtered by current input, pressing Enter or comma confirms and adds a new tag, clicking a suggestion adds it, existing tags shown as removable chips with x button, cannot exceed maxTags, no duplicate tags allowed. Emit update:modelValue on any changes. Style with Tailwind CSS. | Restrictions: Vue 3 script setup TypeScript, Tailwind only, emit update:modelValue not direct prop mutation, handle Enter and Backspace keyboard events, enforce max tags limit | Success: Tags add and remove correctly, autocomplete filters by input, v-model bidirectional, max enforced. Mark task in-progress in tasks.md, log with log-implementation, mark completed._

- [x] 8. PostRegistrationForm コンポーネントを作成
  - File: src/components/PostRegistrationForm.vue
  - URL入力→OGPプレビュー確認→保存の3ステップフロー
  - Emits: registered with postId string, cancel
  - Purpose: 記事登録のメインフォームUI（OGP取得・Gemini概要・タグ入力を統合）
  - _Leverage: src/composables/usePosts.ts, src/components/TagInput.vue_
  - _Requirements: 要件1（記事登録）, 要件5（タグ管理）, 要件6（Gemini概要）_
  - _Prompt: Implement the task for spec post-management, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Vue 3 Frontend Developer with Tailwind CSS | Task: Create src/components/PostRegistrationForm.vue with 3-step flow. Step 1 input: URL text input with 確認 button and URL format validation using new URL(). Step 2 loading: spinner while fetching OGP from /api/ogp and summary from /api/gemini. Step 3 preview: show OGP image/title/description preview plus TagInput component plus 登録 and 戻る buttons. On 登録 call usePosts addPost method and emit registered event with postId. Show OGP failure as non-blocking warning. Emit cancel on キャンセル button click. Step state is one of input/loading/preview. | Restrictions: Vue 3 script setup TypeScript, Tailwind only, validate URL before fetching, OGP failure is warning not blocking, use TagInput component | Success: 3-step flow works, OGP preview shows, tags addable, registration emits postId, graceful OGP failure. Mark task in-progress in tasks.md, log with log-implementation, mark completed._

- [x] 9. PostTile・PostList コンポーネントを作成
  - File: src/components/PostTile.vue, src/components/PostList.vue
  - PostTile: OGP画像・タイトル・概要・タグ・削除ボタンのカードUI
  - PostList: レスポンシブグリッドコンテナ（空状態・スケルトンローダー含む）
  - Purpose: 記事一覧のタイル表示UI
  - _Leverage: src/types/post.ts_
  - _Requirements: 要件2（タイル一覧表示）, 要件4（削除）_
  - _Prompt: Implement the task for spec post-management, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Vue 3 Frontend Developer with Tailwind CSS | Task: Create two components. PostTile.vue with props post(Post type) and isOwner(boolean): card layout showing OGP image with gray fallback when null, title, description with 2-line clamp, tag chips. Card click calls window.open with url in new tab. Delete button shown only when isOwner with confirm dialog, emits delete event. Tag chips emit tagClick event. PostList.vue with props posts(Post array), currentUserId(string or null), isLoading(boolean): responsive grid using grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 classes. Shows 3 skeleton cards when isLoading. Shows empty message when posts empty and not loading. Renders PostTile for each post with isOwner computed from post.uid equals currentUserId. Emits deletePost and tagFilter. | Restrictions: Vue 3 script setup TypeScript, Tailwind only, line-clamp for description, confirm dialog before delete | Success: Tiles show OGP images, click opens URL in new tab, delete with confirmation, skeleton and empty states work, responsive grid. Mark task in-progress in tasks.md, log with log-implementation, mark completed._

- [x] 10. PostSearchBar コンポーネントを作成
  - File: src/components/PostSearchBar.vue
  - キーワード検索入力とタグフィルタチップのUI
  - Props: modelValue(string), activeTags(string array), availableTags(string array)
  - Purpose: 検索・フィルタリングのUIコントロール
  - _Requirements: 要件3（検索・フィルタリング）_
  - _Prompt: Implement the task for spec post-management, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Vue 3 Frontend Developer with Tailwind CSS | Task: Create src/components/PostSearchBar.vue with v-model compatible props: modelValue string for keyword, activeTags string array, availableTags string array. Layout: search input with magnifying glass icon and x clear button that appears when text exists. Below the input show tag chips for each availableTag where active tags are highlighted blue and inactive are gray. Clicking a tag toggles it in activeTags. Emit update:modelValue on input changes and emit update:activeTags when tag selection changes. | Restrictions: Vue 3 script setup TypeScript, Tailwind only, do not mutate props directly, v-model compatible emits | Success: Keyword input filters via v-model, tags toggle with visual feedback, active tags highlighted, clear button works. Mark task in-progress in tasks.md, log with log-implementation, mark completed._

- [x] 11. メインページ（index.vue）を更新して全機能を統合
  - File: src/pages/index.vue（変更）
  - PostSearchBar・PostRegistrationForm・PostListを統合
  - usePosts・useSearchを組み合わせて機能を接続
  - Purpose: 投稿一覧・登録・検索を統合したメインページ完成
  - _Leverage: src/composables/usePosts.ts, src/composables/useSearch.ts, src/composables/useAuth.ts, 全Postコンポーネント_
  - _Requirements: 要件1〜5（全機能の統合）_
  - _Prompt: Implement the task for spec post-management, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Nuxt 3 Page Developer | Task: Update src/pages/index.vue to integrate all post-management components. Layout: header with app title and user email and logout button (keep existing), 記事を登録 button that toggles PostRegistrationForm visibility, PostSearchBar wired with v-model for keyword and activeTags, PostList receiving filteredPosts from useSearch and currentUserId from useAuth and isLoading state. On mount call fetchPosts with current user uid. On unmount call stopListening. Handle deletePost event from PostList by calling usePosts deletePost. Handle tagFilter event by adding tag to activeTags. PostRegistrationForm shown as overlay panel, hidden on registered or cancel emit. | Restrictions: Keep existing definePageMeta with auth-client middleware, use navigateTo for logout, call stopListening in onUnmounted, pass filteredPosts not raw posts to PostList | Success: Full flow works end-to-end, search and filter reactive, form shows and hides correctly, auth middleware still active. Mark task in-progress in tasks.md, log with log-implementation, mark completed._

- [x] 12. Firestoreセキュリティルールを作成
  - File: firestore.rules
  - postsコレクション: 認証済みなら全件read可、create/update/deleteは自分のuidのみ
  - tagsコレクション: 認証済みなら読み書き可
  - Purpose: Firestoreデータへの適切なアクセス制御
  - _Requirements: 要件4.4（削除権限）, 非機能要件（セキュリティ）_
  - _Prompt: Implement the task for spec post-management, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Firebase Security Rules Expert | Task: Create firestore.rules with rules_version 2. Rules: users collection allows read and write only when request.auth.uid matches the document uid. posts collection allows read for authenticated users, allows create for authenticated users when the new document uid field equals request.auth.uid and tags size is 10 or less, allows update and delete only when resource.data.uid equals request.auth.uid. tags collection allows read and write for authenticated users. | Restrictions: Follow Firebase security rules syntax, validate uid on create not just update, use request.auth != null for auth checks | Success: Unauthenticated users blocked, authenticated users read all posts, only own posts writable/deletable, tags accessible to authenticated users. Mark task in-progress in tasks.md, log with log-implementation, mark completed._

- [x] 13. usePosts・useSearch のユニットテストを作成
  - File: src/composables/__tests__/usePosts.test.ts, src/composables/__tests__/useSearch.test.ts
  - Firestore・$fetchをvi.mockで完全モック
  - 成功・失敗・権限なしの各ケースをテスト
  - Purpose: 投稿管理ロジックの信頼性を担保
  - _Leverage: src/composables/__tests__/useAuth.test.ts（テストパターン）_
  - _Requirements: 要件1〜4（CRUD）, 要件3（検索）_
  - _Prompt: Implement the task for spec post-management, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Vue/Nuxt Testing Expert with Vitest | Task: Create two test files. usePosts.test.ts: mock firebase/firestore module (addDoc, deleteDoc, onSnapshot, collection, query, orderBy, where, writeBatch, serverTimestamp) and mock $fetch for /api/ogp and /api/gemini endpoints. Test cases: addPost success, addPost continues when OGP fails, addPost continues when Gemini fails, deletePost success, deletePost fails when wrong owner, fetchPosts starts onSnapshot. Use vi.mock and beforeEach vi.clearAllMocks following useAuth.test.ts pattern. useSearch.test.ts: test keyword filter is case-insensitive, test tag AND filter, test combined keyword and tag filter, test clearSearch resets both, test availableTags computation. | Restrictions: Vitest only, mock all Firebase and $fetch completely, test in isolation, follow existing test file structure | Success: All methods tested for success and failure, partial failures handled, search logic verified. Mark task in-progress in tasks.md, log with log-implementation, mark completed._

- [x] 14. E2Eテストを作成
  - File: e2e/posts.spec.ts
  - URL登録フロー・タイル一覧・検索フィルタ・削除フロー
  - Purpose: ユーザー視点での投稿管理フロー全体の検証
  - _Leverage: e2e/auth.spec.ts（テストパターン）, Playwright_
  - _Requirements: 要件1〜4_
  - _Prompt: Implement the task for spec post-management, first run spec-workflow-guide to get the workflow guide then implement the task: Role: E2E Testing Expert with Playwright | Task: Create e2e/posts.spec.ts following the pattern of e2e/auth.spec.ts. Test flows: URL registration flow starting from login, clicking 記事を登録, entering a URL, clicking 確認, verifying OGP preview appears, adding tags, clicking 登録, and verifying tile appears in the list. Search flow entering keyword and verifying tiles filter. Tag filter flow clicking a tag chip and verifying filter applies. Delete flow clicking delete button, confirming the dialog, and verifying tile is removed from list. | Restrictions: Playwright only, test real UI workflows, do not check internal state, use page locators | Success: All user journeys tested, reliable and maintainable, covers happy path and basic error scenarios. Mark task in-progress in tasks.md, log with log-implementation, mark completed._
