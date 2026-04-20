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
      <label for="password" class="mb-1.5 block text-sm font-medium text-ink-2">パスワード（8文字以上）</label>
      <input
        id="password"
        v-model="password"
        type="password"
        autocomplete="new-password"
        required
        class="block w-full rounded-xl border border-rule px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-ink-4 hover:border-brand-300 focus:border-brand-600 focus:shadow-[0_0_0_3px_rgba(45,90,61,.12)]"
        :class="{ 'border-red-400': passwordError }"
        @blur="validatePassword(password)"
      />
      <p v-if="passwordError" class="mt-1 text-xs text-red-500">{{ passwordError }}</p>
    </div>

    <div>
      <label for="password-confirm" class="mb-1.5 block text-sm font-medium text-ink-2">パスワード（確認）</label>
      <input
        id="password-confirm"
        v-model="passwordConfirm"
        type="password"
        autocomplete="new-password"
        required
        class="block w-full rounded-xl border border-rule px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-ink-4 hover:border-brand-300 focus:border-brand-600 focus:shadow-[0_0_0_3px_rgba(45,90,61,.12)]"
        :class="{ 'border-red-400': passwordConfirmError }"
        @blur="validatePasswordConfirm(passwordConfirm)"
      />
      <p v-if="passwordConfirmError" class="mt-1 text-xs text-red-500">{{ passwordConfirmError }}</p>
    </div>

    <p v-if="error" class="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{{ error }}</p>

    <button
      type="submit"
      :disabled="isLoading"
      class="w-full rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-800 disabled:opacity-50"
    >
      <span v-if="isLoading">登録中…</span>
      <span v-else>アカウントを作成</span>
    </button>
  </form>
</template>
