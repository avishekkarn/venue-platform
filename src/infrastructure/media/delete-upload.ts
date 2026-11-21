import { promises as fs } from "fs";
import path from "path";

/**
 * Safely deletes an uploaded file from public/uploads/catalog/.
 * Fails silently if the file does not exist.
 * @param photoUrl The string from MenuItem.photoUrl, e.g. "/uploads/catalog/uuid.webp"
 */
export async function deleteUploadedPhoto(photoUrl: string | null | undefined): Promise<void> {
  if (!photoUrl || !photoUrl.startsWith("/uploads/catalog/")) return;
  const filename = photoUrl.replace("/uploads/catalog/", "");
  if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) return;
  const filePath = path.join(process.cwd(), "public", "uploads", "catalog", filename);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    // Ignore ENOENT (file already gone), log others
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error(`[media] Failed to delete ${filename}:`, err);
    }
  }
}
