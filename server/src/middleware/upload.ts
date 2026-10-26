import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const randomName = `costume_upload_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, randomName);
  },
});

export const uploadCostumePhoto = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 Megabytes max
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

// Middleware to validate file magic bytes after upload
export function validateImageMagicBytes(req: Request, res: Response, next: NextFunction): void {
  if (!req.file) {
    return next();
  }

  const filePath = req.file.path;
  try {
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    // JPEG: FF D8 FF
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    // WebP: RIFF ... WEBP
    const isWebP = buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';

    if (!isJpeg && !isPng && !isWebP) {
      // Delete corrupted or disguised file
      fs.unlinkSync(filePath);
      res.status(400).json({ error: 'El archivo subido no es una imagen válida o contiene un formato alterado.' });
      return;
    }

    next();
  } catch (err) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({ error: 'Error al verificar la integridad de la fotografía.' });
  }
}
