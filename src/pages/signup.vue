<script setup lang="ts">
const showVerification = ref(false)

const handleEmailSuccess = () => {
  showVerification.value = true
}

const handleGoogleSuccess = async () => {
  await navigateTo('/')
}
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
        <h1 class="mb-6 text-center text-xl font-bold text-ink">アカウント作成</h1>

        <div v-if="showVerification" class="rounded-xl bg-brand-50 p-5 text-center">
          <div class="mb-2 flex justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" class="text-brand-600" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <p class="text-sm font-semibold text-brand-800">確認メールを送信しました</p>
          <p class="mt-1 text-sm text-brand-700">メール内のリンクをクリックして登録を完了してください。</p>
          <NuxtLink to="/login" class="mt-4 block text-sm font-medium text-brand-700 hover:underline">ログインページへ</NuxtLink>
        </div>

        <template v-else>
          <AuthGoogleButton @success="handleGoogleSuccess" />

          <div class="relative my-5">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-rule" />
            </div>
            <div class="relative flex justify-center text-xs">
              <span class="bg-white px-3 text-ink-3">または</span>
            </div>
          </div>

          <AuthSignupForm @success="handleEmailSuccess" />

          <p class="mt-5 text-center text-sm text-ink-3">
            既にアカウントをお持ちの方は
            <NuxtLink to="/login" class="font-medium text-brand-700 hover:text-brand-800 hover:underline">ログイン</NuxtLink>
          </p>
        </template>
      </div>
    </div>
  </div>
</template>
