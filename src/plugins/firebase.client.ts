import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

let authInstance: ReturnType<typeof getAuth> | null = null
let dbInstance: ReturnType<typeof getFirestore> | null = null

export const useFirebaseAuth = () => {
  if (!authInstance) {
    throw new Error('Firebase Auth が初期化されていません')
  }
  return authInstance
}

export const useFirebaseDb = () => {
  if (!dbInstance) {
    throw new Error('Firestore が初期化されていません')
  }
  return dbInstance
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Firebase設定値の確認
  const requiredKeys = [
    'firebaseApiKey',
    'firebaseAuthDomain',
    'firebaseProjectId',
    'firebaseStorageBucket',
    'firebaseMessagingSenderId',
    'firebaseAppId',
  ]

  const missingKeys = requiredKeys.filter(
    key => !config.public[key as keyof typeof config.public]
  )

  if (missingKeys.length > 0) {
    console.error('[Firebase] 設定が不足しています:', missingKeys)
    throw new Error(`Firebase設定が不完全です: ${missingKeys.join(', ')}`)
  }

  if (getApps().length === 0) {
    const app = initializeApp({
      apiKey: config.public.firebaseApiKey,
      authDomain: config.public.firebaseAuthDomain,
      projectId: config.public.firebaseProjectId,
      storageBucket: config.public.firebaseStorageBucket,
      messagingSenderId: config.public.firebaseMessagingSenderId,
      appId: config.public.firebaseAppId,
    })

    authInstance = getAuth(app)
    dbInstance = getFirestore(app)

    // 開発環境でのエミュレータ設定（オプション）
    if (process.env.NODE_ENV === 'development' && process.env.NUXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      try {
        connectAuthEmulator(authInstance, 'http://localhost:9099', { disableWarnings: true })
        connectFirestoreEmulator(dbInstance, 'localhost', 8080)
      } catch (e) {
        // エミュレータ接続スキップ（既に接続済みまたは利用不可）
      }
    }
  } else {
    authInstance = getAuth()
    dbInstance = getFirestore()
  }
})
