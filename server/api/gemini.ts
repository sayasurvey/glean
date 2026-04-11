import { GoogleGenerativeAI } from '@google/generative-ai'
import type { GeminiSummaryData } from '~/types/post'
import { requireAuth } from '../utils/firebase-admin'

interface GeminiRequestBody {
  url: string
  ogTitle: string
  ogDescription: string
}

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const body = await readBody<GeminiRequestBody>(event)

  if (!body?.ogTitle && !body?.ogDescription) {
    return { summary: '' } satisfies GeminiSummaryData
  }

  const config = useRuntimeConfig()
  const apiKey = config.geminiApiKey as string

  if (!apiKey) {
    return { summary: '' } satisfies GeminiSummaryData
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `以下の技術記事のタイトルと説明をもとに、日本語で150字以内の簡潔な要約を生成してください。
タイトル: ${body.ogTitle}
説明: ${body.ogDescription}
要約のみを返してください。`

    const result = await model.generateContent(prompt)
    const summary = result.response.text().trim()

    return { summary } satisfies GeminiSummaryData
  } catch {
    return { summary: '' } satisfies GeminiSummaryData
  }
})
