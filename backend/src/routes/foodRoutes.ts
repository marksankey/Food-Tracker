import { Router } from 'express';
import { getFoods, searchFoods, getFood, createFood, getRecentFoods, deleteFood } from '../controllers/foodController.js';
import { addDefaultUser } from '../middleware/noauth.js';

const router = Router();

router.get('/', addDefaultUser, getFoods);
router.get('/search', addDefaultUser, searchFoods);
router.get('/recent', addDefaultUser, getRecentFoods);
router.get('/:id', addDefaultUser, getFood);
router.post('/', addDefaultUser, createFood);
router.delete('/:id', addDefaultUser, deleteFood);

export default router;
