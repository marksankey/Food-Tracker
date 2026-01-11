import { Router } from 'express';
import { searchByBarcode, searchByName, saveProduct } from '../controllers/openFoodFactsController.js';
import { addDefaultUser } from '../middleware/noauth.js';

const router = Router();

router.get('/barcode/:barcode', addDefaultUser, searchByBarcode);
router.get('/search', addDefaultUser, searchByName);
router.post('/save', addDefaultUser, saveProduct);

export default router;
