import { Router } from 'express';
import {
  getDiaryEntries,
  getDailySummary,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry
} from '../controllers/diaryController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getDiaryEntries);
router.get('/summary', authenticateToken, getDailySummary);
router.post('/', authenticateToken, createDiaryEntry);
router.put('/:id', authenticateToken, updateDiaryEntry);
router.delete('/:id', authenticateToken, deleteDiaryEntry);

export default router;
