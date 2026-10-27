import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Use memoryStorage so the image buffer is in memory, allowing conversion
// to permanent Base64 Data URLs stored directly in the database (Supabase).
const storage = multer.memoryStorage();

export const uploadCostumePhoto = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8 Megabytes max
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de imagen no permitido. Solo se aceptan archivos JPG, PNG o WebP.'));
    }
  },
});

// Middleware to validate file magic bytes from buffer
export function validateImageMagicBytes(req: Request, res: Response, next: NextFunction): void {
  if (!req.file || !req.file.buffer) {
    return next();
  }

  const buffer = req.file.buffer;
  try {
    // JPEG: FF D8 FF
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    // WebP: RIFF ... WEBP
    const isWebP = buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';

    if (!isJpeg && !isPng && !isWebP) {
      res.status(400).json({ error: 'El archivo subido no es una imagen válida o contiene un formato alterado.' });
      return;
    }

    next();
  } catch (err) {
    res.status(500).json({ error: 'Error al verificar la integridad de la fotografía.' });
  }
}
