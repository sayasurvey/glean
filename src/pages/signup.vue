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
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900">アカウント作成</h1>
      </div>

      <div v-if="showVerification" class="rounded-md bg-blue-50 p-4 text-center">
        <p class="text-sm font-medium text-blue-800">確認メールを送信しました</p>
        <p class="mt-1 text-sm text-blue-700">
          登録したメールアドレスに確認メールを送信しました。
          メール内のリンクをクリックして登録を完了してください。
        </p>
        <NuxtLink to="/login" class="mt-4 block text-sm text-blue-600 hover:underline">
          ログインページへ
        </NuxtLink>
      </div>

      <template v-else>
        <AuthGoogleButton @success="handleGoogleSuccess" />

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300" />
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="bg-white px-2 text-gray-500">または</span>
          </div>
        </div>

        <AuthSignupForm @success="handleEmailSuccess" />
      </template>
    </div>
  </div>
</template>
