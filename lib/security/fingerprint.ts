import { stableHash } from "./hash";

export type FingerprintPayload = {
  fp: string;          // raw fingerprint string from client
  platform?: string;
  tz?: string;
  lang?: string;
};

export function hashFingerprint(fpRaw: string): string {
  // normalize to reduce accidental churn
  const normalized = (fpRaw || "").trim().toLowerCase();
  return stableHash(`fp:${normalized}`);
}

export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  // keep privacy: hash only
  return stableHash(`ip:${ip}`);
}

export function hashUa(ua: string | null): string | null {
  if (!ua) return null;
  return stableHash(`ua:${ua}`);
}

export function getClientIpFromRequest(req: Request): string | null {
  // Common proxy headers
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr.trim();
  return null;
}

export function getUserAgent(req: Request): string | null {
  return req.headers.get("user-agent");
}
