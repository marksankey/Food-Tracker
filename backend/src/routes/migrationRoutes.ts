import express from 'express';
import { fixSynValues } from '../controllers/migrationController.js';

const router = express.Router();

// Migration endpoint to fix syn values
router.post('/fix-syn-values', fixSynValues);

export default router;
