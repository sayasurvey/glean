<script setup lang="ts">
definePageMeta({
  middleware: 'auth-client',
})

const { currentUser, logout } = useAuth()
const { posts, isLoading, error, fetchPosts, deletePost, stopListening } = usePosts()
const { keyword, filteredPosts } = useSearch(posts)

const showRegistrationForm = ref(false)

// currentUser が解決された時点で fetchPosts を呼ぶ（リロード時の認証タイミングに依存しない）
watch(
  () => currentUser.value?.uid,
  (uid) => {
    if (uid) {
      fetchPosts(uid)
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  stopListening()
})

const handleLogout = async () => {
  await logout()
  await navigateTo('/login')
}

const handleRegistered = () => {
  showRegistrationForm.value = false
}

const handleDeletePost = async (postId: string) => {
  await deletePost(postId)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- ヘッダー -->
    <header class="border-b border-gray-200 bg-white px-6 py-4">
      <div class="mx-auto flex max-w-6xl items-center justify-between">
        <img src="~/assets/logo.png" alt="myGlean" class="h-10" />
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-600">{{ currentUser?.email }}</span>
          <button
            class="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
            @click="handleLogout"
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-6 py-8">
      <!-- 登録フォームパネル -->
      <div v-if="showRegistrationForm" class="mb-6">
        <PostRegistrationForm
          @registered="handleRegistered"
          @cancel="showRegistrationForm = false"
        />
      </div>

      <!-- アクションバー -->
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-800">記事一覧</h2>
        <button
          v-if="!showRegistrationForm"
          class="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          @click="showRegistrationForm = true"
        >
          + 記事を登録
        </button>
      </div>

      <!-- 検索・フィルタ -->
      <div class="mb-6">
        <PostSearchBar v-model="keyword" />
      </div>

      <!-- エラー表示 -->
      <p v-if="error" class="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ error }}
      </p>

      <!-- 記事一覧 -->
      <PostList
        :posts="filteredPosts"
        :current-user-id="currentUser?.uid ?? null"
        :is-loading="isLoading"
        @delete-post="handleDeletePost"
      />
    </main>
  </div>
</template>
