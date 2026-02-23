import type { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth/session";

function isHttps(reqUrl: string) {
  try {
    return new URL(reqUrl).protocol === "https:";
  } catch {
    return false;
  }
}

export function setAuthCookie(res: NextResponse, token: string, reqUrl: string) {
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps(reqUrl), // ✅ werkt op localhost http én op prod https
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAuthCookie(res: NextResponse, reqUrl: string) {
  res.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps(reqUrl),
    path: "/",
    maxAge: 0,
  });
}
