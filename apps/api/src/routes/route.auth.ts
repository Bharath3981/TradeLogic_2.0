import { Router } from 'express';
import { AuthController } from '../controllers/controller.auth';

const router = Router();

// Kite routes moved to route.kite.ts

// App Auth
router.post('/register', AuthController.register);
router.post('/login', AuthController.appLogin);
router.post('/logout', AuthController.logout);

export default router;
