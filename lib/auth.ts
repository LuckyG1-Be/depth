import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

export type AuthSession = {
  user: {
    id: string;
  };
};

// ✅ ÉÉN COOKIE NAAM overal (matcht middleware.ts)
export const AUTH_COOKIE = "depth_token";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET in .env");
  return new TextEncoder().encode(secret);
}

export async function signToken(userId: string) {
  const secret = getJwtSecret();
  // ✅ canonical: sub = userId
  return await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const sub = payload.sub;
    if (!sub || typeof sub !== "string") return null;
    return sub;
  } catch {
    return null;
  }
}

// ✅ localhost-proof secure flag (https => secure, http => not secure)
function isHttpsFromReqUrl(reqUrl: string) {
  try {
    return new URL(reqUrl).protocol === "https:";
  } catch {
    return false;
  }
}

export function setSession(res: NextResponse, token: string, reqUrl: string) {
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttpsFromReqUrl(reqUrl),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSession(res: NextResponse, reqUrl: string) {
  res.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttpsFromReqUrl(reqUrl),
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(): Promise<AuthSession | null> {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const userId = await verifyToken(token);
  if (!userId) return null;

  return { user: { id: userId } };
}




