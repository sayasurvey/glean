import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// Firestore モック
const mockAddDoc = vi.fn()
const mockDeleteDoc = vi.fn()
const mockOnSnapshot = vi.fn()
const mockCollection = vi.fn()
const mockQuery = vi.fn()
const mockOrderBy = vi.fn()
const mockDoc = vi.fn()
const mockGetDoc = vi.fn()
const mockWriteBatch = vi.fn()
const mockServerTimestamp = vi.fn(() => new Date())
const mockIncrement = vi.fn()
const mockSetDoc = vi.fn()

vi.mock('firebase/firestore', () => ({
  addDoc: mockAddDoc,
  deleteDoc: mockDeleteDoc,
  onSnapshot: mockOnSnapshot,
  collection: mockCollection,
  query: mockQuery,
  orderBy: mockOrderBy,
  doc: mockDoc,
  getDoc: mockGetDoc,
  writeBatch: mockWriteBatch,
  serverTimestamp: mockServerTimestamp,
  increment: mockIncrement,
  setDoc: mockSetDoc,
}))

vi.mock('~/plugins/firebase.client', () => ({
  useFirebaseDb: vi.fn(() => ({})),
  useFirebaseAuth: vi.fn(() => ({})),
}))

// $fetch モック
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// useAuth モック
const mockCurrentUser = ref<{ uid: string } | null>({ uid: 'user1' })
vi.mock('~/composables/useAuth', () => ({
  useAuth: vi.fn(() => ({
    currentUser: mockCurrentUser,
  })),
}))

// Nuxt auto-imports
vi.mock('#app', () => ({
  useRuntimeConfig: vi.fn(),
}))

describe('usePosts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    mockCurrentUser.value = { uid: 'user1' }
    mockCollection.mockReturnValue('collection-ref')
    mockQuery.mockReturnValue('query-ref')
    mockOrderBy.mockReturnValue('order-ref')
    mockDoc.mockReturnValue('doc-ref')
    const mockBatch = { update: vi.fn(), set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) }
    mockWriteBatch.mockReturnValue(mockBatch)
  })

  describe('fetchPosts', () => {
    it('onSnapshotを開始してpostsをフィルタリングする', async () => {
      mockOnSnapshot.mockImplementation((_q: unknown, cb: (snap: unknown) => void) => {
        cb({
          docs: [
            { id: 'post1', data: () => ({ uid: 'user1', url: 'https://example.com', title: 'Test', description: '', tags: [], ogpImageUrl: null, createdAt: new Date(), updatedAt: new Date() }) },
            { id: 'post2', data: () => ({ uid: 'other', url: 'https://other.com', title: 'Other', description: '', tags: [], ogpImageUrl: null, createdAt: new Date(), updatedAt: new Date() }) },
          ],
        })
        return vi.fn()
      })

      const { usePosts } = await import('../usePosts')
      const { posts, fetchPosts } = usePosts()

      fetchPosts('user1')

      expect(mockOnSnapshot).toHaveBeenCalledOnce()
      expect(posts.value).toHaveLength(1)
      expect(posts.value[0]!.id).toBe('post1')
    })
  })

  describe('addPost', () => {
    it('OGP・Gemini取得成功時に記事を登録する', async () => {
      mockFetch
        .mockResolvedValueOnce({ title: 'Test Article', description: 'Desc', imageUrl: 'https://img.com/img.png', siteName: null })
        .mockResolvedValueOnce({ summary: 'AI要約テスト' })
      mockAddDoc.mockResolvedValueOnce({ id: 'new-post-id' })
      mockGetDoc.mockResolvedValue({ exists: () => false })

      const { usePosts } = await import('../usePosts')
      const { addPost, error } = usePosts()

      const postId = await addPost('https://example.com', ['vue', 'nuxt'])

      expect(postId).toBe('new-post-id')
      expect(error.value).toBeNull()
      expect(mockAddDoc).toHaveBeenCalledOnce()
    })

    it('OGP取得失敗時でも記事登録を続行する', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('OGP fetch failed'))
        .mockResolvedValueOnce({ summary: '' })
      mockAddDoc.mockResolvedValueOnce({ id: 'new-post-id' })
      mockGetDoc.mockResolvedValueOnce({ exists: () => false })

      const { usePosts } = await import('../usePosts')
      const { addPost, error } = usePosts()

      const postId = await addPost('https://example.com', [])

      expect(postId).toBe('new-post-id')
      expect(error.value).toBeNull()
    })

    it('Gemini取得失敗時でも記事登録を続行する', async () => {
      mockFetch
        .mockResolvedValueOnce({ title: 'Test', description: '', imageUrl: null, siteName: null })
        .mockRejectedValueOnce(new Error('Gemini failed'))
      mockAddDoc.mockResolvedValueOnce({ id: 'new-post-id' })
      mockGetDoc.mockResolvedValueOnce({ exists: () => false })

      const { usePosts } = await import('../usePosts')
      const { addPost, error } = usePosts()

      const postId = await addPost('https://example.com', [])

      expect(postId).toBe('new-post-id')
      expect(error.value).toBeNull()
    })

    it('未認証時はnullを返しエラーをセットする', async () => {
      mockCurrentUser.value = null

      const { usePosts } = await import('../usePosts')
      const { addPost, error } = usePosts()

      mockFetch
        .mockResolvedValueOnce({ title: '', description: '', imageUrl: null, siteName: null })
        .mockResolvedValueOnce({ summary: '' })

      const postId = await addPost('https://example.com', [])

      expect(postId).toBeNull()
      expect(error.value).not.toBeNull()
    })
  })

  describe('deletePost', () => {
    it('自分の投稿を削除できる', async () => {
      mockDeleteDoc.mockResolvedValueOnce(undefined)
      mockOnSnapshot.mockImplementation((_q: unknown, cb: (snap: unknown) => void) => {
        cb({
          docs: [
            { id: 'post1', data: () => ({ uid: 'user1', url: 'https://example.com', title: 'Test', description: '', tags: [], ogpImageUrl: null, createdAt: new Date(), updatedAt: new Date() }) },
          ],
        })
        return vi.fn()
      })

      const { usePosts } = await import('../usePosts')
      const { deletePost, fetchPosts, error } = usePosts()
      fetchPosts('user1')

      await deletePost('post1')

      expect(mockDeleteDoc).toHaveBeenCalledOnce()
      expect(error.value).toBeNull()
    })

    it('他人の投稿は削除できない', async () => {
      mockOnSnapshot.mockImplementation((_q: unknown, cb: (snap: unknown) => void) => {
        cb({
          docs: [
            { id: 'post2', data: () => ({ uid: 'other-user', url: 'https://example.com', title: 'Test', description: '', tags: [], ogpImageUrl: null, createdAt: new Date(), updatedAt: new Date() }) },
          ],
        })
        return vi.fn()
      })

      const { usePosts } = await import('../usePosts')
      const { deletePost, fetchPosts, error } = usePosts()
      fetchPosts('user1')

      await deletePost('post2')

      expect(mockDeleteDoc).not.toHaveBeenCalled()
      expect(error.value).toBe('権限がありません')
    })
  })
})
