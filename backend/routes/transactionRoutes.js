import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  addTransaction,
  getTransactions,
  getRecentTransactions,
  getSummary,
} from '../controllers/transactionController.js';

const router = express.Router();

// Protect all routes with authentication middleware
router.use(verifyToken);

router.post('/', addTransaction);
router.get('/', getTransactions);
router.get('/recent', getRecentTransactions);
router.get('/summary', getSummary);

export default router;

