<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const emit = defineEmits<{
  sent: []
}>()

const { resetPassword, isLoading } = useAuth()

const email = ref('')
const sent = ref(false)

const handleSubmit = async () => {
  await resetPassword(email.value)
  sent.value = true
  emit('sent')
}
</script>

<template>
  <div>
    <div v-if="sent" class="rounded-md bg-green-50 p-4">
      <p class="text-sm text-green-800">
        メールアドレスが登録されている場合、パスワードリセットメールを送信しました。
        メールをご確認ください。
      </p>
    </div>

    <form v-else class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">
          登録済みメールアドレス
        </label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          required
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        :disabled="isLoading"
        class="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        <span v-if="isLoading">送信中...</span>
        <span v-else>リセットメールを送信</span>
      </button>
    </form>

    <div class="mt-4 text-center">
      <NuxtLink to="/login" class="text-sm text-blue-600 hover:underline">
        ログインに戻る
      </NuxtLink>
    </div>
  </div>
</template>
