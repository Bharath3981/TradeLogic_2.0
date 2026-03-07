import { Router } from 'express';
import { ScreenerController } from '../controllers/controller.screener';
import { injectKiteToken } from '../middleware/middleware.auth';

const router = Router();
router.get('/sectors',          ScreenerController.getSectors);
router.get('/futures/:symbol',  ScreenerController.getUpcomingFutures);
router.post('/scan',            injectKiteToken, ScreenerController.runScan);

export default router;
