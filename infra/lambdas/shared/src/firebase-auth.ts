/**
 * Firebase Admin SDK を使用した Lambda 向け認証検証
 */
import type { APIGatewayProxyEvent } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import type { AuthError } from './types'

let adminInitialized = false

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
 * Firebase Admin SDK の初期化（初回のみ実行）
 */
const initAdmin = async (): Promise<void> => {
  if (adminInitialized || getApps().length > 0) return

  const ssmParamName = process.env.SSM_FIREBASE_SERVICE_ACCOUNT
  if (!ssmParamName) {
    throw new Error('SSM_FIREBASE_SERVICE_ACCOUNT が設定されていません')
  }

  try {
    const serviceAccount = await getSSMParameter(ssmParamName)
    initializeApp({ credential: cert(JSON.parse(serviceAccount)) })
    adminInitialized = true
  } catch (err) {
    console.error('[Firebase] initialization error:', err)
    throw err
  }
}

/**
 * APIGatewayProxyEvent から認証トークンを検証し、uid を返す
 * 認証失敗時は AuthError を throw
 */
export const requireAuth = async (event: APIGatewayProxyEvent): Promise<string> => {
  await initAdmin()

  const authHeader = event.headers.authorization ?? event.headers.Authorization
  if (!authHeader?.startsWith('Bearer ')) {
    const err: AuthError = { statusCode: 401, message: '認証が必要です' }
    throw err
  }

  const token = authHeader.slice(7)
  try {
    const decoded = await getAuth().verifyIdToken(token)
    return decoded.uid
  } catch (err) {
    console.error('[Firebase Auth] token verification failed:', err)
    const authErr: AuthError = { statusCode: 401, message: '無効なトークンです' }
    throw authErr
  }
}

/**
 * CORS レスポンスヘッダーを生成
 */
export const corsHeaders = (origin: string = '*') => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Content-Type': 'application/json',
})
