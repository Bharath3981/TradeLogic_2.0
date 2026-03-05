import { Router } from 'express';
import { MarketController } from '../controllers/controller.market';

const router = Router();

router.get('/instruments', MarketController.getInstruments);
router.get('/quote', MarketController.getQuote);
router.get('/ltp', MarketController.getLTP);

export default router;
