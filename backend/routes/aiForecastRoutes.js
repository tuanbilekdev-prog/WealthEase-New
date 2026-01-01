import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { generateForecast } from '../controllers/aiForecastController.js';

const router = express.Router();

// Protect all AI forecast routes with authentication middleware
router.use(verifyToken);

// POST /api/ai-forecast - Generate financial forecast
router.post('/', generateForecast);

export default router;

