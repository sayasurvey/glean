<script setup lang="ts">
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900">パスワードリセット</h1>
        <p class="mt-2 text-sm text-gray-600">
          登録したメールアドレスにリセットメールをお送りします
        </p>
      </div>

      <AuthResetPasswordForm />
    </div>
  </div>
</template>
