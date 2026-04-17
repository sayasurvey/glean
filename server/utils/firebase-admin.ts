import type { H3Event } from 'h3'
import { getHeader, createError } from 'h3'

const initAdmin = async (): Promise<void> => {
  const { getApps, initializeApp, cert } = await import('firebase-admin/app')

  if (getApps().length > 0) return

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT が設定されていません')
  }
  initializeApp({ credential: cert(JSON.parse(serviceAccount)) })
}

export const requireAuth = async (event: H3Event): Promise<string> => {
  await initAdmin()

  const { getAuth } = await import('firebase-admin/auth')

  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: '認証が必要です' })
  }

  const token = authHeader.slice(7)
  try {
    const decoded = await getAuth().verifyIdToken(token)
    return decoded.uid
  } catch {
    throw createError({ statusCode: 401, statusMessage: '無効なトークンです' })
  }
}
