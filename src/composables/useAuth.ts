import {
  signInWithRedirect,
  getRedirectResult,
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
import type { User } from 'firebase/auth'
import type { AuthErrorMap, UserProfile } from '~/types/auth'
import { useFirebaseAuth } from '~/plugins/firebase.client'
import { shallowRef, computed, readonly } from 'vue'

const AUTH_ERROR_MAP: AuthErrorMap = {
  'auth/network-request-failed': 'ネットワーク接続を確認するか、しばらく時間をおいてから再試行してください',
  'auth/invalid-email': '有効なメールアドレスを入力してください',
  'auth/weak-password': 'パスワードは8文字以上で入力してください',
  'auth/email-already-in-use': 'このメールアドレスは使用できません。既にアカウントをお持ちの場合はログインをお試しください',
  'auth/wrong-password': 'メールアドレスまたはパスワードが正しくありません',
  'auth/user-not-found': 'メールアドレスまたはパスワードが正しくありません',
  'auth/invalid-credential': 'メールアドレスまたはパスワードが正しくありません',
  'auth/popup-closed-by-user': '',
  'auth/cancelled-popup-request': '',
  'auth/too-many-requests': 'しばらく時間をおいてから再試行してください',
  'auth/operation-not-allowed': 'この認証方法は現在利用できません。管理者にお問い合わせください',
  'auth/unauthorized-domain': 'このドメインからの認証は許可されていません。Firebase Consoleで承認済みドメインを確認してください',
  'auth/popup-blocked': 'ポップアップがブロックされました。ブラウザのポップアップを許可してから再試行してください',
  'auth/internal-error': '認証サービスで内部エラーが発生しました。しばらく時間をおいてから再試行してください',
  'auth/cors-unsupported': 'ブラウザがCORSに対応していません',
  'auth/web-storage-unsupported': 'ブラウザのWebストレージが無効になっています。設定を確認してください',
  'auth/account-exists-with-different-credential': '別の認証方法で登録済みのメールアドレスです',
}

const getErrorMessage = (code: string): string => {
  return AUTH_ERROR_MAP[code] ?? '予期しないエラーが発生しました'
}

const currentUser = shallowRef<User | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
let unsubscribe: (() => void) | null = null
let isInitialized = false

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

const initializeAuth = (auth: ReturnType<typeof useFirebaseAuth>) => {
  if (isInitialized) return
  isInitialized = true

  // 認証状態の変更を監視
  unsubscribe = onAuthStateChanged(auth, (user) => {
    currentUser.value = user
    isLoading.value = false
  })

  // リダイレクト結果を処理（Google認証など）
  getRedirectResult(auth)
    .then(async (result) => {
      if (result?.user) {
        const isNew = result.user.metadata.creationTime === result.user.metadata.lastSignInTime
        if (isNew) {
          try {
            await createUserProfile(result.user, 'google')
          } catch (e) {
            // プロフィール作成エラーは認証の妨げにはしない
          }
        }
      }
    })
    .catch((e: unknown) => {
      const code = (e as { code?: string }).code ?? ''

      // ユーザーがキャンセルした場合やリダイレクトがない場合はエラーを表示しない
      if (code && code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        if (!error.value) {
          error.value = getErrorMessage(code)
        }
      }
    })
}

export const useAuth = () => {
  const auth = useFirebaseAuth()

  const isAuthenticated = computed(() => currentUser.value !== null)

  // 初期化はグローバルで一度だけ実行
  if (!isInitialized) {
    initializeAuth(auth)
  }

  const loginWithGoogle = async (): Promise<void> => {
    error.value = null
    try {
      const provider = new GoogleAuthProvider()
      // カスタムドメインでのクロスオリジン問題を避けるためリダイレクト方式を使用
      await signInWithRedirect(auth, provider)
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''

      if (code === 'auth/unauthorized-domain') {
        error.value = 'このドメインからの認証は許可されていません。Firebase ConsoleでJavaScriptリダイレクトURIを確認してください。'
      } else if (code === 'auth/invalid-api-key') {
        error.value = 'FirebaseのAPI設定に問題があります。管理者にお問い合わせください。'
      } else if (code === 'auth/operation-not-allowed') {
        error.value = 'Google認証は現在利用できません。管理者にお問い合わせください。'
      } else if (code) {
        error.value = getErrorMessage(code)
      } else {
        error.value = 'Google認証に失敗しました。ブラウザのコンソールを確認してください。'
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
