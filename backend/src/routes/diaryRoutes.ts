import { Router } from 'express';
import {
  getDiaryEntries,
  getDailySummary,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry
} from '../controllers/diaryController.js';
import { addDefaultUser } from '../middleware/noauth.js';

const router = Router();

router.get('/', addDefaultUser, getDiaryEntries);
router.get('/summary', addDefaultUser, getDailySummary);
router.post('/', addDefaultUser, createDiaryEntry);
router.put('/:id', addDefaultUser, updateDiaryEntry);
router.delete('/:id', addDefaultUser, deleteDiaryEntry);

export default router;
