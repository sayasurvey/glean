/**
 * OGP取得API のレスポンス型
 */
export interface OgpData {
  title: string
  description: string
  imageUrl: string | null
  siteName: string | null
}

/**
 * Gemini API呼び出しのレスポンス型
 */
export interface GeminiSummaryData {
  summary: string
  suggestedTags: string[]
}

/**
 * Lambda認証エラー
 */
export interface AuthError {
  statusCode: number
  message: string
}
