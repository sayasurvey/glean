import { ref, readonly } from 'vue'
import { useAuth } from '~/composables/useAuth'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  getDoc,
  increment,
  setDoc,
} from 'firebase/firestore'
import { useFirebaseDb } from '~/plugins/firebase.client'
import type { Post, OgpData, GeminiSummaryData, PostErrorMap } from '~/types/post'

const POST_ERROR_MAP: PostErrorMap = {
  'permission-denied': '権限がありません',
  'not-found': '記事が見つかりません',
  'already-exists': 'このURLは既に登録されています',
  'network-error': 'ネットワーク接続を確認してください',
  'unknown': '予期しないエラーが発生しました',
}

const getErrorMessage = (code: string): string => POST_ERROR_MAP[code] ?? POST_ERROR_MAP['unknown']!

const posts = ref<Post[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
let unsubscribe: (() => void) | null = null

export const usePosts = () => {
  const fetchPosts = (uid: string) => {
    isLoading.value = true
    error.value = null

    if (unsubscribe) {
      unsubscribe()
    }

    const db = useFirebaseDb()
    const q = query(
      collection(db, 'posts'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc')
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        posts.value = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as Post))
        isLoading.value = false
      },
      (err) => {
        console.error('[usePosts] onSnapshot error:', err)
        const code = (err as { code?: string }).code ?? 'unknown'
        error.value = getErrorMessage(code)
        isLoading.value = false
      }
    )
  }

  const addPost = async (
    url: string,
    tags: string[],
    prefetched?: { ogpData: OgpData; summary: string }
  ): Promise<string | null> => {
    error.value = null

    // 重複チェック
    const isDuplicate = posts.value.some((p) => p.url === url)
    if (isDuplicate) {
      error.value = getErrorMessage('already-exists')
      return null
    }

    let ogpData: OgpData = prefetched?.ogpData ?? { title: '', description: '', imageUrl: null, siteName: null }
    let summary = prefetched?.summary ?? ''

    if (!prefetched) {
      const config = useRuntimeConfig()
      const apiBase = config.public.apiBase as string
      const { currentUser } = useAuth()
      const token = await currentUser.value?.getIdToken()
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

      try {
        ogpData = await $fetch<OgpData>(`${apiBase}/api/ogp`, {
          params: { url },
          headers: authHeaders,
        })
      } catch {
        // OGP取得失敗は続行
      }

      try {
        const geminiData = await $fetch<GeminiSummaryData>(`${apiBase}/api/gemini`, {
          method: 'POST',
          body: {
            url,
            ogTitle: ogpData.title,
            ogDescription: ogpData.description,
          },
          headers: authHeaders,
        })
        summary = geminiData.summary
        if (tags.length === 0 && geminiData.suggestedTags.length > 0) {
          tags = geminiData.suggestedTags
        }
      } catch {
        // Gemini失敗は続行
      }
    }

    try {
      const { currentUser } = useAuth()
      const uid = currentUser.value?.uid
      if (!uid) {
        error.value = getErrorMessage('permission-denied')
        return null
      }

      const db = useFirebaseDb()
      const docRef = await addDoc(collection(db, 'posts'), {
        uid,
        url,
        title: ogpData.title,
        description: summary,
        ogpImageUrl: ogpData.imageUrl,
        tags,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // タグのupsert
      if (tags.length > 0) {
        const batch = writeBatch(db)
        for (const tag of tags) {
          const tagRef = doc(db, 'tags', tag)
          const tagSnap = await getDoc(tagRef)
          if (tagSnap.exists()) {
            batch.update(tagRef, { count: increment(1), updatedAt: serverTimestamp() })
          } else {
            batch.set(tagRef, { name: tag, count: 1, updatedAt: serverTimestamp() })
          }
        }
        await batch.commit()
      }

      return docRef.id
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? 'unknown'
      error.value = getErrorMessage(code)
      return null
    }
  }

  const deletePost = async (postId: string): Promise<void> => {
    error.value = null

    const { currentUser } = useAuth()
    const uid = currentUser.value?.uid
    const target = posts.value.find((p) => p.id === postId)

    if (!target || target.uid !== uid) {
      error.value = getErrorMessage('permission-denied')
      return
    }

    try {
      const db = useFirebaseDb()
      await deleteDoc(doc(db, 'posts', postId))
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? 'unknown'
      error.value = getErrorMessage(code)
    }
  }

  const stopListening = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  return {
    posts: readonly(posts),
    isLoading: readonly(isLoading),
    error,
    fetchPosts,
    addPost,
    deletePost,
    stopListening,
  }
}
