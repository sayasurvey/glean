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
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
      ],
      meta: [
        { property: 'og:title', content: 'myGlean' },
        { property: 'og:description', content: 'ITに関心を持つ人のための技術記事管理アプリ' },
        { property: 'og:image', content: 'https://www.myglean.jp/ogp.png' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: 'https://www.myglean.jp/ogp.png' },
      ],
    },
  },
  experimental: {
    appManifest: false,
  },
  compatibilityDate: '2024-11-01',
})
