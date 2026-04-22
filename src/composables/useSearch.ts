import { ref, computed } from 'vue'
import type { DeepReadonly, Ref } from 'vue'
import type { Post } from '~/types/post'

export const useSearch = (posts: DeepReadonly<Ref<Post[]>>) => {
  const keyword = ref('')
  const activeTags = ref<string[]>([])

  const availableTags = computed(() => {
    const tagSet = new Set<string>()
    for (const post of posts.value) {
      for (const tag of post.tags) tagSet.add(tag)
    }
    return [...tagSet].sort()
  })

  const filteredPosts = computed(() => {
    const kw = keyword.value.trim().toLowerCase()
    const tags = activeTags.value

    return posts.value.filter((p) => {
      const matchesKeyword =
        !kw ||
        p.title.toLowerCase().includes(kw) ||
        p.description.toLowerCase().includes(kw)

      const matchesTags =
        tags.length === 0 || tags.every((t) => p.tags.includes(t))

      return matchesKeyword && matchesTags
    })
  })

  const clearSearch = () => {
    keyword.value = ''
    activeTags.value = []
  }

  return {
    keyword,
    activeTags,
    availableTags,
    filteredPosts,
    clearSearch,
  }
}
