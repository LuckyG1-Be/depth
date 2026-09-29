import type { Initial } from "./types";
import { DEPTH_MIN_CHARS, Q_KEYS, REQUIRED_PASSIONS, REQUIRED_VALUES } from "./constants";

export function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function postJson(url: string, body: unknown, opts?: { keepalive?: boolean }) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: !!opts?.keepalive,
  });

  const data = await res.json().catch(() => ({}));
  const record = readRecord(data);

  if (!res.ok || record.ok === false) {
    const msg =
      String(record.message || record.error || "") ||
      (res.status === 403 ? "Actie geweigerd." : res.status === 401 ? "Niet ingelogd." : "Opslaan mislukt");
    throw new Error(msg);
  }

  return data;
}

export function depthOk(profile: Initial["profile"]) {
  return Q_KEYS.every((k) => (profile[k] || "").trim().length >= DEPTH_MIN_CHARS);
}

export function normalizePickList(list: string[], max: number) {
  const cleaned: string[] = [];
  const seen = new Set<string>();
  for (const v of Array.isArray(list) ? list : []) {
    const s = String(v || "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    cleaned.push(s);
    if (cleaned.length >= max) break;
  }
  return cleaned;
}

export function normalizeProfile(p: Initial["profile"]): Initial["profile"] {
  return {
    ...p,
    values: normalizePickList(p.values || [], REQUIRED_VALUES),
    passions: normalizePickList(p.passions || [], REQUIRED_PASSIONS),
  };
}
