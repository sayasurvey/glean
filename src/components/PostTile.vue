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

const domainLabel = computed(() => {
  try {
    return new URL(props.post.url).hostname.replace(/^www\./, '')
  } catch {
    return props.post.url
  }
})

const faviconLetter = computed(() => domainLabel.value[0]?.toUpperCase() ?? '?')

const imgError = ref(false)

const visibleTags = computed(() => props.post.tags.slice(0, 3))
const extraTagCount = computed(() => Math.max(0, props.post.tags.length - 3))
</script>

<template>
  <article
    class="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-rule bg-white will-change-transform animate-[rise_320ms_cubic-bezier(.2,.6,.2,1)_both] transition-[transform,box-shadow,border-color] duration-[220ms] ease-[cubic-bezier(.2,.6,.2,1)] hover:-translate-y-[3px] hover:border-brand-300 hover:shadow-[var(--shadow-hover)]"
    @click="handleCardClick"
  >
    <!-- サムネイル -->
    <div class="relative aspect-[2/1] w-full overflow-hidden border-b border-rule-2 bg-brand-50">
      <img
        v-if="post.ogpImageUrl && !imgError"
        :src="post.ogpImageUrl"
        :alt="post.title"
        loading="lazy"
        class="block h-full w-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(.2,.6,.2,1)] group-hover:scale-[1.04]"
        @error="imgError = true"
      />
      <div v-else class="thumb-fallback relative flex h-full w-full items-end bg-gradient-to-br from-brand-700 to-brand-900 px-[18px] py-4 text-white">
        <span class="absolute left-4 top-[14px] z-[1] font-inter text-[10px] tracking-[.08em] text-white/50">{{ domainLabel.toUpperCase() }}</span>
        <div class="relative z-[1] line-clamp-3 text-[15px] font-bold leading-[1.4] [text-shadow:0_1px_2px_rgba(0,0,0,.25)]">{{ post.title }}</div>
      </div>

      <!-- ホバー時のアクションボタン -->
      <div
        v-if="isOwner"
        class="absolute right-[10px] top-[10px] z-[2] flex -translate-y-1 gap-1 opacity-0 transition-all duration-[220ms] ease-[cubic-bezier(.2,.6,.2,1)] group-hover:translate-y-0 group-hover:opacity-100"
      >
        <button
          class="grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-lg border-none bg-white/[.92] text-ink-2 shadow-[0_1px_3px_rgba(0,0,0,.1)] backdrop-blur-[4px] transition-all duration-[140ms] hover:scale-105 hover:bg-white hover:text-[#c0392b]"
          title="削除"
          @click.stop="handleDelete"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- カードボディ -->
    <div class="flex flex-1 flex-col gap-[10px] px-4 pb-4 pt-[14px]">
      <div class="line-clamp-2 text-[14.5px] font-bold leading-[1.5] tracking-[-0.005em] text-ink">{{ post.title || post.url }}</div>

      <p
        class="line-clamp-3 text-[12.5px] leading-[1.65]"
        :class="post.description ? 'text-ink-2' : 'text-[12px] italic text-ink-4'"
      >{{ post.description || '— 概要なし —' }}</p>

      <div class="mt-1 h-px -mx-4 bg-rule-2"></div>

      <div class="flex items-center gap-2 text-[11.5px] text-ink-3">
        <span class="inline-grid h-[14px] w-[14px] shrink-0 place-items-center rounded-[3px] bg-brand-100 font-inter text-[9px] font-bold text-brand-700">{{ faviconLetter }}</span>
        <span class="font-medium text-ink-2">{{ domainLabel }}</span>
      </div>

      <div v-if="post.tags.length > 0" class="mt-auto flex flex-wrap gap-[5px]">
        <span
          v-for="tag in visibleTags"
          :key="tag"
          class="cursor-pointer rounded-full border border-brand-100 bg-brand-50 px-2 py-[2px] text-[11px] font-medium leading-[1.6] text-brand-800 transition-all duration-[140ms] hover:border-brand-300 hover:bg-brand-100"
          @click.stop="emit('tagClick', tag)"
        >{{ tag }}</span>
        <span v-if="extraTagCount > 0" class="rounded-full border border-rule bg-transparent px-2 py-[2px] text-[11px] font-medium leading-[1.6] text-ink-3">+{{ extraTagCount }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.thumb-fallback::before {
  content: "";
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 85% 15%, rgba(255,255,255,.18), transparent 40%),
    radial-gradient(circle at 15% 90%, rgba(255,255,255,.08), transparent 50%);
  pointer-events: none;
}
</style>
