/**
 * Gemini API Lambda関数
 * server/api/gemini.ts から移植
 */
import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { requireAuth, corsHeaders } from './firebase-auth'
import type { GeminiSummaryData } from './types'

/**
 * AWS SSM Parameter Store からパラメータを取得
 */
const getSSMParameter = async (paramName: string): Promise<string> => {
  const client = new SSMClient({ region: process.env.AWS_REGION || 'ap-northeast-1' })
  try {
    const response = await client.send(
      new GetParameterCommand({
        Name: paramName,
        WithDecryption: true,
      })
    )
    return response.Parameter?.Value || ''
  } catch (err) {
    console.error('[SSM] Parameter retrieval failed:', err)
    throw new Error(`Failed to retrieve parameter ${paramName}`)
  }
}

/**
 * リクエストボディ型
 */
interface GeminiRequestBody {
  url: string
  ogTitle: string
  ogDescription: string
}

/**
 * Lambda Handler
 */
export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const requestOrigin = event.headers.origin ?? event.headers.Origin ?? ''
  const allowedOrigin = process.env.ALLOWED_ORIGIN ?? ''
  const origin = requestOrigin && requestOrigin === allowedOrigin ? requestOrigin : 'null'

  // OPTIONSプリフライト対応
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: '',
    }
  }

  // 認証検証
  try {
    await requireAuth(event)
  } catch (e: any) {
    return {
      statusCode: e.statusCode ?? 401,
      headers: corsHeaders(origin),
      body: JSON.stringify({ message: e.message || '認証エラー' }),
    }
  }

  // リクエストボディパース
  let body: GeminiRequestBody
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders(origin),
      body: JSON.stringify({ message: 'Invalid JSON' }),
    }
  }

  // タイトル・説明が両方空の場合は空の要約を返す
  if (!body?.ogTitle && !body?.ogDescription) {
    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify({ summary: '', suggestedTags: [] } satisfies GeminiSummaryData),
    }
  }

  // Gemini APIキーの取得
  let apiKey: string
  try {
    const ssmParamName = process.env.SSM_GEMINI_API_KEY
    if (!ssmParamName) {
      throw new Error('SSM_GEMINI_API_KEY is not set')
    }
    apiKey = await getSSMParameter(ssmParamName)
    if (!apiKey) {
      throw new Error('Gemini API key is empty')
    }
  } catch (err) {
    console.error('[Gemini] Failed to retrieve API key:', err)
    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify({ summary: '', suggestedTags: [] } satisfies GeminiSummaryData),
    }
  }

  // Gemini API呼び出し
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

    const MAX_URL_LENGTH = 2048
    const MAX_TEXT_LENGTH = 500
    const safeUrl = (body.url ?? '').slice(0, MAX_URL_LENGTH)
    const safeTitle = (body.ogTitle ?? '').slice(0, MAX_TEXT_LENGTH)
    const safeDescription = (body.ogDescription ?? '').slice(0, MAX_TEXT_LENGTH)

    const prompt = `以下の技術記事の情報をもとに、JSONのみを返してください。マークダウンのコードブロックは使わないでください。

---USER DATA---
URL: ${safeUrl}
タイトル: ${safeTitle}
説明: ${safeDescription}
---END USER DATA---

返答形式（純粋なJSONのみ）:
{"summary":"日本語150字以内の簡潔な要約","tags":["AWS","CloudFrontのような具体的な技術名を3〜5個、英語優先で"]}`

    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    console.log('[Gemini] raw response:', raw)
    // コードブロックや余分なテキストを無視してJSONオブジェクト部分だけを抽出
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON object found in Gemini response')
    const parsed = JSON.parse(jsonMatch[0]) as { summary?: string; tags?: unknown[] }
    console.log('[Gemini] parsed:', JSON.stringify(parsed))
    const summary = typeof parsed.summary === 'string' ? parsed.summary : ''
    const suggestedTags = Array.isArray(parsed.tags)
      ? parsed.tags.filter((t): t is string => typeof t === 'string').slice(0, 5)
      : []
    console.log('[Gemini] suggestedTags:', JSON.stringify(suggestedTags))

    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify({ summary, suggestedTags } satisfies GeminiSummaryData),
    }
  } catch (err) {
    console.error('[Gemini] API error:', err)
    // エラー時も正常系のレスポンスを返す（フロントエンド側で処理）
    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify({ summary: '', suggestedTags: [] } satisfies GeminiSummaryData),
    }
  }
}
