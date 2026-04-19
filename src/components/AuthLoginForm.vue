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
      <label for="email" class="block text-sm font-medium text-gray-700">
        メールアドレス
      </label>
      <input
        id="email"
        v-model="email"
        type="email"
        autocomplete="email"
        required
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        :class="{ 'border-red-500': emailError }"
        @blur="validateEmail(email)"
      />
      <p v-if="emailError" class="mt-1 text-sm text-red-600">{{ emailError }}</p>
    </div>

    <div>
      <label for="password" class="block text-sm font-medium text-gray-700">
        パスワード
      </label>
      <input
        id="password"
        v-model="password"
        type="password"
        autocomplete="current-password"
        required
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      />
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <button
      type="submit"
      :disabled="isLoading"
      class="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
    >
      <span v-if="isLoading">ログイン中...</span>
      <span v-else>ログイン</span>
    </button>

    <div class="flex items-center justify-between text-sm">
      <NuxtLink to="/signup" class="text-green-600 hover:underline">
        アカウントを作成
      </NuxtLink>
      <NuxtLink to="/reset-password" class="text-green-600 hover:underline">
        パスワードを忘れた方
      </NuxtLink>
    </div>
  </form>
</template>
