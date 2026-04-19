/**
 * Firebase Admin SDK を使用した Lambda 向け認証検証
 */
import type { APIGatewayProxyEvent } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import type { AuthError } from './types'

const ssmClient = new SSMClient({ region: process.env.AWS_REGION || 'ap-northeast-1' })

/**
 * AWS SSM Parameter Store からパラメータを取得
 */
export const getSSMParameter = async (paramName: string): Promise<string> => {
  try {
    const response = await ssmClient.send(
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
 * Firebase Admin SDK の初期化（並行cold startでも1回だけ実行されるシングルトン）
 */
let initPromise: Promise<void> | null = null

const _initAdmin = async (): Promise<void> => {
  if (getApps().length > 0) return

  const ssmParamName = process.env.SSM_FIREBASE_SERVICE_ACCOUNT
  if (!ssmParamName) {
    throw new Error('SSM_FIREBASE_SERVICE_ACCOUNT が設定されていません')
  }

  try {
    const serviceAccount = await getSSMParameter(ssmParamName)
    initializeApp({ credential: cert(JSON.parse(serviceAccount)) })
  } catch (err) {
    console.error('[Firebase] initialization error:', err)
    initPromise = null
    throw err
  }
}

const initAdmin = (): Promise<void> => {
  if (!initPromise) {
    initPromise = _initAdmin()
  }
  return initPromise
}

/**
 * APIGatewayProxyEvent から認証トークンを検証し、uid を返す
 * 認証失敗時は AuthError を throw
 */
export const requireAuth = async (event: APIGatewayProxyEvent): Promise<string> => {
  await initAdmin()

  const authHeader = event.headers.authorization ?? event.headers.Authorization
  if (!authHeader?.startsWith('Bearer ')) {
    throw { statusCode: 401, message: '認証が必要です' } satisfies AuthError
  }

  const token = authHeader.slice(7)
  try {
    const decoded = await getAuth().verifyIdToken(token)
    return decoded.uid
  } catch (err) {
    console.error('[Firebase Auth] token verification failed:', err)
    throw { statusCode: 401, message: '無効なトークンです' } satisfies AuthError
  }
}

/**
 * CORS レスポンスヘッダーを生成
 */
export const corsHeaders = (origin: string) => {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json',
  }
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}
