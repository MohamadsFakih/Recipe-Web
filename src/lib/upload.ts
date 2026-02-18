import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * Upload an image: to Vercel Blob if BLOB_READ_WRITE_TOKEN is set (production),
 * otherwise to local public/uploads/{prefix}/ (development).
 * Returns the URL to store in the database (absolute for Blob, relative for local).
 */
export async function uploadImage(
  file: File,
  prefix: "avatars" | "recipes",
  filename: string
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const blob = await put(`${prefix}/${filename}`, file, { access: "public" });
    return blob.url;
  }
  const dir = path.join(process.cwd(), "public", "uploads", prefix);
  await mkdir(dir, { recursive: true });
  const filepath = path.join(dir, filename);
  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));
  return `/uploads/${prefix}/${filename}`;
}
