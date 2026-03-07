
import { Router } from 'express';
import { InstrumentController } from '../controllers/controller.instrument';
import { authenticate } from '../middleware/middleware.auth';

const router = Router();

// Protect this route if needed, or leave public if triggered by cron without auth (add auth if manual)
router.post('/sync', authenticate, InstrumentController.syncInstruments);
router.get('/', authenticate, InstrumentController.getInstruments);

export default router;
