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
      <div class="mb-8 flex flex-col items-center gap-3">
        <span class="relative flex h-10 w-10 items-center justify-center rounded-[12px] shadow-md" style="background: linear-gradient(135deg, #2d5a3d, #14332a);">
          <svg width="20" height="20" viewBox="0 0 24 24" class="relative z-10 text-white" fill="currentColor">
            <path d="M5 19c0-7 6-13 14-13 0 8-6 13-14 13z"/>
            <path d="M5 19l8-8" stroke="rgba(255,255,255,.5)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          </svg>
          <span class="absolute inset-[5px] rounded-[7px]" style="background: radial-gradient(circle at 30% 25%, rgba(255,255,255,.3), transparent 55%);"></span>
        </span>
        <span class="font-inter text-xl font-bold tracking-tight text-brand-800">myGlean</span>
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
    </div>
  </div>
</template>
