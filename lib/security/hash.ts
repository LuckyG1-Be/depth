import crypto from "crypto";

const HASH_SECRET = process.env.DEPTH_HASH_SECRET || "dev-insecure-secret";

export function stableHash(input: string): string {
  return crypto.createHmac("sha256", HASH_SECRET).update(input).digest("hex");
}

export function safeJson(obj: unknown): string {
  try {
    return JSON.stringify(obj ?? {});
  } catch {
    return "{}";
  }
}
