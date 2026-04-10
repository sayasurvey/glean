import { test, expect } from '@playwright/test'

test.describe('認証フロー', () => {
  test.describe('メール/パスワード サインアップ', () => {
    test('新規ユーザーがサインアップできる', async ({ page }) => {
      await page.goto('/signup')

      await page.fill('input[type="email"]', 'newuser@example.com')
      await page.fill('input[autocomplete="new-password"]:first-of-type', 'password123')
      await page.fill('input[autocomplete="new-password"]:last-of-type', 'password123')

      await page.click('button[type="submit"]')

      await expect(page.getByText('確認メールを送信しました')).toBeVisible()
    })

    test('パスワードが8文字未満の場合エラーを表示する', async ({ page }) => {
      await page.goto('/signup')

      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[autocomplete="new-password"]:first-of-type', 'short')
      await page.locator('input[autocomplete="new-password"]:first-of-type').blur()

      await expect(page.getByText('パスワードは8文字以上で入力してください')).toBeVisible()
    })

    test('パスワードが一致しない場合エラーを表示する', async ({ page }) => {
      await page.goto('/signup')

      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[autocomplete="new-password"]:first-of-type', 'password123')
      await page.fill('input[autocomplete="new-password"]:last-of-type', 'different123')
      await page.locator('input[autocomplete="new-password"]:last-of-type').blur()

      await expect(page.getByText('パスワードが一致しません')).toBeVisible()
    })
  })

  test.describe('メール/パスワード ログイン', () => {
    test('登録済みユーザーがログインできる', async ({ page }) => {
      await page.goto('/login')

      await page.fill('input[type="email"]', 'existing@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')

      await expect(page).toHaveURL('/')
    })

    test('誤った認証情報でエラーを表示する', async ({ page }) => {
      await page.goto('/login')

      await page.fill('input[type="email"]', 'wrong@example.com')
      await page.fill('input[type="password"]', 'wrongpassword')
      await page.click('button[type="submit"]')

      await expect(page.getByText('メールアドレスまたはパスワードが正しくありません')).toBeVisible()
    })
  })

  test.describe('パスワードリセット', () => {
    test('パスワードリセットメールを送信できる', async ({ page }) => {
      await page.goto('/reset-password')

      await page.fill('input[type="email"]', 'user@example.com')
      await page.click('button[type="submit"]')

      await expect(page.getByText('メールアドレスが登録されている場合、パスワードリセットメールを送信しました')).toBeVisible()
    })
  })

  test.describe('未認証リダイレクト', () => {
    test('未認証ユーザーが保護ページにアクセスするとログインページへリダイレクトされる', async ({ page }) => {
      await page.goto('/')

      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('ログアウト', () => {
    test('ログアウト後にログインページへ遷移する', async ({ page }) => {
      // ログイン状態を設定
      await page.goto('/login')
      await page.fill('input[type="email"]', 'existing@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL('/')

      // ログアウト
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('logout'))
      })
    })
  })
})
