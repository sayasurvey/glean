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
    <div v-if="sent" class="rounded-xl bg-brand-50 p-4">
      <p class="text-sm text-brand-800">
        メールアドレスが登録されている場合、パスワードリセットメールを送信しました。メールをご確認ください。
      </p>
    </div>

    <form v-else class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label for="email" class="mb-1.5 block text-sm font-medium text-ink-2">登録済みメールアドレス</label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          required
          class="block w-full rounded-xl border border-rule px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-ink-4 hover:border-brand-300 focus:border-brand-600 focus:shadow-[0_0_0_3px_rgba(45,90,61,.12)]"
        />
      </div>

      <button
        type="submit"
        :disabled="isLoading"
        class="w-full rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-800 disabled:opacity-50"
      >
        <span v-if="isLoading">送信中…</span>
        <span v-else>リセットメールを送信</span>
      </button>
    </form>
  </div>
</template>
