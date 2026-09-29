import { SignJWT, jwtVerify } from "jose";

export const EMAIL_VERIFY_COOKIE = "depth_email_verified";

type EmailPayload = {
  email: string;
  purpose: "REGISTER" | "LINK";
};

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

export async function makeEmailToken(
  email: string,
  purpose: EmailPayload["purpose"],
  ttlMs: number,
) {
  return new SignJWT({ email, purpose } satisfies EmailPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${Math.max(1, Math.floor(ttlMs / 1000))}s`)
    .sign(secretKey());
}

export async function readEmailToken(token: string | null): Promise<EmailPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const email = payload.email;
    const purpose = payload.purpose;
    if (typeof email !== "string") return null;
    if (purpose !== "REGISTER" && purpose !== "LINK") return null;
    return { email, purpose };
  } catch {
    return null;
  }
}
