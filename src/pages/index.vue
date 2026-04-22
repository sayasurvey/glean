<script setup lang="ts">
definePageMeta({
  middleware: 'auth-client',
})

const { currentUser, logout } = useAuth()
const { posts, isLoading, error, fetchPosts, deletePost, stopListening } = usePosts()
const { keyword, filteredPosts: searchFiltered } = useSearch(posts)

const showRegistrationForm = ref(false)
const sortOrder = ref('新着順')
const currentPage = ref(1)
const PAGE_SIZE = 24

watch(
  () => currentUser.value?.uid,
  (uid) => {
    if (uid) fetchPosts(uid)
  },
  { immediate: true }
)

onUnmounted(() => stopListening())

const filteredPosts = computed(() => {
  let list = searchFiltered.value

  if (sortOrder.value === 'タイトル順') {
    list = [...list].sort((a, b) => a.title.localeCompare(b.title, 'ja'))
  } else if (sortOrder.value === '古い順') {
    list = [...list].sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis())
  }
  return list
})

const totalPages = computed(() => Math.ceil(filteredPosts.value.length / PAGE_SIZE))

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredPosts.value.slice(start, start + PAGE_SIZE)
})

const paginationPages = computed<(number | '...')[]>(() => {
  const total = totalPages.value
  const current = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

watch(filteredPosts, () => { currentPage.value = 1 })

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
  <div class="min-h-screen bg-paper">
    <!-- Topbar -->
    <header class="sticky top-0 z-30 border-b border-rule bg-paper">
      <div class="mx-auto flex max-w-[1240px] items-center gap-4 px-7 py-3.5">
        <!-- Brand -->
        <a href="#" class="flex flex-shrink-0 items-center no-underline">
          <img src="~/assets/logo.png" alt="myGlean" class="h-10" />
        </a>

        <!-- Search -->
        <div class="relative max-w-[540px] flex-1">
          <svg class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input
            v-model="keyword"
            type="text"
            placeholder="タイトル・概要・タグで検索…"
            class="h-10 w-full rounded-full border border-rule bg-white pl-10 pr-9 text-sm text-ink outline-none transition-all placeholder:text-ink-3 hover:border-brand-300 focus:border-brand-600 focus:bg-white focus:shadow-[0_0_0_4px_rgba(45,90,61,.12)]"
          />
          <button
            v-if="keyword"
            type="button"
            class="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-3 hover:bg-brand-50 hover:text-ink"
            @click="keyword = ''"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        <!-- Actions (右端) -->
        <div class="ml-auto flex flex-shrink-0 items-center gap-2">
          <span class="hidden text-sm text-ink-3 sm:block">{{ currentUser?.email }}</span>
          <button
            class="flex h-9 w-9 items-center justify-center rounded-[10px] text-ink-2 transition-all hover:bg-brand-50 hover:text-brand-800"
            title="ログアウト"
            @click="handleLogout"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1240px] px-7 py-7 pb-20">
      <!-- 登録フォーム -->
      <div v-if="showRegistrationForm" class="mb-6">
        <PostRegistrationForm
          @registered="handleRegistered"
          @cancel="showRegistrationForm = false"
        />
      </div>

      <!-- ページヘッド -->
      <div class="mb-4 flex flex-wrap items-end justify-between gap-6">
        <h1 class="m-0 flex items-baseline gap-2.5 text-[22px] font-bold tracking-tight text-ink">
          記事一覧
          <span class="font-inter rounded-full bg-brand-50 px-2.5 py-0.5 text-[13px] font-medium text-ink-3">
            {{ filteredPosts.length }} 件
          </span>
        </h1>
        <div class="flex items-center gap-3">
          <button
            v-if="!showRegistrationForm"
            class="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-brand-800 bg-brand-700 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-brand-800 active:translate-y-0"
            @click="showRegistrationForm = true"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            記事を登録
          </button>
          <div class="flex items-center gap-2 text-[13px] text-ink-3">
            並び替え:
            <select
              v-model="sortOrder"
              class="cursor-pointer appearance-none rounded-lg border border-rule bg-white px-2.5 py-1.5 text-[13px] text-ink outline-none transition-all hover:border-brand-300 focus:border-brand-600 focus:shadow-[0_0_0_3px_rgba(45,90,61,.12)]"
              style="background-image: url('data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%276%27 viewBox=%270 0 10 6%27%3E%3Cpath d=%27M1 1l4 4 4-4%27 stroke=%27%23768279%27 stroke-width=%271.5%27 fill=%27none%27 stroke-linecap=%27round%27/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px;"
            >
              <option>新着順</option>
              <option>古い順</option>
              <option>タイトル順</option>
            </select>
          </div>
        </div>
      </div>

      <!-- エラー -->
      <p v-if="error" class="mb-4 rounded-[10px] bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ error }}
      </p>

      <!-- 記事一覧 -->
      <PostList
        :posts="paginatedPosts"
        :current-user-id="currentUser?.uid ?? null"
        :is-loading="isLoading"
        @delete-post="handleDeletePost"
      />

      <!-- ページネーション -->
      <div v-if="totalPages > 1" class="mt-8 flex items-center justify-center gap-1">
        <button
          class="flex h-9 w-9 items-center justify-center rounded-lg border border-rule bg-white text-ink-2 transition-all hover:border-brand-300 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <template v-for="(page, i) in paginationPages" :key="i">
          <span
            v-if="page === '...'"
            class="flex h-9 w-9 items-center justify-center text-[13px] text-ink-3"
          >…</span>
          <button
            v-else
            class="flex h-9 w-9 items-center justify-center rounded-lg border text-[13px] font-medium transition-all"
            :class="page === currentPage
              ? 'border-brand-700 bg-brand-700 text-white'
              : 'border-rule bg-white text-ink-2 hover:border-brand-300 hover:bg-brand-50'"
            @click="currentPage = page"
          >
            {{ page }}
          </button>
        </template>
        <button
          class="flex h-9 w-9 items-center justify-center rounded-lg border border-rule bg-white text-ink-2 transition-all hover:border-brand-300 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      <!-- フッター -->
      <footer class="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-7 text-[12px] text-ink-3">
        <div>myGlean · 自分のための技術記事書庫</div>
      </footer>
    </main>
  </div>
</template>
