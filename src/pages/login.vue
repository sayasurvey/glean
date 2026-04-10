<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const { isAuthenticated, isLoading } = useAuth()

onMounted(async () => {
  if (!isLoading.value && isAuthenticated.value) {
    await navigateTo('/')
  }
})

watch([isLoading, isAuthenticated], async ([loading, authenticated]) => {
  if (!loading && authenticated) {
    await navigateTo('/')
  }
})

const handleSuccess = async () => {
  await navigateTo('/')
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900">ログイン</h1>
      </div>

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
  </div>
</template>
