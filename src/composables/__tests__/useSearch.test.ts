import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import type { Post } from '~/types/post'
import type { Timestamp } from 'firebase/firestore'

const makePost = (overrides: Partial<Post>): Post => ({
  id: 'post1',
  uid: 'user1',
  url: 'https://example.com',
  title: 'テスト記事',
  description: 'テストの説明',
  ogpImageUrl: null,
  tags: [],
  createdAt: {} as Timestamp,
  updatedAt: {} as Timestamp,
  ...overrides,
})

describe('useSearch', () => {
  const createPosts = () =>
    ref<Post[]>([
      makePost({ id: '1', title: 'Vue 3入門', description: 'Composition APIの使い方', tags: ['vue', 'frontend'] }),
      makePost({ id: '2', title: 'Nuxt 3ガイド', description: 'サーバーサイドレンダリング入門', tags: ['nuxt', 'frontend'] }),
      makePost({ id: '3', title: 'TypeScript Tips', description: '型安全なコードを書く方法', tags: ['typescript', 'backend'] }),
    ])

  it('keywordでタイトルを大文字小文字無視でフィルタリングする', async () => {
    const { useSearch } = await import('../useSearch')
    const posts = createPosts()
    const { keyword, filteredPosts } = useSearch(posts)

    keyword.value = 'vue'

    expect(filteredPosts.value).toHaveLength(1)
    expect(filteredPosts.value[0]!.id).toBe('1')
  })

  it('keywordで概要をフィルタリングする', async () => {
    const { useSearch } = await import('../useSearch')
    const posts = createPosts()
    const { keyword, filteredPosts } = useSearch(posts)

    keyword.value = 'サーバーサイド'

    expect(filteredPosts.value).toHaveLength(1)
    expect(filteredPosts.value[0]!.id).toBe('2')
  })

  it('activeTagsでAND絞り込みをする', async () => {
    const { useSearch } = await import('../useSearch')
    const posts = createPosts()
    const { activeTags, filteredPosts } = useSearch(posts)

    activeTags.value = ['frontend']

    expect(filteredPosts.value).toHaveLength(2)
    expect(filteredPosts.value.map((p) => p.id)).toEqual(['1', '2'])
  })

  it('複数タグのAND検索', async () => {
    const { useSearch } = await import('../useSearch')
    const posts = createPosts()
    const { activeTags, filteredPosts } = useSearch(posts)

    activeTags.value = ['vue', 'frontend']

    expect(filteredPosts.value).toHaveLength(1)
    expect(filteredPosts.value[0]!.id).toBe('1')
  })

  it('keywordとactiveTagsの組み合わせフィルタ', async () => {
    const { useSearch } = await import('../useSearch')
    const posts = createPosts()
    const { keyword, activeTags, filteredPosts } = useSearch(posts)

    keyword.value = '入門'
    activeTags.value = ['frontend']

    // Vue 3入門（frontend）とNuxt 3ガイド（frontend, "入門"含む説明）
    expect(filteredPosts.value.every((p) => p.tags.includes('frontend'))).toBe(true)
  })

  it('clearSearchでkeywordとactiveTagsをリセットする', async () => {
    const { useSearch } = await import('../useSearch')
    const posts = createPosts()
    const { keyword, activeTags, filteredPosts, clearSearch } = useSearch(posts)

    keyword.value = 'vue'
    activeTags.value = ['frontend']

    clearSearch()

    expect(keyword.value).toBe('')
    expect(activeTags.value).toHaveLength(0)
    expect(filteredPosts.value).toHaveLength(3)
  })

  it('availableTagsがpostsから一意のタグを返す', async () => {
    const { useSearch } = await import('../useSearch')
    const posts = createPosts()
    const { availableTags } = useSearch(posts)

    expect(availableTags.value).toEqual(['backend', 'frontend', 'nuxt', 'typescript', 'vue'])
  })
})
