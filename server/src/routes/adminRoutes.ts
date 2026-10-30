import { Router } from 'express';
import multer from 'multer';
import {
  adminLogin,
  getAdminMe,
  getDashboardStats,
  getAdminParticipants,
  updateParticipantStatus,
  getPendingPhotos,
  importParticipantsCsv,
  exportParticipantsCsv,
  getAdminVotes,
  exportVotesCsv,
  getAdminResults,
  updateContestSettings,
  getAdminPrizes,
  updatePrizeCategory,
  getAuditLogs,
  generateQrCode,
  updateParticipantPhoto,
  exportSystemBackup,
} from '../controllers/adminController';
import { uploadCostumePhoto, validateImageMagicBytes } from '../middleware/upload';
import { authenticate, requireAdmin } from '../middleware/auth';
import { loginRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Public Admin Login
router.post('/login', loginRateLimiter, adminLogin);

// Protected routes (Operators & Admins)
router.use(authenticate);
router.get('/me', getAdminMe);
router.get('/stats', getDashboardStats);
router.get('/participants', getAdminParticipants);
router.patch('/participants/:id/status', updateParticipantStatus);
router.patch('/participants/:id/photo', uploadCostumePhoto.single('photo'), validateImageMagicBytes, updateParticipantPhoto);
router.get('/photos/pending', getPendingPhotos);
router.get('/votes', getAdminVotes);
router.get('/votes/export-csv', exportVotesCsv);
router.get('/results', getAdminResults);
router.get('/prizes', getAdminPrizes);
router.get('/qr', generateQrCode);

// Administrative restricted routes (Requires 'admin' role)
router.post('/participants/import-csv', requireAdmin, csvUpload.single('file'), importParticipantsCsv);
router.get('/participants/export-csv', requireAdmin, exportParticipantsCsv);
router.patch('/settings', requireAdmin, updateContestSettings);
router.patch('/prizes/:id', requireAdmin, updatePrizeCategory);
router.get('/audit-logs', requireAdmin, getAuditLogs);
router.get('/backup/export', requireAdmin, exportSystemBackup);

export default router;
