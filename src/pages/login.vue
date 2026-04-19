<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const { isAuthenticated, isLoading, error } = useAuth()

// isLoading が false かつ isAuthenticated が true になった瞬間に遷移する
// immediate: true により、マウント時点で既にログイン済みの場合もカバー
// onAuthStateChanged の確認後に遷移するため、ミドルウェアとの競合を防ぐ
watch(
  [isLoading, isAuthenticated],
  ([loading, authenticated]) => {
    if (!loading && authenticated) {
      navigateTo('/')
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900">ログイン</h1>
      </div>

      <p v-if="error" class="rounded bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

      <AuthGoogleButton />

      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="bg-white px-2 text-gray-500">または</span>
        </div>
      </div>

      <AuthLoginForm />
    </div>

  </div>
</template>
