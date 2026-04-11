import type { OgpData } from '~/types/post'
import { requireAuth } from '../utils/firebase-admin'

const BLOCKED_HOSTNAMES = ['localhost', '127.0.0.1', '::1', '0.0.0.0', '169.254.169.254']
const BLOCKED_RANGES = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
]

const validateUrl = (urlString: string): void => {
  const url = new URL(urlString)

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw createError({ statusCode: 400, statusMessage: '無効なURLです' })
  }

  const hostname = url.hostname.toLowerCase()
  if (BLOCKED_HOSTNAMES.includes(hostname) || BLOCKED_RANGES.some((re) => re.test(hostname))) {
    throw createError({ statusCode: 400, statusMessage: '無効なURLです' })
  }
}

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
}

// クッキーを保持しながらリダイレクトを追跡してHTMLを取得する
// $fetch はリダイレクト時にクッキーを引き継がないため、手動でクッキーを管理する
const fetchHtmlWithCookies = async (urlString: string, maxRedirects = 10): Promise<string> => {
  let currentUrl = urlString
  const cookieJar = new Map<string, string>()

  for (let i = 0; i < maxRedirects; i++) {
    const cookieString = Array.from(cookieJar.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ')

    const response = await fetch(currentUrl, {
      headers: {
        ...FETCH_HEADERS,
        ...(cookieString ? { Cookie: cookieString } : {}),
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    })

    // Set-Cookie ヘッダーを収集してクッキージャーに保存
    const setCookieHeaders = response.headers.getSetCookie?.() ?? []
    for (const header of setCookieHeaders) {
      const [keyValue] = header.split(';')
      const eqIdx = keyValue.indexOf('=')
      if (eqIdx > 0) {
        const key = keyValue.slice(0, eqIdx).trim()
        const value = keyValue.slice(eqIdx + 1).trim()
        cookieJar.set(key, value)
      }
    }

    if (response.status >= 200 && response.status < 300) {
      return await response.text()
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) break
      currentUrl = new URL(location, currentUrl).href
      validateUrl(currentUrl)
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  }

  throw new Error('Too many redirects')
}

// meta タグから content 属性値を抽出（属性順不問・改行対応・ダブルクォート/シングルクォート両対応）
const extractMeta = (html: string, property: string): string | null => {
  // property/name 属性が先のパターン
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`,
      'is'
    ),
    // content 属性が先のパターン
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["']`,
      'is'
    ),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return decodeHtmlEntities(match[1])
  }
  return null
}

const decodeHtmlEntities = (str: string): string => {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
}

const extractTitle = (html: string): string => {
  const ogTitle = extractMeta(html, 'og:title')
  if (ogTitle) return ogTitle
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/is)
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : ''
}

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const query = getQuery(event)
  const url = query.url as string

  if (!url) {
    throw createError({ statusCode: 400, statusMessage: 'url パラメータが必要です' })
  }

  try {
    validateUrl(url)
  } catch (e) {
    if ((e as { statusCode?: number }).statusCode) throw e
    throw createError({ statusCode: 400, statusMessage: '無効なURLです' })
  }

  try {
    const html = await fetchHtmlWithCookies(url)

    const ogpData: OgpData = {
      title: extractTitle(html),
      description: extractMeta(html, 'og:description') ?? extractMeta(html, 'description') ?? '',
      imageUrl: extractMeta(html, 'og:image'),
      siteName: extractMeta(html, 'og:site_name'),
    }

    return ogpData
  } catch (err) {
    console.error('[OGP] fetch error:', err)
    return {
      title: '',
      description: '',
      imageUrl: null,
      siteName: null,
    } satisfies OgpData
  }
})
