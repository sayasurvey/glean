import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

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
  } else {
    authInstance = getAuth()
    dbInstance = getFirestore()
  }
})
