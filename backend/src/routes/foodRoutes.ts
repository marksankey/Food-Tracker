import { Router } from 'express';
import { getFoods, searchFoods, getFood, createFood } from '../controllers/foodController.js';
import { addDefaultUser } from '../middleware/noauth.js';

const router = Router();

router.get('/', addDefaultUser, getFoods);
router.get('/search', addDefaultUser, searchFoods);
router.get('/:id', addDefaultUser, getFood);
router.post('/', addDefaultUser, createFood);

export default router;
