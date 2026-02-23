import { SignJWT, jwtVerify } from "jose";

export const PHONE_PENDING_COOKIE = "depth_phone_pending";
export const PHONE_VERIFY_COOKIE = "depth_phone_verified";

type PhonePurpose = "REGISTER" | "LOGIN";

type PhonePayload = {
  phone: string;
  purpose: PhonePurpose;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET in .env");
  return new TextEncoder().encode(secret);
}

export function normalizePhone(input: string) {
  const raw = (input || "").trim();
  if (!raw) return "";
  // Keep + and digits only
  const cleaned = raw.replace(/[^\d+]/g, "");
  // ensure + prefix for E.164-like storage (simple dev normalizer)
  if (cleaned.startsWith("+")) return cleaned;
  return `+${cleaned}`;
}

export function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashCode(code: string) {
  // simple hash, route uses crypto; keep helper simple for UI/dev
  return code;
}

export function makePhoneToken(phone: string, purpose: PhonePurpose, ttlMs: number) {
  const secret = getJwtSecret();
  return new SignJWT({ phone, purpose } satisfies PhonePayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + ttlMs) / 1000))
    .sign(secret);
}

export async function readPhoneToken(token: string | null): Promise<PhonePayload | null> {
  if (!token) return null;
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    const phone = payload.phone;
    const purpose = payload.purpose;
    if (typeof phone !== "string") return null;
    if (purpose !== "REGISTER" && purpose !== "LOGIN") return null;
    return { phone, purpose };
  } catch {
    return null;
  }
}

// Backwards-compatible aliases (voor code die deze namen verwacht)
export const createPhoneVerifyToken = makePhoneToken;
export async function verifyPhoneVerifyToken(token: string) {
  const p = await readPhoneToken(token);
  return p?.phone ?? null;
}


