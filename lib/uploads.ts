// lib/uploads.ts
import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { R2Bucket } from "@cloudflare/workers-types";

const PRIVATE_UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "uploads"); // ✅ private (niet in /public)

const LEGACY_PUBLIC_DIR = path.join(process.cwd(), "public", "uploads"); // fallback read-only

const MAX_BYTES = 8 * 1024 * 1024; // 8MB (incoming)
const MAX_PIXELS = 25_000_000; // anti “decompression bomb”
const MAX_DIM = 2200; // output max width/height
const MIN_DIM = 320; // avoid tiny / unusable uploads

type UploadEnv = { UPLOADS?: R2Bucket };

async function getUploadBucket(): Promise<R2Bucket | undefined> {
  try {
    // Route handlers already run inside the OpenNext request context. The
    // synchronous accessor is also what the D1 adapter uses in this app.
    const { env } = getCloudflareContext();
    return (env as unknown as UploadEnv).UPLOADS;
  } catch {
    // Local Next.js development has no R2 binding. Use the disk fallback there.
    return undefined;
  }
}

export type UploadableFile = {
  name: string;
  type?: string;
  size?: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export type SavedUpload = {
  uploadPath: string; // "/uploads/<filename>"
  mime: string; // stored mime (after processing)
  width: number | null;
  height: number | null;
  sizeBytes: number;
  contentHash: string; // sha256 of stored bytes
  aHash: string | null; // simple perceptual hash (8x8 average hash)
  thumbPath: string; // "/uploads/_thumbs/<filename>"
};

function ensureUploadDir() {
  if (!fs.existsSync(PRIVATE_UPLOAD_DIR)) fs.mkdirSync(PRIVATE_UPLOAD_DIR, { recursive: true });
}

function ensureThumbDir() {
  const dir = path.join(PRIVATE_UPLOAD_DIR, "_thumbs");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function extFromMime(mime: string | undefined) {
  const m = (mime || "").toLowerCase();
  if (m === "image/jpeg") return ".jpg";
  if (m === "image/png") return ".png";
  if (m === "image/webp") return ".webp";
  if (m === "image/gif") return ".gif";
  return "";
}

export function normalizeFilename(original: string) {
  const base = path.basename(original || "upload");
  const ext = path.extname(base).toLowerCase();
  const name = base.replace(ext, "");
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  const safeExt = ext && ext.length <= 8 ? ext : "";
  const rand = crypto.randomBytes(8).toString("hex");
  return `${safeName || "file"}-${rand}${safeExt}`;
}

function normalizeToFilename(filenameOrUrl: string) {
  const clean = (filenameOrUrl || "").split("?")[0];
  if (clean.startsWith("/uploads/")) return clean.replace("/uploads/", "");
  return path.basename(clean);
}

function storageKey(filenameOrUrl: string) {
  const clean = (filenameOrUrl || "").split("?")[0].replace(/^\/+/, "");
  return clean.startsWith("uploads/") ? clean : `uploads/${normalizeToFilename(clean)}`;
}

export function resolveUploadPath(filenameOrUrl: string) {
  const filename = normalizeToFilename(filenameOrUrl);
  return path.join(PRIVATE_UPLOAD_DIR, filename);
}

export function contentTypeFromFilename(filenameOrUrl: string) {
  const fn = normalizeToFilename(filenameOrUrl).toLowerCase();
  if (fn.endsWith(".webp")) return "image/webp";
  if (fn.endsWith(".jpg") || fn.endsWith(".jpeg")) return "image/jpeg";
  if (fn.endsWith(".png")) return "image/png";
  if (fn.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

function assertUploadAllowed(file: UploadableFile) {
  const name = (file.name || "").toLowerCase();

  // block HEIC/SVG by extension too
  if (name.endsWith(".heic") || name.endsWith(".heif") || name.endsWith(".svg")) {
    throw new Error("UNSUPPORTED_FILETYPE");
  }

  const mime = (file.type || "").toLowerCase();
  const ok = mime === "image/jpeg" || mime === "image/png" || mime === "image/webp" || mime === "image/gif" || mime === "";
  if (!ok) throw new Error("UNSUPPORTED_FILETYPE");
}

function hasImageSignature(buffer: Buffer, mime: string) {
  if (mime === "image/jpeg") return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === "image/gif") return buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a";
  if (mime === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

async function decodeAndNormalizeImage(input: Buffer) {
  // rotate() strips EXIF-orientation issues
  const meta = await sharp(input, { limitInputPixels: MAX_PIXELS }).metadata();

  const w = meta.width || 0;
  const h = meta.height || 0;

  if (w < MIN_DIM || h < MIN_DIM) throw new Error("IMAGE_TOO_SMALL");

  const resized = sharp(input, { limitInputPixels: MAX_PIXELS })
    .rotate()
    .resize({
      width: MAX_DIM,
      height: MAX_DIM,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 85 });

  const buffer = await resized.toBuffer();
  const outMeta = await sharp(buffer).metadata();

  return {
    buffer,
    width: outMeta.width ?? null,
    height: outMeta.height ?? null,
  };
}

async function computeAHashWebp(buf: Buffer) {
  // 8x8 grayscale average hash, returned as 16 hex chars (64-bit)
  const raw = await sharp(buf).rotate().resize(8, 8, { fit: "fill" }).grayscale().raw().toBuffer();
  let sum = 0;
  for (const v of raw) sum += v;
  const avg = sum / raw.length;

  let bits = 0n;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] >= avg) bits |= 1n << BigInt(63 - i);
  }
  return bits.toString(16).padStart(16, "0");
}

async function makeThumb(buf: Buffer) {
  // Small, non-blurred thumb for fast grids. 512px max.
  const out = await sharp(buf)
    .rotate()
    .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 72 })
    .toBuffer();
  return out;
}

