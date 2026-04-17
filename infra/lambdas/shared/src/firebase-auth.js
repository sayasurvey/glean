"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsHeaders = exports.requireAuth = void 0;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
let adminInitialized = false;
/**
 * Firebase Admin SDK の初期化（初回のみ実行）
 */
const initAdmin = () => {
    if (adminInitialized || (0, app_1.getApps)().length > 0)
        return;
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT が設定されていません');
    }
    try {
        (0, app_1.initializeApp)({ credential: (0, app_1.cert)(JSON.parse(serviceAccount)) });
        adminInitialized = true;
    }
    catch (err) {
        console.error('[Firebase] initialization error:', err);
        throw err;
    }
};
/**
 * APIGatewayProxyEvent から認証トークンを検証し、uid を返す
 * 認証失敗時は AuthError を throw
 */
const requireAuth = async (event) => {
    initAdmin();
    const authHeader = event.headers.authorization ?? event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        const err = { statusCode: 401, message: '認証が必要です' };
        throw err;
    }
    const token = authHeader.slice(7);
    try {
        const decoded = await (0, auth_1.getAuth)().verifyIdToken(token);
        return decoded.uid;
    }
    catch (err) {
        console.error('[Firebase Auth] token verification failed:', err);
        const authErr = { statusCode: 401, message: '無効なトークンです' };
        throw authErr;
    }
};
exports.requireAuth = requireAuth;
/**
 * CORS レスポンスヘッダーを生成
 */
const corsHeaders = (origin = '*') => ({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json',
});
exports.corsHeaders = corsHeaders;
//# sourceMappingURL=firebase-auth.js.map