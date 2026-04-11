<script setup lang="ts">
import type { Post } from '~/types/post'

interface Props {
  posts: Post[]
  currentUserId: string | null
  isLoading: boolean
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
    <div v-if="isLoading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="n in 3"
        :key="n"
        class="animate-pulse overflow-hidden rounded-lg border border-gray-200 bg-white"
      >
        <div class="h-40 bg-gray-200"></div>
        <div class="p-4">
          <div class="mb-2 h-4 rounded bg-gray-200"></div>
          <div class="h-3 w-3/4 rounded bg-gray-200"></div>
        </div>
      </div>
    </div>

    <!-- 空状態 -->
    <div
      v-else-if="posts.length === 0"
      class="flex flex-col items-center py-16 text-center"
    >
      <span class="mb-3 text-4xl">📚</span>
      <p class="text-gray-500">まだ記事が登録されていません</p>
      <p class="mt-1 text-sm text-gray-400">上の「記事を登録」ボタンからURLを追加してください</p>
    </div>

    <!-- 記事グリッド -->
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
