<script setup lang="ts">
import type { Post } from '~/types/post'

interface Props {
  posts: Post[]
  currentUserId: string | null
  isLoading: boolean
  isFiltering: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  deletePost: [postId: string]
  tagFilter: [tag: string]
}>()
</script>

<template>
  <div>
    <!-- スケルトンローダー -->
    <div v-if="isLoading" class="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="n in 6"
        :key="n"
        class="overflow-hidden rounded-2xl border border-rule bg-white"
      >
        <div class="aspect-[2/1] w-full animate-pulse bg-brand-50"></div>
        <div class="p-4 space-y-3">
          <div class="h-3.5 w-full animate-pulse rounded-full bg-brand-50"></div>
          <div class="h-3.5 w-3/4 animate-pulse rounded-full bg-brand-50"></div>
          <div class="h-3 w-1/2 animate-pulse rounded-full bg-brand-50"></div>
        </div>
      </div>
    </div>

    <!-- 空状態: 検索結果なし -->
    <div
      v-else-if="posts.length === 0 && isFiltering"
      class="col-span-full flex flex-col items-center py-20 text-center"
    >
      <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
        </svg>
      </div>
      <h3 class="mb-1.5 text-base font-semibold text-ink">該当する記事がありません</h3>
      <p class="text-[13px] text-ink-3">条件を変えるか、検索ワードを短くしてみてください。</p>
    </div>

    <!-- 空状態: 記事未登録 -->
    <div
      v-else-if="posts.length === 0"
      class="col-span-full flex flex-col items-center py-20 text-center"
    >
      <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8v8"/>
        </svg>
      </div>
      <h3 class="mb-1.5 text-base font-semibold text-ink">まだ記事が登録されていません</h3>
      <p class="text-[13px] text-ink-3">上の「記事を登録」ボタンからURLを追加してください。</p>
    </div>

    <!-- 記事グリッド -->
    <div v-else class="grid grid-cols-1 items-start gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
      <PostTile
        v-for="post in posts"
        :key="post.id"
        :post="post"
        :is-owner="post.uid === currentUserId"
        @delete="emit('deletePost', $event)"
        @tag-click="emit('tagFilter', $event)"
      />
    </div>
  </div>
</template>
