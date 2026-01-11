import { Router } from 'express';
import {
  getWeightLogs,
  createWeightLog,
  updateWeightLog,
  deleteWeightLog
} from '../controllers/weightController.js';
import { addDefaultUser } from '../middleware/noauth.js';

const router = Router();

router.get('/', addDefaultUser, getWeightLogs);
router.post('/', addDefaultUser, createWeightLog);
router.put('/:id', addDefaultUser, updateWeightLog);
router.delete('/:id', addDefaultUser, deleteWeightLog);

export default router;
