import type { NextResponse } from "next/server";

export { AUTH_COOKIE, getSession } from "@/lib/auth/session";
export { verifyAuthToken } from "@/lib/auth/jwt";

import { signAuthToken } from "@/lib/auth/jwt";
import { setAuthCookie, clearAuthCookie } from "@/lib/auth/responseCookies";

/**
 * Backwards compatible exports for older imports:
 * - signToken(userId)  -> signs auth JWT
 * - setSession(res, token, reqUrl) -> sets cookie
 * - clearSession(res, reqUrl) -> clears cookie
 */
export async function signToken(userId: string) {
  return await signAuthToken(userId);
}

export function setSession(res: NextResponse, token: string, reqUrl: string) {
  setAuthCookie(res, token, reqUrl);
}

export function clearSession(res: NextResponse, reqUrl: string) {
  clearAuthCookie(res, reqUrl);
}