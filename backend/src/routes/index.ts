import { Router } from 'express';
import healthRoutes from './health.routes.js';
import productRoutes from './product.routes.js';

const router: Router = Router();

// Mount individual domain routes
router.use('/health', healthRoutes);
router.use('/products', productRoutes);

export default router;
