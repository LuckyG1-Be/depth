import crypto from "crypto";
import { prisma } from "@/lib/db";
import { touchDevice } from "@/lib/device";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function getIp(req?: Request) {
  if (!req) return undefined;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  return realIp?.trim() || undefined;
}

function getUa(req?: Request) {
  if (!req) return undefined;
  const ua = req.headers.get("user-agent");
  return ua?.trim() || undefined;
}

export type SecurityEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAIL"
  | "OTP_REQUEST"
  | "OTP_FAIL"
  | "OTP_SUCCESS"
  | "RATE_LIMIT"
  | "SUSPICIOUS_DEVICE"
  | "SUSPICIOUS_BEHAVIOR"
  | "REPORT_CREATED"
  | "BLOCK_CREATED"
  | "CHAT_ABUSE"
  | "OTHER";

export type LogSecurityEventArgs = {
  req?: Request;
  userId?: string; // optional: can log anonymous too
  type: SecurityEventType | string;
  severity?: number; // 1..5
  scoreDelta?: number; // +/- risk score delta
  meta?: Record<string, any>;
  /**
   * If you already have an fpHash, you can pass it.
   * Otherwise we'll compute+persist via touchDevice when userId exists.
   */
  fpHash?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function computeRiskLevel(score: number) {
  if (score >= 80) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MEDIUM";
  return "LOW";
}

/**
 * Logs a security event + optionally adjusts user risk score/level.
 * Also tries to keep device fingerprints in sync via touchDevice (if req+userId).
 */
export async function logSecurityEvent(args: LogSecurityEventArgs) {
  const severity = clamp(args.severity ?? 1, 1, 5);
  const scoreDelta = args.scoreDelta ?? 0;

  const ip = getIp(args.req);
  const ua = getUa(args.req);

  const ipHash = ip ? sha256(ip) : undefined;
  const uaHash = ua ? sha256(ua) : undefined;

  let fpHash: string | undefined = args.fpHash;

  // If we have a userId and request, touchDevice will create/update DeviceFingerprint
  // and we can reuse its fpHash.
  if (!fpHash && args.userId && args.req) {
    try {
      const fp = await touchDevice(args.req, args.userId, false).catch(() => null);
      if (fp?.fpHash) fpHash = fp.fpHash;
    } catch {
      // ignore
    }
  }

  const metaStr = JSON.stringify(args.meta ?? {});

  const event = await prisma.securityEvent.create({
    data: {
      userId: args.userId ?? undefined,
      type: args.type,
      severity,
      scoreDelta,
      ...(ipHash ? { ipHash } : {}),
      ...(uaHash ? { uaHash } : {}),
      ...(fpHash ? { fpHash } : {}),
      meta: metaStr,
    },
  });

  if (args.userId && scoreDelta !== 0) {
    await bumpUserRisk(args.userId, scoreDelta);
  }

  return event;
}

/**
 * Increases/decreases the user's risk score and sets riskLevel accordingly.
 * Keeps score >= 0.
 */
export async function bumpUserRisk(userId: string, delta: number) {
  return bumpUserRiskInternal(userId, delta);
}

async function bumpUserRiskInternal(userId: string, delta: number) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, riskScore: true },
  });

  if (!u) return null;

  const nextScore = Math.max(0, (u.riskScore ?? 0) + delta);
  const nextLevel = computeRiskLevel(nextScore);

  return prisma.user.update({
    where: { id: userId },
    data: {
      riskScore: nextScore,
      riskLevel: nextLevel,
    },
  });
}

/**
 * Handy wrapper for login success: logs event, touches device, updates lastLoginAt.
 */
export async function recordLoginSuccess(req: Request, userId: string) {
  // touch device & update last login info
  await touchDevice(req, userId, true).catch(() => {});

  return logSecurityEvent({
    req,
    userId,
    type: "LOGIN_SUCCESS",
    severity: 1,
    scoreDelta: -2, // reward small trust signal
    meta: { kind: "password" },
  });
}

/**
 * Handy wrapper for login fail: logs event and increases risk slightly.
 */
export async function recordLoginFail(req: Request, meta?: Record<string, any>) {
  // anonymous event (no userId)
  return logSecurityEvent({
    req,
    type: "LOGIN_FAIL",
    severity: 2,
    scoreDelta: 0,
    meta,
  });
}

/**
 * A simple "risk scoring" helper you can call from places like rate limiting,
 * suspicious behavior detection, report/block creation, etc.
 */
export async function flagSuspicious(userId: string, req: Request | undefined, reason: string, scoreDelta = 10) {
  return logSecurityEvent({
    req,
    userId,
    type: "SUSPICIOUS_BEHAVIOR",
    severity: 3,
    scoreDelta,
    meta: { reason },
  });
}