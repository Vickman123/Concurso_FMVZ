import { Router } from 'express';
import { checkVoterEligibility, castVote } from '../controllers/voteController';
import { voteRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/identify', voteRateLimiter, checkVoterEligibility);
router.post('/cast', voteRateLimiter, castVote);

export default router;
