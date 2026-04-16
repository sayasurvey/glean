/**
 * Gemini API Lambda関数
 * server/api/gemini.ts から移植
 */
import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { requireAuth, corsHeaders } from '../../shared/src/firebase-auth'
import type { GeminiSummaryData } from '../../shared/src/types'

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
  const origin = event.headers.origin ?? event.headers.Origin ?? '*'

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
      body: JSON.stringify({ summary: '' } satisfies GeminiSummaryData),
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
      body: JSON.stringify({ summary: '' } satisfies GeminiSummaryData),
    }
  }

  // Gemini API呼び出し
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `以下の技術記事のタイトルと説明をもとに、日本語で150字以内の簡潔な要約を生成してください。
タイトル: ${body.ogTitle}
説明: ${body.ogDescription}
要約のみを返してください。`

    const result = await model.generateContent(prompt)
    const summary = result.response.text().trim()

    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify({ summary } satisfies GeminiSummaryData),
    }
  } catch (err) {
    console.error('[Gemini] API error:', err)
    // エラー時も正常系のレスポンスを返す（フロントエンド側で処理）
    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify({ summary: '' } satisfies GeminiSummaryData),
    }
  }
}
