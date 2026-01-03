import { Router } from 'express';
import {
  getWeightLogs,
  createWeightLog,
  updateWeightLog,
  deleteWeightLog
} from '../controllers/weightController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getWeightLogs);
router.post('/', authenticateToken, createWeightLog);
router.put('/:id', authenticateToken, updateWeightLog);
router.delete('/:id', authenticateToken, deleteWeightLog);

export default router;
