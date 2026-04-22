<script setup lang="ts">
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
    <div class="w-full max-w-md">
      <!-- ブランドロゴ -->
      <div class="mb-8 flex justify-center">
        <img src="~/assets/logo.png" alt="myGlean" class="h-10" />
      </div>

      <div class="rounded-2xl border border-rule bg-white p-8 shadow-[var(--shadow-hover)]">
        <h1 class="mb-2 text-center text-xl font-bold text-ink">パスワードリセット</h1>
        <p class="mb-6 text-center text-sm text-ink-3">登録したメールアドレスにリセットメールをお送りします</p>

        <AuthResetPasswordForm />

        <p class="mt-5 text-center text-sm text-ink-3">
          <NuxtLink to="/login" class="font-medium text-brand-700 hover:text-brand-800 hover:underline">ログインに戻る</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
