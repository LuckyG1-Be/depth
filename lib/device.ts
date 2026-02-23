import crypto from "crypto";
import { prisma } from "@/lib/db";

/**
 * Simple SHA256 helper
 */
function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * Try to extract IP from common headers (works behind proxies too)
 */
function getIp(req?: Request) {
  if (!req) return undefined;

  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    // can be "client, proxy1, proxy2"
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim() || undefined;

  return undefined;
}

function getUa(req?: Request) {
  if (!req) return undefined;
  const ua = req.headers.get("user-agent");
  return ua?.trim() || undefined;
}

function getLang(req?: Request) {
  if (!req) return undefined;
  const al = req.headers.get("accept-language");
  return al?.split(",")[0]?.trim() || undefined;
}

function getPlatform(req?: Request) {
  if (!req) return undefined;
  const plat =
    req.headers.get("sec-ch-ua-platform") ||
    req.headers.get("x-platform") ||
    req.headers.get("x-device-platform");
  return plat?.replaceAll('"', "").trim() || undefined;
}

function getTz(req?: Request) {
  if (!req) return undefined;
  const tz = req.headers.get("x-tz") || req.headers.get("x-timezone");
  return tz?.trim() || undefined;
}

/**
 * Build a deterministic fingerprint string (NOT a unique device id, but stable-ish).
 * You can extend this later (e.g. client-side generated fp and pass header/cookie).
 */
function buildFingerprintBasis(req?: Request) {
  const ua = getUa(req) ?? "";
  const lang = getLang(req) ?? "";
  const platform = getPlatform(req) ?? "";
  // avoid using raw IP in fpHash; keep IP separately hashed (privacy-friendly)
  const chUa = req?.headers.get("sec-ch-ua") ?? "";
  const chMobile = req?.headers.get("sec-ch-ua-mobile") ?? "";
  return [ua, lang, platform, chUa, chMobile].join("|");
}

export type TouchDeviceMeta = {
  platform?: string | null;
  tz?: string | null;
  lang?: string | null;
};

export type TouchDeviceArgs =
  | {
      req?: Request;
      userId: string;
      didLogin?: boolean;
      meta?: TouchDeviceMeta;
    }
  | Request;

/**
 * Backwards compatible:
 * - touchDevice(req, userId, didLogin?, meta?)
 * - touchDevice({ req, userId, didLogin, meta })
 */
export async function touchDevice(
  reqOrArgs: Request | { req?: Request; userId: string; didLogin?: boolean; meta?: TouchDeviceMeta },
  userIdMaybe?: string,
  didLoginMaybe?: boolean,
  metaMaybe?: TouchDeviceMeta
) {
  let req: Request | undefined;
  let userId: string;
  let didLogin: boolean | undefined;
  let meta: TouchDeviceMeta | undefined;

  if (reqOrArgs instanceof Request) {
    req = reqOrArgs;
    if (!userIdMaybe) throw new Error("touchDevice: userId missing");
    userId = userIdMaybe;
    didLogin = didLoginMaybe;
    meta = metaMaybe;
  } else {
    req = reqOrArgs.req;
    userId = reqOrArgs.userId;
    didLogin = reqOrArgs.didLogin;
    meta = reqOrArgs.meta;
  }

  const ip = getIp(req);
  const ua = getUa(req);
  const platform = meta?.platform ?? getPlatform(req) ?? undefined;
  const tz = meta?.tz ?? getTz(req) ?? undefined;
  const lang = meta?.lang ?? getLang(req) ?? undefined;

  const fpBasis = buildFingerprintBasis(req);
  const fpHash = sha256(fpBasis);

  const ipHash = ip ? sha256(ip) : undefined;
  const uaHash = ua ? sha256(ua) : undefined;

  // Find existing fingerprint for this user
  const existing = await prisma.deviceFingerprint.findFirst({
    where: {
      fpHash,
      userId, // here userId is string (not nullable), so OK
    },
  });

  if (existing) {
    const updated = await prisma.deviceFingerprint.update({
      where: { id: existing.id },
      data: {
        lastSeenAt: new Date(),
        seenCount: { increment: 1 },
        // update latest context if present
        ...(ipHash ? { ipHash } : {}),
        ...(uaHash ? { uaHash } : {}),
        ...(platform ? { platform } : {}),
        ...(tz ? { tz } : {}),
        ...(lang ? { lang } : {}),
      },
    });

    // optionally update user last login metadata
    if (didLogin) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(),
          ...(ip ? { lastIp: ip } : {}),
          ...(uaHash ? { lastUaHash: uaHash } : {}),
        },
      });
    }

    return updated;
  }

  // Create new fingerprint
  const created = await prisma.deviceFingerprint.create({
    data: {
      userId,
      fpHash,
      ...(ipHash ? { ipHash } : {}),
      ...(uaHash ? { uaHash } : {}),
      ...(platform ? { platform } : {}),
      ...(tz ? { tz } : {}),
      ...(lang ? { lang } : {}),
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
      seenCount: 1,
    },
  });

  if (didLogin) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        ...(ip ? { lastIp: ip } : {}),
        ...(uaHash ? { lastUaHash: uaHash } : {}),
      },
    });
  }

  return created;
}

/**
 * Convenience helpers if you need them elsewhere
 */
export function hashIp(ip: string) {
  return sha256(ip);
}
export function hashUa(ua: string) {
  return sha256(ua);
}
export function hashFingerprintBasis(basis: string) {
  return sha256(basis);
}