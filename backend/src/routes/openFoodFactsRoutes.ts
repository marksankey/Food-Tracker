import { Router } from 'express';
import { searchByBarcode, searchByName, saveProduct } from '../controllers/openFoodFactsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/barcode/:barcode', authenticateToken, searchByBarcode);
router.get('/search', authenticateToken, searchByName);
router.post('/save', authenticateToken, saveProduct);

export default router;
