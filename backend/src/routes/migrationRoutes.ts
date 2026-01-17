import express from 'express';
import { fixSynValues, checkSynValues } from '../controllers/migrationController.js';

const router = express.Router();

// Check current syn values (diagnostic)
router.get('/check-syn-values', checkSynValues);

// Migration endpoint to fix syn values
router.post('/fix-syn-values', fixSynValues);

export default router;
