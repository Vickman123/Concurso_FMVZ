import { Router } from 'express';
import { getContestSettings, getPrizes, getPublicResults } from '../controllers/contestController';

const router = Router();

router.get('/settings', getContestSettings);
router.get('/prizes', getPrizes);
router.get('/results', getPublicResults);

export default router;
