import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware(async () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading.value) {
    await new Promise<void>((resolve) => {
      const stop = watch(isLoading, (loading) => {
        if (!loading) {
          stop()
          resolve()
        }
      })
    })
  }

  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})
