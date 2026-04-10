import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'

const mockNavigateTo = vi.fn()

vi.mock('#app', () => ({
  defineNuxtRouteMiddleware: vi.fn((fn: unknown) => fn),
  navigateTo: mockNavigateTo,
}))

const mockIsAuthenticated = ref(false)
const mockIsLoading = ref(false)

vi.mock('~/composables/useAuth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: computed(() => mockIsAuthenticated.value),
    isLoading: mockIsLoading,
  })),
}))

describe('auth.client ミドルウェア', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsLoading.value = false
    mockIsAuthenticated.value = false
  })

  it('未認証時は /login にリダイレクトする', async () => {
    mockIsAuthenticated.value = false
    mockIsLoading.value = false

    const { default: middleware } = await import('../auth.client')
    await (middleware as Function)(null, null)

    expect(mockNavigateTo).toHaveBeenCalledWith('/login')
  })

  it('認証済み時はリダイレクトしない', async () => {
    mockIsAuthenticated.value = true
    mockIsLoading.value = false

    const { default: middleware } = await import('../auth.client')
    await (middleware as Function)(null, null)

    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('ローディング完了を待ってからリダイレクト判定する', async () => {
    mockIsLoading.value = true
    mockIsAuthenticated.value = false

    const { default: middleware } = await import('../auth.client')

    // ローディング完了をシミュレート
    setTimeout(() => {
      mockIsLoading.value = false
    }, 10)

    await (middleware as Function)(null, null)

    expect(mockNavigateTo).toHaveBeenCalledWith('/login')
  })
})
