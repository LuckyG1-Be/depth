import { NextResponse } from "next/server";

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const xrip = req.headers.get("x-real-ip");
  return xrip?.trim() || "unknown";
}

export async function enforceMaxBodyBytes(req: Request, maxBytes: number): Promise<NextResponse | null> {
  const len = req.headers.get("content-length");
  if (len) {
    const n = Number(len);
    if (Number.isFinite(n) && n > maxBytes) {
      return NextResponse.json({ ok: false, error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    }
  }
  return null;
}

type RateLimitArgs = {
  key: string;
  limit: number;
  windowMs: number;
  message?: string;
};

/**
 * Minimal in-memory limiter (dev). In prod best vervangen door Redis/Upstash.
 */
const buckets = new Map<string, { resetAt: number; count: number }>();

export function rateLimitOrNull(args: RateLimitArgs): NextResponse | null {
  const now = Date.now();
  const b = buckets.get(args.key);

  if (!b || now > b.resetAt) {
    buckets.set(args.key, { resetAt: now + args.windowMs, count: 1 });
    return null;
  }

  b.count += 1;
  if (b.count > args.limit) {
    return NextResponse.json(
      { ok: false, error: args.message || "RATE_LIMIT" },
      { status: 429 }
    );
  }

  return null;
}

/**
 * Some routes call this; keep it async-friendly.
 */
export async function rateLimitOrNullAsync(args: RateLimitArgs): Promise<NextResponse | null> {
  return rateLimitOrNull(args);
}
