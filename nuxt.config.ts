// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devServer: {
    host: '0.0.0.0',
  },
  ssr: false,
  srcDir: 'src/',
  serverDir: './server',
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    geminiApiKey: process.env.NUXT_GEMINI_API_KEY,
    public: {
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? '',
    },
  },
  typescript: {
    strict: true,
  },
  nitro: {
    preset: 'static',
    externals: {
      external: ['firebase-admin', 'firebase-admin/app', 'firebase-admin/auth'],
    },
  },
  compatibilityDate: '2024-11-01',
})
