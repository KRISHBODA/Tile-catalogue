import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';

const router: Router = Router();

// RESTful Product Endpoints
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

export default router;
