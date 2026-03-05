import { Router } from 'express';
import { ScreenerController } from '../controllers/controller.screener';

const router = Router();
router.get('/sectors', ScreenerController.getSectors);
router.post('/scan', ScreenerController.runScan);

export default router;
