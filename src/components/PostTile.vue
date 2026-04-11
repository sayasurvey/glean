<script setup lang="ts">
import type { Post } from '~/types/post'

interface Props {
  post: Post
  isOwner: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  delete: [postId: string]
  tagClick: [tag: string]
}>()

const handleCardClick = () => {
  window.open(props.post.url, '_blank', 'noopener,noreferrer')
}

const handleDelete = (e: Event) => {
  e.stopPropagation()
  if (confirm('この記事を削除しますか？')) {
    emit('delete', props.post.id)
  }
}
</script>

<template>
  <div
    class="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    @click="handleCardClick"
  >
    <!-- OGP画像 -->
    <div class="h-40 w-full overflow-hidden bg-gray-100">
      <img
        v-if="post.ogpImageUrl"
        :src="post.ogpImageUrl"
        :alt="post.title"
        class="h-full w-full object-cover"
        @error="($event.target as HTMLImageElement).style.display = 'none'"
      />
      <div v-else class="flex h-full items-center justify-center">
        <span class="text-3xl text-gray-300">📄</span>
      </div>
    </div>

    <!-- コンテンツ -->
    <div class="flex flex-1 flex-col p-4">
      <h3 class="mb-1 line-clamp-2 text-sm font-semibold text-gray-900">
        {{ post.title || post.url }}
      </h3>
      <p v-if="post.description" class="mb-3 line-clamp-2 text-xs text-gray-500">
        {{ post.description }}
      </p>

      <!-- タグ -->
      <div v-if="post.tags.length > 0" class="mt-auto flex flex-wrap gap-1">
        <span
          v-for="tag in post.tags"
          :key="tag"
          class="cursor-pointer rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-blue-100 hover:text-blue-700"
          @click.stop="emit('tagClick', tag)"
        >
          {{ tag }}
        </span>
      </div>
    </div>

    <!-- 削除ボタン -->
    <button
      v-if="isOwner"
      type="button"
      class="absolute right-2 top-2 hidden rounded bg-white/80 p-1 text-gray-500 hover:text-red-500 group-hover:block"
      @click="handleDelete"
    >
      🗑
    </button>
  </div>
</template>
