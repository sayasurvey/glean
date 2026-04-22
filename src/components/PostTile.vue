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
  <article class="card group" @click="handleCardClick">
    <!-- サムネイル -->
    <div class="thumb">
      <img
        v-if="post.ogpImageUrl && !imgError"
        :src="post.ogpImageUrl"
        :alt="post.title"
        loading="lazy"
        class="thumb-img"
        @error="imgError = true"
      />
      <div v-else class="thumb-fallback">
        <span class="domain-stamp">{{ domainLabel.toUpperCase() }}</span>
        <div class="ft">{{ post.title }}</div>
      </div>

      <!-- ホバー時のアクションボタン -->
      <div v-if="isOwner" class="card-actions">
        <button
          class="a-btn danger"
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
    <div class="card-body">
      <div class="card-title">{{ post.title || post.url }}</div>

      <p v-if="post.description" class="card-desc">{{ post.description }}</p>
      <p v-else class="card-desc empty">— 概要なし —</p>

      <div class="card-divider"></div>

      <div class="card-meta">
        <span class="favicon">{{ faviconLetter }}</span>
        <span class="domain">{{ domainLabel }}</span>
      </div>

      <div v-if="post.tags.length > 0" class="card-tags">
        <span
          v-for="tag in visibleTags"
          :key="tag"
          class="card-tag"
          @click.stop="emit('tagClick', tag)"
        >{{ tag }}</span>
        <span v-if="extraTagCount > 0" class="card-tag more">+{{ extraTagCount }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--color-rule);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--t, 220ms), box-shadow var(--t, 220ms), border-color var(--t, 220ms);
  will-change: transform;
  animation: rise 320ms cubic-bezier(.2,.6,.2,1) both;
}
.card:hover {
  transform: translateY(-3px);
  border-color: var(--color-brand-300);
  box-shadow: var(--shadow-hover);
}

/* サムネイル */
.thumb {
  aspect-ratio: 2/1;
  width: 100%;
  background: var(--color-brand-50);
  overflow: hidden;
  position: relative;
  border-bottom: 1px solid var(--color-rule-2);
}
.thumb-img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 600ms cubic-bezier(.2,.6,.2,1);
}
.card:hover .thumb-img { transform: scale(1.04); }

.thumb-fallback {
  width: 100%; height: 100%;
  display: flex;
  align-items: flex-end;
  padding: 16px 18px;
  color: #fff;
  background: linear-gradient(135deg, var(--color-brand-700), var(--color-brand-900));
  position: relative;
}
.thumb-fallback::before {
  content: "";
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 85% 15%, rgba(255,255,255,.18), transparent 40%),
    radial-gradient(circle at 15% 90%, rgba(255,255,255,.08), transparent 50%);
  pointer-events: none;
}
.domain-stamp {
  position: absolute;
  top: 14px; left: 16px;
  font-family: 'Inter', monospace;
  font-size: 10px;
  letter-spacing: .08em;
  color: rgba(255,255,255,.5);
  z-index: 1;
}
.ft {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
  text-shadow: 0 1px 2px rgba(0,0,0,.25);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

/* アクションボタン */
.card-actions {
  position: absolute;
  top: 10px; right: 10px;
  display: flex; gap: 4px;
  opacity: 0;
  transform: translateY(-4px);
  transition: all var(--t, 220ms);
  z-index: 2;
}
.card:hover .card-actions { opacity: 1; transform: translateY(0); }
.a-btn {
  width: 30px; height: 30px;
  border: none;
  background: rgba(255,255,255,.92);
  border-radius: 8px;
  color: var(--color-ink-2);
  display: grid; place-items: center;
  backdrop-filter: blur(4px);
  box-shadow: 0 1px 3px rgba(0,0,0,.1);
  transition: all var(--t-fast, 140ms);
  cursor: pointer;
}
.a-btn:hover { background: #fff; color: var(--color-brand-800); transform: scale(1.05); }
.a-btn.danger:hover { color: #c0392b; }

/* カードボディ */
.card-body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}
.card-title {
  font-size: 14.5px;
  font-weight: 700;
  line-height: 1.5;
  color: var(--color-ink);
  letter-spacing: -0.005em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-desc {
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--color-ink-2);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-desc.empty {
  color: var(--color-ink-4);
  font-style: italic;
  font-size: 12px;
}
.card-divider {
  height: 1px;
  background: var(--color-rule-2);
  margin: 4px -16px 0;
}
.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: var(--color-ink-3);
}
.favicon {
  width: 14px; height: 14px;
  border-radius: 3px;
  background: var(--color-brand-100);
  display: inline-grid; place-items: center;
  font-family: 'Inter', sans-serif;
  font-size: 9px;
  font-weight: 700;
  color: var(--color-brand-700);
  flex-shrink: 0;
}
.domain { font-weight: 500; color: var(--color-ink-2); }
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: auto;
}
.card-tag {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-brand-50);
  color: var(--color-brand-800);
  border: 1px solid var(--color-brand-100);
  transition: all var(--t-fast, 140ms);
  cursor: pointer;
  line-height: 1.6;
}
.card-tag:hover { background: var(--color-brand-100); border-color: var(--color-brand-300); }
.card-tag.more { background: transparent; color: var(--color-ink-3); border-color: var(--color-rule); }
</style>
