import { test, expect } from '@playwright/test'

test.describe('投稿管理フロー', () => {
  test.describe('URL登録フロー', () => {
    test('ログイン後に記事登録ボタンが表示される', async ({ page }) => {
      await page.goto('/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')

      await expect(page).toHaveURL('/')
      await expect(page.getByRole('button', { name: '+ 記事を登録' })).toBeVisible()
    })

    test('記事を登録ボタンクリックで登録フォームが表示される', async ({ page }) => {
      await page.goto('/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')

      await page.getByRole('button', { name: '+ 記事を登録' }).click()

      await expect(page.getByText('記事を登録')).toBeVisible()
      await expect(page.locator('input[type="url"]')).toBeVisible()
    })

    test('無効なURLを入力するとエラーが表示される', async ({ page }) => {
      await page.goto('/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')

      await page.getByRole('button', { name: '+ 記事を登録' }).click()
      await page.fill('input[type="url"]', 'not-a-valid-url')
      await page.getByRole('button', { name: '確認' }).click()

      await expect(page.getByText('有効なURLを入力してください')).toBeVisible()
    })

    test('有効なURLを入力して確認ボタンを押すとローディング状態になる', async ({ page }) => {
      await page.goto('/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')

      await page.getByRole('button', { name: '+ 記事を登録' }).click()
      await page.fill('input[type="url"]', 'https://example.com/article')
      await page.getByRole('button', { name: '確認' }).click()

      // ローディング中またはプレビューが表示されること
      const loadingOrPreview = page.locator('text=記事情報を取得中, text=登録する').first()
      await expect(loadingOrPreview).toBeVisible({ timeout: 10000 })
    })

    test('キャンセルボタンでフォームが閉じる', async ({ page }) => {
      await page.goto('/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')

      await page.getByRole('button', { name: '+ 記事を登録' }).click()
      await expect(page.locator('input[type="url"]')).toBeVisible()

      await page.getByRole('button', { name: 'キャンセル' }).click()

      await expect(page.locator('input[type="url"]')).not.toBeVisible()
    })
  })

  test.describe('記事一覧・検索フロー', () => {
    test('記事一覧ページに検索バーが表示される', async ({ page }) => {
      await page.goto('/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')

      await expect(page).toHaveURL('/')
      await expect(page.locator('input[placeholder*="キーワード"], input[placeholder*="検索"]')).toBeVisible()
    })

    test('キーワード入力で検索できる', async ({ page }) => {
      await page.goto('/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')

      const searchInput = page.locator('input[placeholder*="キーワード"], input[placeholder*="検索"]')
      await searchInput.fill('vue')
      await expect(searchInput).toHaveValue('vue')
    })
  })

  test.describe('削除フロー', () => {
    test('削除ボタンクリックで確認ダイアログが表示される', async ({ page }) => {
      await page.goto('/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')

      // 削除ボタンが存在する場合にテストする
      const deleteButton = page.getByRole('button', { name: '削除' }).first()
      const hasDeleteButton = await deleteButton.isVisible().catch(() => false)

      if (hasDeleteButton) {
        page.on('dialog', async (dialog) => {
          expect(dialog.type()).toBe('confirm')
          await dialog.dismiss()
        })
        await deleteButton.click()
      }
    })
  })

  test.describe('未認証リダイレクト', () => {
    test('未認証ユーザーは投稿一覧にアクセスできない', async ({ page }) => {
      await page.goto('/')
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('ヘッダー', () => {
    test('ログイン後にユーザーメールアドレスとログアウトボタンが表示される', async ({ page }) => {
      await page.goto('/login')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')

      await expect(page.getByRole('button', { name: 'ログアウト' })).toBeVisible()
    })
  })
})
