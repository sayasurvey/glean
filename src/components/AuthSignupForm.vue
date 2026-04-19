<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const emit = defineEmits<{
  success: []
}>()

const { signupWithEmail, error, isLoading } = useAuth()

const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const emailError = ref('')
const passwordError = ref('')
const passwordConfirmError = ref('')

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

const validatePassword = (value: string): boolean => {
  if (value.length < 8) {
    passwordError.value = 'パスワードは8文字以上で入力してください'
    return false
  }
  passwordError.value = ''
  return true
}

const validatePasswordConfirm = (value: string): boolean => {
  if (value !== password.value) {
    passwordConfirmError.value = 'パスワードが一致しません'
    return false
  }
  passwordConfirmError.value = ''
  return true
}

const handleSubmit = async () => {
  const emailOk = validateEmail(email.value)
  const passwordOk = validatePassword(password.value)
  const confirmOk = validatePasswordConfirm(passwordConfirm.value)
  if (!emailOk || !passwordOk || !confirmOk) return

  try {
    await signupWithEmail(email.value, password.value)
    emit('success')
  } catch {
    // error は useAuth 内で設定済み
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
        パスワード（8文字以上）
      </label>
      <input
        id="password"
        v-model="password"
        type="password"
        autocomplete="new-password"
        required
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        :class="{ 'border-red-500': passwordError }"
        @blur="validatePassword(password)"
      />
      <p v-if="passwordError" class="mt-1 text-sm text-red-600">{{ passwordError }}</p>
    </div>

    <div>
      <label for="password-confirm" class="block text-sm font-medium text-gray-700">
        パスワード（確認）
      </label>
      <input
        id="password-confirm"
        v-model="passwordConfirm"
        type="password"
        autocomplete="new-password"
        required
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        :class="{ 'border-red-500': passwordConfirmError }"
        @blur="validatePasswordConfirm(passwordConfirm)"
      />
      <p v-if="passwordConfirmError" class="mt-1 text-sm text-red-600">{{ passwordConfirmError }}</p>
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <button
      type="submit"
      :disabled="isLoading"
      class="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
    >
      <span v-if="isLoading">登録中...</span>
      <span v-else>アカウントを作成</span>
    </button>

    <p class="text-center text-sm">
      すでにアカウントをお持ちの方は
      <NuxtLink to="/login" class="text-green-600 hover:underline">ログイン</NuxtLink>
    </p>
  </form>
</template>
