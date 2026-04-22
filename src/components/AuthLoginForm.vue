<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const { loginWithEmail, error } = useAuth()
const isLoading = ref(false)

const email = ref('')
const password = ref('')
const emailError = ref('')

const validateEmail = (value: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!value) {
    emailError.value = 'メールアドレスを入力してください'
    return false
  }
  if (!re.test(value)) {
    emailError.value = '有効なメールアドレスを入力してください'
    return false
  }
  emailError.value = ''
  return true
}

const handleSubmit = async () => {
  if (!validateEmail(email.value)) return
  if (!password.value) return

  isLoading.value = true
  try {
    await loginWithEmail(email.value, password.value)
    // ナビゲーションは login.vue の watch (isAuthenticated) が担当
  } catch {
    // error は useAuth 内で設定済み
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div>
      <label for="email" class="mb-1.5 block text-sm font-medium text-ink-2">メールアドレス</label>
      <input
        id="email"
        v-model="email"
        type="email"
        autocomplete="email"
        required
        class="block w-full rounded-xl border border-rule px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-ink-4 hover:border-brand-300 focus:border-brand-600 focus:shadow-[0_0_0_3px_rgba(45,90,61,.12)]"
        :class="{ 'border-red-400': emailError }"
        @blur="validateEmail(email)"
      />
      <p v-if="emailError" class="mt-1 text-xs text-red-500">{{ emailError }}</p>
    </div>

    <div>
      <label for="password" class="mb-1.5 block text-sm font-medium text-ink-2">パスワード</label>
      <input
        id="password"
        v-model="password"
        type="password"
        autocomplete="current-password"
        required
        class="block w-full rounded-xl border border-rule px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-ink-4 hover:border-brand-300 focus:border-brand-600 focus:shadow-[0_0_0_3px_rgba(45,90,61,.12)]"
      />
    </div>

    <p v-if="error" class="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{{ error }}</p>

    <button
      type="submit"
      :disabled="isLoading"
      class="w-full rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-800 disabled:opacity-50"
    >
      <span v-if="isLoading">ログイン中…</span>
      <span v-else>ログイン</span>
    </button>

    <div class="flex justify-center text-sm">
      <NuxtLink to="/reset-password" class="text-brand-700 hover:text-brand-800 hover:underline">
        パスワードを忘れた方
      </NuxtLink>
    </div>
  </form>
</template>
