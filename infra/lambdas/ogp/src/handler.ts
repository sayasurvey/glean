/**
 * OGP取得Lambda関数
 * server/api/ogp.ts から移植
 */
import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { promises as dns } from 'dns'
import { requireAuth, corsHeaders } from '../../shared/src/firebase-auth'
import type { OgpData } from '../../shared/src/types'

// SSRF対策: プライベートIPレンジのホスト名ブロック
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

/**
 * IPアドレスがプライベートレンジに属するか検証（DNSリバインディング対策）
 */
const isBlockedIp = (ip: string): boolean => {
  return BLOCKED_HOSTNAMES.includes(ip) || BLOCKED_RANGES.some((re) => re.test(ip))
}

/**
 * ホスト名をDNS解決してプライベートIPへの解決をブロック（DNSリバインディング対策）
 * DNS解決自体が失敗した場合（NXDOMAIN等）は許可する（フェッチ時に自然に失敗するため）
 */
const validateResolvedIp = async (hostname: string): Promise<void> => {
  const [v4, v6] = await Promise.all([
    dns.resolve4(hostname).catch(() => [] as string[]),
    dns.resolve6(hostname).catch(() => [] as string[]),
  ])
  const allIps = [...v4, ...v6]
  // IPが解決できた場合のみプライベートIPチェックを行う
  for (const ip of allIps) {
    if (isBlockedIp(ip)) {
      console.warn('[OGP] Blocked private IP detected:', { hostname, ip })
      throw new Error('無効なURLです')
    }
  }
}

/**
 * URLのバリデーション（SSRF対策）
 */
const validateUrl = (urlString: string): URL => {
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    throw new Error('無効なURLです')
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('無効なURLです')
  }

  const hostname = url.hostname.toLowerCase()
  if (isBlockedIp(hostname)) {
    throw new Error('無効なURLです')
  }

  return url
}

/**
 * Fetch時のヘッダー（User-Agent等）
 */
const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
  'Cache-Control': 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
}

/**
 * クッキーを保持しながらリダイレクトを追跡してHTMLを取得
 */
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

    // Set-Cookie ヘッダーを収集
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
      const MAX_HTML_CHARS = 2 * 1024 * 1024
      const text = await response.text()
      return text.length > MAX_HTML_CHARS ? text.slice(0, MAX_HTML_CHARS) : text
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) break
      currentUrl = new URL(location, currentUrl).href
      // リダイレクト先も構文検証＋DNS解決検証を行う
      const redirectUrl = validateUrl(currentUrl)
      await validateResolvedIp(redirectUrl.hostname.toLowerCase())
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  }

  throw new Error('Too many redirects')
}

/**
 * HTMLのmetaタグからOGP情報を抽出
 */
const extractMeta = (html: string, property: string): string | null => {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`,
      'is'
    ),
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

/**
 * HTMLエンティティのデコード
 */
const decodeHtmlEntities = (str: string): string => {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => {
      const n = Number(code)
      if (n < 0x20 || n === 0x7f) return ''
      return String.fromCharCode(n)
    })
}

/**
 * titleタグからタイトルを抽出（og:title優先）
 */
const extractTitle = (html: string): string => {
  const ogTitle = extractMeta(html, 'og:title')
  if (ogTitle) return ogTitle
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/is)
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : ''
}

/**
 * Lambda Handler
 */
export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const requestOrigin = event.headers.origin ?? event.headers.Origin ?? ''
  const allowedOrigin = process.env.ALLOWED_ORIGIN ?? ''
  const origin = requestOrigin === allowedOrigin ? requestOrigin : ''

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

  // URLパラメータの取得
  const url = event.queryStringParameters?.url
  if (!url) {
    return {
      statusCode: 400,
      headers: corsHeaders(origin),
      body: JSON.stringify({ message: 'url パラメータが必要です' }),
    }
  }

  const MAX_URL_LENGTH = 2048
  if (url.length > MAX_URL_LENGTH) {
    return {
      statusCode: 400,
      headers: corsHeaders(origin),
      body: JSON.stringify({ message: '無効なURLです' }),
    }
  }

  // URLバリデーション（構文チェック + DNSリバインディング対策）
  try {
    const parsedUrl = validateUrl(url)
    await validateResolvedIp(parsedUrl.hostname.toLowerCase())
  } catch (e) {
    console.error('[OGP] URL validation failed:', { url, error: (e as Error).message })
    return {
      statusCode: 400,
      headers: corsHeaders(origin),
      body: JSON.stringify({ message: '無効なURLです' }),
    }
  }

  // OGP取得と抽出
  try {
    const html = await fetchHtmlWithCookies(url)

    console.log('[OGP] html fetched:', { url, htmlLength: html.length, htmlPrefix: html.slice(0, 100) })

    const ogpData: OgpData = {
      title: extractTitle(html),
      description: extractMeta(html, 'og:description') ?? extractMeta(html, 'description') ?? '',
      imageUrl: extractMeta(html, 'og:image'),
      siteName: extractMeta(html, 'og:site_name'),
    }

    console.log('[OGP] success:', { url, title: ogpData.title, hasImage: !!ogpData.imageUrl })

    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify(ogpData),
    }
  } catch (err) {
    const e = err as Error
    console.error('[OGP] fetch error:', { url, error: String(err), name: e.name, message: e.message })
    // エラー時も正常系のレスポンスを返す（フロントエンド側で処理）
    const ogpData: OgpData = {
      title: '',
      description: '',
      imageUrl: null,
      siteName: null,
    }
    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify(ogpData),
    }
  }
}
