import { Router } from 'express';
import { getFoods, searchFoods, getFood, createFood } from '../controllers/foodController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getFoods);
router.get('/search', authenticateToken, searchFoods);
router.get('/:id', authenticateToken, getFood);
router.post('/', authenticateToken, createFood);

export default router;
