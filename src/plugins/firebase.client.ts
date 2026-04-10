import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

let authInstance: ReturnType<typeof getAuth> | null = null

export const useFirebaseAuth = () => {
  if (!authInstance) {
    throw new Error('Firebase Auth が初期化されていません')
  }
  return authInstance
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

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
  } else {
    authInstance = getAuth()
  }
})
