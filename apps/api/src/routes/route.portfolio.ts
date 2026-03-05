import { Router } from 'express';
import { PortfolioController } from '../controllers/controller.portfolio';

const router = Router();

router.get('/holdings', PortfolioController.getHoldings);
router.get('/positions', PortfolioController.getPositions);
router.get('/margins', PortfolioController.getMargins);
router.get('/profile', PortfolioController.getProfile);

export default router;