export function readUploadFileWithLegacyFallback(uploadPathOrUrl: string) {
  try {
    const disk = resolveUploadPath(uploadPathOrUrl);
    if (fs.existsSync(disk)) return fs.readFileSync(disk);

    // legacy fallback: /public/uploads
    const fn = normalizeToFilename(uploadPathOrUrl);
    const legacy = path.join(LEGACY_PUBLIC_DIR, fn);
    if (fs.existsSync(legacy)) return fs.readFileSync(legacy);
  } catch {
    // ignore
  }
  return null;
}

export async function readUploadFile(uploadPathOrUrl: string) {
  const local = readUploadFileWithLegacyFallback(uploadPathOrUrl);
  if (local) return local;

  const bucket = await getUploadBucket();
  if (!bucket) return null;

  const object = await bucket.get(storageKey(uploadPathOrUrl));
  if (!object) return null;
  return Buffer.from(await object.arrayBuffer());
}

export async function saveUpload(file: UploadableFile): Promise<SavedUpload> {
  assertUploadAllowed(file);

  const originalExt = path.extname(file.name || "").toLowerCase();
  const fallbackExt = extFromMime(file.type);
  const ext = originalExt || fallbackExt || "";

  // Always store as webp
  let filename = normalizeFilename((file.name || "upload") + (originalExt ? "" : ext));
  filename = filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, "");
  filename = `${filename}.webp`;

  const diskPath = resolveUploadPath(filename);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.byteLength > MAX_BYTES) throw new Error("FILE_TOO_LARGE");

  const bucket = await getUploadBucket();
  if (bucket) {
    const mime = (file.type || "").toLowerCase();
    if (!hasImageSignature(buffer, mime)) throw new Error("INVALID_IMAGE");

    const extension = extFromMime(mime) || ".img";
    const filename = normalizeFilename((file.name || "upload") + extension);
    const uploadPath = `/uploads/${filename}`;

    await bucket.put(storageKey(uploadPath), new Uint8Array(buffer), {
      httpMetadata: { contentType: mime, cacheControl: "private, max-age=120" },
    });

    return {
      uploadPath,
      mime,
      width: null,
      height: null,
      sizeBytes: buffer.byteLength,
      contentHash: crypto.createHash("sha256").update(buffer).digest("hex"),
      aHash: null,
      thumbPath: uploadPath,
    };
  }

  const normalized = await decodeAndNormalizeImage(buffer);
  if (normalized.buffer.byteLength > MAX_BYTES) throw new Error("FILE_TOO_LARGE");

  // Derived assets
  const thumbFilename = filename.replace(/\.webp$/i, ".thumb.webp");
  const thumbBuf = await makeThumb(normalized.buffer);

  ensureUploadDir();
  await fs.promises.writeFile(diskPath, normalized.buffer);
  const thumbDir = ensureThumbDir();
  await fs.promises.writeFile(path.join(thumbDir, thumbFilename), thumbBuf);

  const contentHash = crypto.createHash("sha256").update(normalized.buffer).digest("hex");
  const aHash = await computeAHashWebp(normalized.buffer);

  return {
    uploadPath: `/uploads/${filename}`,
    mime: "image/webp",
    width: normalized.width ?? null,
    height: normalized.height ?? null,
    sizeBytes: normalized.buffer.byteLength,
    contentHash,
    aHash,
    thumbPath: `/uploads/_thumbs/${thumbFilename}`,
  };
}
export async function deleteUploadIfExists(uploadPathOrUrl: string) {
  const bucket = await getUploadBucket();
  if (bucket) {
    const filename = normalizeToFilename(uploadPathOrUrl);
    const thumbFilename = filename.replace(/\.webp$/i, ".thumb.webp");
    await Promise.all([
      bucket.delete(storageKey(uploadPathOrUrl)),
      bucket.delete(`/uploads/_thumbs/${thumbFilename}`.replace(/^\//, "")),
    ]);
    return;
  }

  try {
    const disk = resolveUploadPath(uploadPathOrUrl);
    await fs.promises.unlink(disk).catch(() => {});
  } catch {}
}
