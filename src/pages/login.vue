<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const { isAuthenticated, isLoading, error } = useAuth()

onMounted(async () => {
  console.log('[LoginPage] マウント時: isLoading=', isLoading.value, 'isAuthenticated=', isAuthenticated.value)
  if (!isLoading.value && isAuthenticated.value) {
    console.log('[LoginPage] ログイン状態で自動リダイレクト')
    await navigateTo('/')
  }
})

watch([isLoading, isAuthenticated], async ([loading, authenticated]) => {
  console.log('[LoginPage] watch: isLoading=', loading, 'isAuthenticated=', authenticated)
  if (!loading && authenticated) {
    console.log('[LoginPage] 認証完了、ホームへリダイレクト')
    await navigateTo('/')
  }
})

const handleSuccess = async () => {
  console.log('[LoginPage] handleSuccess実行')
  await navigateTo('/')
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900">ログイン</h1>
      </div>

      <div v-if="isLoading" class="flex items-center justify-center space-x-2 py-4">
        <div class="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
        <div class="h-2 w-2 animate-bounce rounded-full bg-blue-500" style="animation-delay: 0.1s" />
        <div class="h-2 w-2 animate-bounce rounded-full bg-blue-500" style="animation-delay: 0.2s" />
        <span class="ml-2 text-sm text-gray-600">認証を処理中...</span>
      </div>

      <p v-if="error" class="rounded bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

      <AuthGoogleButton @success="handleSuccess" />

      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="bg-white px-2 text-gray-500">または</span>
        </div>
      </div>

      <AuthLoginForm @success="handleSuccess" />
    </div>

    <AuthDebug />
  </div>
</template>
