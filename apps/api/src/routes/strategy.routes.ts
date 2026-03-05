
import { Router } from 'express';
import { startStrategyRun, getStrategies, getStrategyById, stopStrategyRun, clearHistory, deleteStrategy, getPositions } from '../controllers/strategy.controller';

const router = Router();

router.get('/', getStrategies);
router.get('/positions', getPositions); // Global Positions Endpoint (Optional ?strategyId)
router.get('/:id', getStrategyById);
router.post('/:id/run', startStrategyRun);
router.post('/:id/stop', stopStrategyRun);
router.delete('/:id/history', clearHistory);
router.delete('/:id', deleteStrategy); // Delete Strategy + Relations

export default router;
