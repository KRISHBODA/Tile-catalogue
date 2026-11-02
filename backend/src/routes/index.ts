import { Router } from 'express';
import catalogueRoutes from './catalogue.routes.js';
import healthRoutes from './health.routes.js';
import productRoutes from './product.routes.js';
import authRoutes from './auth.routes.js';

const router: Router = Router();

// Mount individual domain routes
router.use('/catalogue', catalogueRoutes);
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);

export default router;
