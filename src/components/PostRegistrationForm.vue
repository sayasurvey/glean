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
  <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <h2 class="mb-4 text-lg font-semibold text-gray-900">記事を登録</h2>

    <!-- Step 1: URL入力 -->
    <div v-if="step === 'input'">
      <div class="mb-4">
        <label class="mb-1 block text-sm font-medium text-gray-700">URL</label>
        <input
          v-model="url"
          type="url"
          placeholder="https://example.com/article"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          :class="{ 'border-red-500': urlError }"
          @keydown.enter="handleConfirm"
        />
        <p v-if="urlError" class="mt-1 text-xs text-red-500">{{ urlError }}</p>
      </div>
      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          @click="emit('cancel')"
        >
          キャンセル
        </button>
        <button
          type="button"
          class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          @click="handleConfirm"
        >
          確認
        </button>
      </div>
    </div>

    <!-- Step 2: ローディング -->
    <div v-else-if="step === 'loading'" class="flex flex-col items-center py-8">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      <p class="mt-3 text-sm text-gray-500">記事情報を取得中...</p>
    </div>

    <!-- Step 3: プレビュー -->
    <div v-else-if="step === 'preview'">
      <p v-if="ogpWarning" class="mb-3 rounded bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
        {{ ogpWarning }}
      </p>

      <div class="mb-4 rounded-md border border-gray-200 p-3">
        <img
          v-if="ogpData.imageUrl"
          :src="ogpData.imageUrl"
          alt="OGP画像"
          class="mb-2 h-32 w-full rounded object-cover"
        />
        <div v-else class="mb-2 flex h-20 items-center justify-center rounded bg-gray-100">
          <span class="text-sm text-gray-400">画像なし</span>
        </div>
        <div class="mb-2">
          <label class="mb-1 block text-xs font-medium text-gray-500">タイトル</label>
          <input
            v-model="ogpData.title"
            type="text"
            class="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div v-if="summary" class="mb-1">
          <label class="mb-1 block text-xs font-medium text-gray-500">概要（AI生成）</label>
          <p class="text-sm text-gray-700">{{ summary }}</p>
        </div>
      </div>

      <div class="mb-4">
        <label class="mb-1 block text-sm font-medium text-gray-700">タグ</label>
        <TagInput v-model="tags" />
      </div>

      <p v-if="error" class="mb-3 text-sm text-red-500">{{ error }}</p>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          @click="handleBack"
        >
          戻る
        </button>
        <button
          type="button"
          class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          @click="handleRegister"
        >
          登録
        </button>
      </div>
    </div>
  </div>
</template>
