
import { Router } from 'express';
import { InstrumentController } from '../controllers/controller.instrument';
import { injectKiteToken } from '../middleware/middleware.auth';

const router = Router();

router.post('/sync', injectKiteToken, InstrumentController.syncInstruments);
router.get('/', injectKiteToken, InstrumentController.getInstruments);

export default router;
