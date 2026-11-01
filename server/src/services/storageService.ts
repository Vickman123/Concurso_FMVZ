import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Service for managing persistent photo storage for costumes.
 * Supports both local disk persistent volume storage (recommended for VPS/Docker)
 * and Base64 Data URL fallback for environments with ephemeral disks (Render free).
 */

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export function getUploadDir(): string {
  const customDir = process.env.UPLOAD_DIR;
  const targetDir = customDir
    ? path.resolve(customDir)
    : path.resolve(__dirname, '../../uploads');

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  return targetDir;
}

export function getStorageMode(): 'disk' | 'base64' {
  const mode = process.env.STORAGE_MODE?.toLowerCase();
  if (mode === 'base64') {
    return 'base64';
  }
  // Default to disk storage for VPS and Docker environments
  return 'disk';
}

export interface SavedPhotoResult {
  photoUrl: string;
  filename?: string;
  storageMode: 'disk' | 'base64';
  fileSize: number;
}

/**
 * Saves an uploaded multer memory file according to the active storage strategy.
 */
export async function savePhoto(file: Express.Multer.File): Promise<SavedPhotoResult> {
  const mode = getStorageMode();

  if (mode === 'base64') {
    const mime = file.mimetype || 'image/jpeg';
    const base64Url = `data:${mime};base64,${file.buffer.toString('base64')}`;
    return {
      photoUrl: base64Url,
      storageMode: 'base64',
      fileSize: file.buffer.length,
    };
  }

  // Disk persistent storage mode
  const uploadDir = getUploadDir();
  const ext = ALLOWED_MIME_TYPES[file.mimetype] || '.jpg';
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  const safeFilename = `costume_${Date.now()}_${randomSuffix}${ext}`;
  const targetPath = path.join(uploadDir, safeFilename);

  await fs.promises.writeFile(targetPath, file.buffer);

  return {
    photoUrl: `/uploads/${safeFilename}`,
    filename: safeFilename,
    storageMode: 'disk',
    fileSize: file.buffer.length,
  };
}

/**
 * Utility to extract a Base64 data URL from the database and write it to disk.
 * Used during data migration from Supabase to VPS persistent storage.
 */
export async function extractBase64ToDisk(
  dataUrl: string,
  prefix: string = 'migrated'
): Promise<{ photoUrl: string; filename: string } | null> {
  const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  const mime = match[1];
  const base64Data = match[2];
  const ext = ALLOWED_MIME_TYPES[mime] || '.jpg';
  const buffer = Buffer.from(base64Data, 'base64');

  const uploadDir = getUploadDir();
  const randomSuffix = crypto.randomBytes(6).toString('hex');
  const safeFilename = `costume_${prefix}_${Date.now()}_${randomSuffix}${ext}`;
  const targetPath = path.join(uploadDir, safeFilename);

  await fs.promises.writeFile(targetPath, buffer);

  return {
    photoUrl: `/uploads/${safeFilename}`,
    filename: safeFilename,
  };
}
