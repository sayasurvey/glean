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
      <div class="mb-8 flex justify-center">
        <img src="~/assets/logo.png" alt="myGlean" class="h-10" />
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

          <p class="mt-4 text-center text-xs text-ink-4">
            登録することで
            <NuxtLink to="/terms" class="hover:text-ink-2 hover:underline transition-colors">利用規約</NuxtLink>
            および
            <NuxtLink to="/privacy-policy" class="hover:text-ink-2 hover:underline transition-colors">プライバシーポリシー</NuxtLink>
            に同意したものとみなします。
          </p>
        </template>
      </div>
    </div>
  </div>
</template>
