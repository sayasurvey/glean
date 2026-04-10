<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  middleware: 'auth-client',
})

const { currentUser, logout } = useAuth()

const handleLogout = async () => {
  await logout()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="mx-auto max-w-2xl">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Glean</h1>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-600">{{ currentUser?.email }}</span>
          <button
            class="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            @click="handleLogout"
          >
            ログアウト
          </button>
        </div>
      </div>
      <p class="mt-8 text-gray-500">ここに記事一覧が表示されます。</p>
    </div>
  </div>
</template>
