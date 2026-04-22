<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const { isAuthenticated, isLoading, error } = useAuth()

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
  <div class="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
    <div class="w-full max-w-md">
      <!-- ブランドロゴ -->
      <div class="mb-8 flex justify-center">
        <img src="~/assets/logo.png" alt="myGlean" class="h-10" />
      </div>

      <div class="rounded-2xl border border-rule bg-white p-8 shadow-[var(--shadow-hover)]">
        <h1 class="mb-6 text-center text-xl font-bold text-ink">ログイン</h1>

        <p v-if="error" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</p>

        <AuthGoogleButton />

        <div class="relative my-5">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-rule" />
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="bg-white px-3 text-ink-3">または</span>
          </div>
        </div>

        <AuthLoginForm />

        <p class="mt-5 text-center text-sm text-ink-3">
          アカウントをお持ちでない方は
          <NuxtLink to="/signup" class="font-medium text-brand-700 hover:text-brand-800 hover:underline">新規登録</NuxtLink>
        </p>
      </div>

      <p class="mt-6 text-center text-xs text-ink-4">
        <NuxtLink to="/terms" class="hover:text-ink-2 hover:underline transition-colors">利用規約</NuxtLink>
        <span class="mx-2 text-rule">|</span>
        <NuxtLink to="/privacy-policy" class="hover:text-ink-2 hover:underline transition-colors">プライバシーポリシー</NuxtLink>
      </p>
    </div>
  </div>
</template>
