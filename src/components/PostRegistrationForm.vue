<script setup lang="ts">
import type { OgpData, GeminiSummaryData } from '~/types/post'

const emit = defineEmits<{
  registered: [postId: string]
  cancel: []
}>()

const { addPost, error } = usePosts()
const { currentUser } = useAuth()

type Step = 'input' | 'loading' | 'preview'

const step = ref<Step>('input')
const url = ref('')
const urlError = ref('')
const tags = ref<string[]>([])
const ogpData = ref<OgpData>({ title: '', description: '', imageUrl: null, siteName: null })
const summary = ref('')
const ogpWarning = ref('')

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await currentUser.value?.getIdToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const handleConfirm = async () => {
  urlError.value = ''
  ogpWarning.value = ''

  try {
    new URL(url.value)
  } catch {
    urlError.value = '有効なURLを入力してください'
    return
  }

  step.value = 'loading'

  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const authHeaders = await getAuthHeaders()

  try {
    ogpData.value = await $fetch<OgpData>(`${apiBase}/api/ogp`, {
      params: { url: url.value },
      headers: authHeaders,
    })
    if (!ogpData.value.title) {
      ogpWarning.value = 'OGP情報を取得できませんでした。タイトルを直接入力してください'
    }
  } catch {
    ogpWarning.value = 'OGP情報を取得できませんでした。タイトルを直接入力してください'
    ogpData.value = { title: '', description: '', imageUrl: null, siteName: null }
  }

  try {
    const geminiData = await $fetch<GeminiSummaryData>(`${apiBase}/api/gemini`, {
      method: 'POST',
      body: {
        url: url.value,
        ogTitle: ogpData.value.title,
        ogDescription: ogpData.value.description,
      },
      headers: authHeaders,
    })
    summary.value = geminiData.summary
    if (geminiData.suggestedTags.length > 0) {
      tags.value = geminiData.suggestedTags
    }
  } catch {
    summary.value = ''
  }

  step.value = 'preview'
}

const handleRegister = async () => {
  const postId = await addPost(url.value, tags.value, {
    ogpData: ogpData.value,
    summary: summary.value,
  })
  if (postId) {
    url.value = ''
    tags.value = []
    ogpData.value = { title: '', description: '', imageUrl: null, siteName: null }
    summary.value = ''
    ogpWarning.value = ''
    step.value = 'input'
    emit('registered', postId)
  }
}

const handleBack = () => {
  step.value = 'input'
  ogpWarning.value = ''
}
</script>

<template>
  <div class="rounded-2xl border border-rule bg-white p-6 shadow-[var(--shadow-hover)]">
    <div class="mb-5 flex items-center justify-between">
      <h2 class="text-base font-bold text-ink">記事を登録</h2>
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-brand-50 hover:text-ink"
        @click="emit('cancel')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
          <path d="M6 6l12 12M18 6L6 18"/>
        </svg>
      </button>
    </div>

    <!-- URL入力 -->
    <div v-if="step === 'input'">
      <div class="mb-4">
        <label class="mb-1.5 block text-sm font-medium text-ink-2">URL</label>
        <input
          v-model="url"
          type="url"
          placeholder="https://example.com/article"
          class="w-full rounded-xl border border-rule px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-ink-4 hover:border-brand-300 focus:border-brand-600 focus:shadow-[0_0_0_3px_rgba(45,90,61,.12)]"
          :class="{ 'border-red-400': urlError }"
          @keydown.enter="handleConfirm"
        />
        <p v-if="urlError" class="mt-1 text-xs text-red-500">{{ urlError }}</p>
      </div>
      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="rounded-xl px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-brand-50"
          @click="emit('cancel')"
        >
          キャンセル
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-800"
          @click="handleConfirm"
        >
          確認
        </button>
      </div>
    </div>

    <!-- ローディング -->
    <div v-else-if="step === 'loading'" class="flex flex-col items-center py-10">
      <div class="h-9 w-9 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-700"></div>
      <p class="mt-3 text-sm text-ink-3">記事情報を取得中…</p>
    </div>

    <!-- プレビュー -->
    <div v-else-if="step === 'preview'">
      <p v-if="ogpWarning" class="mb-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">
        {{ ogpWarning }}
      </p>

      <div class="mb-4 overflow-hidden rounded-xl border border-rule">
        <img
          v-if="ogpData.imageUrl"
          :src="ogpData.imageUrl"
          alt="OGP画像"
          class="block max-h-[28vh] w-full object-cover"
        />
        <div v-else class="flex h-24 items-center justify-center bg-brand-50">
          <span class="text-sm text-ink-4">画像なし</span>
        </div>
        <div class="p-3.5 space-y-3">
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-3">タイトル</label>
            <input
              v-model="ogpData.title"
              type="text"
              class="w-full rounded-lg border border-rule px-3 py-1.5 text-sm text-ink outline-none focus:border-brand-600 focus:shadow-[0_0_0_3px_rgba(45,90,61,.12)]"
            />
          </div>
          <div v-if="summary">
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-3">概要（AI生成）</label>
            <p class="text-sm leading-relaxed text-ink-2">{{ summary }}</p>
          </div>
        </div>
      </div>

      <div class="mb-4">
        <label class="mb-1.5 block text-sm font-medium text-ink-2">タグ</label>
        <TagInput v-model="tags" />
      </div>

      <p v-if="error" class="mb-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{{ error }}</p>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="rounded-xl px-4 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-brand-50"
          @click="handleBack"
        >
          戻る
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-800"
          @click="handleRegister"
        >
          登録
        </button>
      </div>
    </div>
  </div>
</template>
