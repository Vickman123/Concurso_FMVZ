import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/connection';

const JWT_SECRET = process.env.JWT_SECRET || 'fmvz_halloween_secret_2026_unauthorized_access_forbidden';

export interface AdminPayload {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'operator';
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

export function generateToken(admin: AdminPayload): string {
  return jwt.sign(admin, JWT_SECRET, { expiresIn: '12h' });
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Acceso no autorizado. Se requiere token de sesión administrativo.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
    const db = await getDb();
    const result = await db.query('SELECT id, name, email, role, status FROM admins WHERE id = $1', [decoded.id]);

    if (result.rowCount === 0 || result.rows[0].status !== 'active') {
      res.status(403).json({ error: 'Sesión no válida o usuario administrativo suspendido.' });
      return;
    }

    req.admin = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      email: result.rows[0].email,
      role: result.rows[0].role,
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token de sesión expirado o inválido.' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.admin || req.admin.role !== 'admin') {
    res.status(403).json({ error: 'Operación restringida exclusivamente para Administradores del Concurso.' });
    return;
  }
  next();
}
