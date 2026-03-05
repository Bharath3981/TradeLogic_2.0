import { Router } from 'express';
import { AuthController } from '../controllers/controller.auth';

const router = Router();

// These routes require Authentication (JWT)
router.get('/login', AuthController.getLoginUrl);

// Note: If accessed via Browser Redirect, this will fail 401 unless token is in cookie/query (unsupported by default middleware).
// Ideally, Frontend handles redirect and POSTs to this endpoint with Bearer token.
// For now, supporting both GET/POST as per controller logic, but requires Auth.
router.get('/login/callback', AuthController.handleCallback);
router.post('/login/callback', AuthController.handleCallback);

export default router;
