import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET in environment");
  return encoder.encode(secret);
}

export type JwtPayload = {
  sub: string; // userId
};

export async function signAuthToken(userId: string) {
  const secret = getSecret();
  return await new SignJWT({}) // keep payload minimal; use sub
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyAuthToken(token: string): Promise<JwtPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const sub = payload.sub;
    if (!sub || typeof sub !== "string") return null;
    return { sub };
  } catch {
    return null;
  }
}
