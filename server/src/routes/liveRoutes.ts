import { Router } from 'express';
import {
  streamLiveEvents,
  getLiveState,
  adminControlLive,
  castLiveVote,
  sendLiveReaction,
} from '../controllers/liveController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public Real-time SSE Stream for Projectors & Mobile Apps
router.get('/stream', streamLiveEvents);

// Public state snapshot
router.get('/state', getLiveState);

// Public Voting for the participant on stage
router.post('/vote', castLiveVote);

// Public Reaction Emojis (applause, pumpkin, etc.)
router.post('/reaction', sendLiveReaction);

// Protected Admin Stage Control (Next, Prev, Open Voting, Close Voting, Podium)
router.post('/control', authenticate, adminControlLive);

export default router;
