import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/authController.js';
import { addDefaultUser } from '../middleware/noauth.js';

const router = Router();

router.get('/profile', addDefaultUser, getProfile);
router.put('/profile', addDefaultUser, updateProfile);

export default router;
