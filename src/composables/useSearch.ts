import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { Post } from '~/types/post'

export const useSearch = (posts: Readonly<Ref<Post[]>>) => {
  const keyword = ref('')
  const activeTags = ref<string[]>([])

  const filteredPosts = computed(() => {
    let result = posts.value

    if (activeTags.value.length > 0) {
      result = result.filter((p) =>
        activeTags.value.every((tag) => p.tags.includes(tag))
      )
    }

    const kw = keyword.value.trim().toLowerCase()
    if (kw) {
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(kw) ||
          p.description.toLowerCase().includes(kw)
      )
    }

    return result
  })

  const availableTags = computed(() => {
    const tagSet = new Set<string>()
    posts.value.forEach((p) => p.tags.forEach((t) => tagSet.add(t)))
    return [...tagSet].sort()
  })

  const clearSearch = () => {
    keyword.value = ''
    activeTags.value = []
  }

  return {
    keyword,
    activeTags,
    filteredPosts,
    availableTags,
    clearSearch,
  }
}
