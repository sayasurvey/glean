/**
 * Firebase Admin SDK を使用した Lambda 向け認証検証
 */
import type { APIGatewayProxyEvent } from 'aws-lambda';
/**
 * APIGatewayProxyEvent から認証トークンを検証し、uid を返す
 * 認証失敗時は AuthError を throw
 */
export declare const requireAuth: (event: APIGatewayProxyEvent) => Promise<string>;
/**
 * CORS レスポンスヘッダーを生成
 */
export declare const corsHeaders: (origin?: string) => {
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Headers': string;
    'Access-Control-Allow-Methods': string;
    'Content-Type': string;
};
//# sourceMappingURL=firebase-auth.d.ts.map