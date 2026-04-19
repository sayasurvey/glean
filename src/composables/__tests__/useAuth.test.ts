import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Firebase Auth モック
const mockSignInWithPopup = vi.fn()
const mockSignInWithEmailAndPassword = vi.fn()
const mockCreateUserWithEmailAndPassword = vi.fn()
const mockSignOut = vi.fn()
const mockSendPasswordResetEmail = vi.fn()
const mockSendEmailVerification = vi.fn()
const mockOnAuthStateChanged = vi.fn()

vi.mock('firebase/auth', () => ({
  signInWithPopup: mockSignInWithPopup,
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signOut: mockSignOut,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
  sendEmailVerification: mockSendEmailVerification,
  onAuthStateChanged: mockOnAuthStateChanged,
  GoogleAuthProvider: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(() => ({ exists: () => false })),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
}))

vi.mock('~/plugins/firebase.client', () => ({
  useFirebaseAuth: vi.fn(() => ({})),
}))

// Nuxt auto-imports のモック
vi.mock('#app', () => ({
  useRuntimeConfig: vi.fn(),
  navigateTo: vi.fn(),
  defineNuxtRouteMiddleware: vi.fn((fn: unknown) => fn),
}))

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnAuthStateChanged.mockImplementation((_auth: unknown, cb: (user: null) => void) => {
      cb(null)
      return vi.fn()
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('loginWithGoogle', () => {
    it('Google ログインが成功する', async () => {
      const mockUser = {
        uid: 'uid1',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        metadata: { creationTime: '2024-01-01', lastSignInTime: '2024-01-01' },
      }
      mockSignInWithPopup.mockResolvedValueOnce({ user: mockUser })

      const { useAuth } = await import('../useAuth')
      const { loginWithGoogle, error } = useAuth()

      await loginWithGoogle()

      expect(mockSignInWithPopup).toHaveBeenCalledOnce()
      expect(error.value).toBeNull()
    })

    it('ポップアップキャンセル時はエラーを表示しない', async () => {
      mockSignInWithPopup.mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' })

      const { useAuth } = await import('../useAuth')
      const { loginWithGoogle, error } = useAuth()

      await loginWithGoogle()

      expect(error.value).toBeNull()
    })

    it('ネットワークエラー時は日本語エラーを表示', async () => {
      mockSignInWithPopup.mockRejectedValueOnce({ code: 'auth/network-request-failed' })

      const { useAuth } = await import('../useAuth')
      const { loginWithGoogle, error } = useAuth()

      await loginWithGoogle()

      expect(error.value).toBe('ネットワーク接続を確認するか、しばらく時間をおいてから再試行してください')
    })
  })

  describe('loginWithEmail', () => {
    it('メールログインが成功する', async () => {
      const mockUser = { uid: 'uid1', email: 'test@example.com' }
      mockSignInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser })

      const { useAuth } = await import('../useAuth')
      const { loginWithEmail, error } = useAuth()

      await loginWithEmail('test@example.com', 'password123')

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      )
      expect(error.value).toBeNull()
    })

    it('認証情報不一致時は日本語エラーを表示', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/wrong-password' })

      const { useAuth } = await import('../useAuth')
      const { loginWithEmail, error } = useAuth()

      await expect(loginWithEmail('test@example.com', 'wrong')).rejects.toBeTruthy()
      expect(error.value).toBe('メールアドレスまたはパスワードが正しくありません')
    })
  })

  describe('signupWithEmail', () => {
    it('サインアップが成功し確認メールを送信する', async () => {
      const mockUser = { uid: 'uid1', email: 'test@example.com', displayName: null, photoURL: null }
      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser })
      mockSendEmailVerification.mockResolvedValueOnce(undefined)

      const { useAuth } = await import('../useAuth')
      const { signupWithEmail, error } = useAuth()

      await signupWithEmail('test@example.com', 'password123')

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      )
      expect(mockSendEmailVerification).toHaveBeenCalledWith(mockUser)
      expect(error.value).toBeNull()
    })

    it('メールアドレス重複時は日本語エラーを表示', async () => {
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/email-already-in-use' })

      const { useAuth } = await import('../useAuth')
      const { signupWithEmail, error } = useAuth()

      await expect(signupWithEmail('dup@example.com', 'password123')).rejects.toBeTruthy()
      expect(error.value).toBe('このメールアドレスは使用できません。既にアカウントをお持ちの場合はログインをお試しください')
    })

    it('弱いパスワード時は日本語エラーを表示', async () => {
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/weak-password' })

      const { useAuth } = await import('../useAuth')
      const { signupWithEmail, error } = useAuth()

      await expect(signupWithEmail('test@example.com', '123')).rejects.toBeTruthy()
      expect(error.value).toBe('パスワードは8文字以上で入力してください')
    })
  })

  describe('logout', () => {
    it('ログアウトが成功する', async () => {
      mockSignOut.mockResolvedValueOnce(undefined)

      const { useAuth } = await import('../useAuth')
      const { logout, error } = useAuth()

      await logout()

      expect(mockSignOut).toHaveBeenCalledOnce()
      expect(error.value).toBeNull()
    })
  })

  describe('resetPassword', () => {
    it('パスワードリセットメールを送信する', async () => {
      mockSendPasswordResetEmail.mockResolvedValueOnce(undefined)

      const { useAuth } = await import('../useAuth')
      const { resetPassword, error } = useAuth()

      await resetPassword('test@example.com')

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), 'test@example.com')
      expect(error.value).toBeNull()
    })
  })

  describe('エラーメッセージマッピング', () => {
    const cases = [
      { code: 'auth/invalid-email', expected: '有効なメールアドレスを入力してください' },
      { code: 'auth/user-not-found', expected: 'メールアドレスまたはパスワードが正しくありません' },
      { code: 'auth/email-already-in-use', expected: 'このメールアドレスは使用できません。既にアカウントをお持ちの場合はログインをお試しください' },
      { code: 'auth/network-request-failed', expected: 'ネットワーク接続を確認するか、しばらく時間をおいてから再試行してください' },
    ]

    cases.forEach(({ code, expected }) => {
      it(`${code} → "${expected}"`, async () => {
        mockSignInWithEmailAndPassword.mockRejectedValueOnce({ code })

        const { useAuth } = await import('../useAuth')
        const { loginWithEmail, error } = useAuth()

        await expect(loginWithEmail('test@example.com', 'pass')).rejects.toBeTruthy()
        expect(error.value).toBe(expected)
      })
    })
  })
})
