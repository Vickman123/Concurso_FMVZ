import { Router } from 'express';
import {
  getPublicParticipants,
  getPublicParticipantDetail,
  registerParticipant,
  checkParticipantStatus,
} from '../controllers/participantController';
import { uploadCostumePhoto, validateImageMagicBytes } from '../middleware/upload';
import { registrationRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', getPublicParticipants);
router.get('/:number', getPublicParticipantDetail);
router.post(
  '/register',
  registrationRateLimiter,
  uploadCostumePhoto.single('photo'),
  validateImageMagicBytes,
  registerParticipant
);
router.post('/check-status', checkParticipantStatus);

export default router;
