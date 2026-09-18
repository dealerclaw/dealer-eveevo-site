// Local-disk storage helpers (replaces the Manus storage proxy).
// Files are written under STORAGE_DIR (mount a Railway volume there) and
// served by Express at /uploads/<key>.

import fs from "fs";
import path from "path";

export const STORAGE_DIR =
  process.env.STORAGE_DIR || path.resolve(process.cwd(), "uploads");

function normalizeKey(relKey: string): string {
  const key = relKey.replace(/^\/+/, "");
  // Prevent path traversal outside the storage directory
  const resolved = path.resolve(STORAGE_DIR, key);
  if (!resolved.startsWith(path.resolve(STORAGE_DIR))) {
    throw new Error(`Invalid storage key: ${relKey}`);
  }
  return key;
}

function publicUrl(key: string): string {
  const base = (process.env.VITE_APP_URL || "").replace(/\/+$/, "");
  return `${base}/uploads/${key}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const filePath = path.resolve(STORAGE_DIR, key);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  const buffer =
    typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);
  await fs.promises.writeFile(filePath, buffer);
  return { key, url: publicUrl(key) };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: publicUrl(key) };
}
