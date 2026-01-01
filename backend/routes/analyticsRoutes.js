import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  getAnalyticsSummary,
  getAnalyticsTransactions,
} from '../controllers/analyticsController.js';

const router = express.Router();

router.use(verifyToken);
router.get('/summary', getAnalyticsSummary);
router.get('/transactions', getAnalyticsTransactions);

export default router;


