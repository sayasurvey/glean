import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  GoogleAuthProvider,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import { getApps } from 'firebase/app'
import type { User } from 'firebase/auth'
import type { AuthErrorMap, UserProfile } from '~/types/auth'
import { useFirebaseAuth } from '~/plugins/firebase.client'
import { ref, computed, readonly } from 'vue'

const AUTH_ERROR_MAP: AuthErrorMap = {
  'auth/network-request-failed': 'ネットワーク接続を確認するか、しばらく時間をおいてから再試行してください',
  'auth/invalid-email': '有効なメールアドレスを入力してください',
  'auth/weak-password': 'パスワードは8文字以上で入力してください',
  'auth/email-already-in-use': 'このメールアドレスは使用できません。既にアカウントをお持ちの場合はログインをお試しください',
  'auth/wrong-password': 'メールアドレスまたはパスワードが正しくありません',
  'auth/user-not-found': 'メールアドレスまたはパスワードが正しくありません',
  'auth/invalid-credential': 'メールアドレスまたはパスワードが正しくありません',
  'auth/popup-closed-by-user': '',
  'auth/too-many-requests': 'しばらく時間をおいてから再試行してください',
  'auth/operation-not-allowed': 'この認証方法は現在利用できません。管理者にお問い合わせください',
}

const getErrorMessage = (code: string): string => {
  return AUTH_ERROR_MAP[code] ?? '予期しないエラーが発生しました'
}

const currentUser = ref<User | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
let unsubscribe: (() => void) | null = null

const createUserProfile = async (user: User, provider: 'google' | 'email') => {
  const db = getFirestore()
  const userRef = doc(db, 'users', user.uid)
  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) {
    const profile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & {
      createdAt: ReturnType<typeof serverTimestamp>
      updatedAt: ReturnType<typeof serverTimestamp>
    } = {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      photoURL: user.photoURL,
      provider,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    await setDoc(userRef, profile)
  }
}

export const useAuth = () => {
  const auth = useFirebaseAuth()

  const isAuthenticated = computed(() => currentUser.value !== null)

  if (!unsubscribe) {
    unsubscribe = onAuthStateChanged(auth, (user) => {
      currentUser.value = user
      isLoading.value = false
    })
  }

  const loginWithGoogle = async (): Promise<void> => {
    error.value = null
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const isNew = result.user.metadata.creationTime === result.user.metadata.lastSignInTime
      if (isNew) {
        await createUserProfile(result.user, 'google')
      }
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''
      if (code !== 'auth/popup-closed-by-user') {
        error.value = getErrorMessage(code)
      }
    }
  }

  const loginWithEmail = async (email: string, password: string): Promise<void> => {
    error.value = null
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''
      error.value = getErrorMessage(code)
      throw e
    }
  }

  const signupWithEmail = async (email: string, password: string): Promise<void> => {
    error.value = null
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await sendEmailVerification(result.user)
      await createUserProfile(result.user, 'email')
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''
      error.value = getErrorMessage(code)
      throw e
    }
  }

  const logout = async (): Promise<void> => {
    error.value = null
    try {
      await signOut(auth)
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''
      error.value = getErrorMessage(code)
    }
  }

  const resetPassword = async (email: string): Promise<void> => {
    error.value = null
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''
      error.value = getErrorMessage(code)
    }
  }

  const resendVerificationEmail = async (): Promise<void> => {
    error.value = null
    if (!currentUser.value) return
    try {
      await sendEmailVerification(currentUser.value)
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''
      error.value = getErrorMessage(code)
    }
  }

  return {
    currentUser: readonly(currentUser),
    isAuthenticated,
    isLoading: readonly(isLoading),
    error,
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    logout,
    resetPassword,
    resendVerificationEmail,
  }
}
