import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { Post } from '~/types/post'

export const useSearch = (posts: Readonly<Ref<Post[]>>) => {
  const keyword = ref('')

  const filteredPosts = computed(() => {
    const kw = keyword.value.trim().toLowerCase()
    if (!kw) return posts.value

    return posts.value.filter(
      (p) =>
        p.title.toLowerCase().includes(kw) ||
        p.description.toLowerCase().includes(kw)
    )
  })

  return {
    keyword,
    filteredPosts,
  }
}
