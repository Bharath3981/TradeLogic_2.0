import { Router } from 'express';
import { WatchlistController } from '../controllers/controller.watchlist';

const router = Router();

router.post('/', WatchlistController.addItem);
router.delete('/:id', WatchlistController.deleteItem);
router.get('/', WatchlistController.getWatchlist); // Bonus

export default router;
