<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'
import { useRuntimeConfig } from '#app'

const { currentUser, isLoading, error, isAuthenticated } = useAuth()
const config = useRuntimeConfig()

const isDebugMode = ref(false)
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50">
    <button
      @click="isDebugMode = !isDebugMode"
      class="rounded-full bg-gray-800 text-white px-4 py-2 text-sm font-medium hover:bg-gray-700"
    >
      {{ isDebugMode ? 'デバッグを閉じる' : 'デバッグ' }}
    </button>

    <div
      v-if="isDebugMode"
      class="absolute bottom-12 right-0 bg-white rounded-lg shadow-lg border border-gray-300 p-4 w-80 max-h-96 overflow-auto text-sm font-mono"
    >
      <div class="space-y-2 text-gray-700">
        <div>
          <strong>認証状態:</strong>
          <div class="text-xs text-gray-600">
            <div>isLoading: {{ isLoading }}</div>
            <div>isAuthenticated: {{ isAuthenticated }}</div>
            <div>currentUser: {{ currentUser ? currentUser.email : 'null' }}</div>
          </div>
        </div>

        <hr class="my-2" />

        <div>
          <strong>エラー:</strong>
          <div v-if="error" class="text-xs text-red-600 break-words">{{ error }}</div>
          <div v-else class="text-xs text-gray-600">なし</div>
        </div>

        <hr class="my-2" />

        <div>
          <strong>Firebase設定:</strong>
          <div class="text-xs text-gray-600 break-words">
            <div>authDomain: {{ config.public.firebaseAuthDomain }}</div>
            <div>projectId: {{ config.public.firebaseProjectId }}</div>
          </div>
        </div>

        <hr class="my-2" />

        <button
          @click="() => console.log('[Debug]', { currentUser, isLoading, error, isAuthenticated })"
          class="w-full bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
        >
          コンソールに出力
        </button>
      </div>
    </div>
  </div>
</template>
