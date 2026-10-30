import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Route: POST /api/v1/auth/login
 * Public login endpoint for admin portal
 */
router.post('/login', authController.login);

/**
 * Route: POST /api/v1/auth/refresh
 * Public endpoint to exchange a valid refresh token for new access & rotated refresh token
 */
router.post('/refresh', authController.refresh);

/**
 * Route: POST /api/v1/auth/logout
 * Invalidate refresh tokens and terminate session
 */
router.post('/logout', authController.logout);

/**
 * Route: GET /api/v1/auth/me
 * Protected endpoint to retrieve authenticated user profile & permissions
 */
router.get('/me', authenticate, authController.me);

export default router;
