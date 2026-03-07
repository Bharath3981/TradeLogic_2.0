import { Router } from 'express';
import { ScreenerController } from '../controllers/controller.screener';
import { authenticate } from '../middleware/middleware.auth';

const router = Router();
router.get('/versions',         ScreenerController.getVersions);
router.get('/indices',          ScreenerController.getIndices);
router.get('/sectors',          ScreenerController.getSectors);
router.get('/futures/:symbol',  ScreenerController.getUpcomingFutures);
router.post('/scan',            authenticate, ScreenerController.runScan);

export default router;
