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
    return { summary: '', suggestedTags: [] } satisfies GeminiSummaryData
  }

  const config = useRuntimeConfig()
  const apiKey = config.geminiApiKey as string

  if (!apiKey) {
    return { summary: '', suggestedTags: [] } satisfies GeminiSummaryData
  }

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
    // コードブロックや余分なテキストを無視してJSONオブジェクト部分だけを抽出
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON object found in Gemini response')
    const parsed = JSON.parse(jsonMatch[0]) as { summary?: string; tags?: unknown[] }
    const summary = typeof parsed.summary === 'string' ? parsed.summary : ''
    const suggestedTags = Array.isArray(parsed.tags)
      ? parsed.tags.filter((t): t is string => typeof t === 'string').slice(0, 5)
      : []

    return { summary, suggestedTags } satisfies GeminiSummaryData
  } catch {
    return { summary: '', suggestedTags: [] } satisfies GeminiSummaryData
  }
})
