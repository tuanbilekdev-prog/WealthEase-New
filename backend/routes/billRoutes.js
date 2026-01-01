import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  createBill,
  getActiveBills,
  getCompletedBills,
  markBillAsCompleted,
} from '../controllers/billController.js';

const router = express.Router();

// Protect all routes with authentication middleware
router.use(verifyToken);

router.post('/', createBill);
router.get('/active', getActiveBills);
router.get('/completed', getCompletedBills);
router.patch('/:id/complete', markBillAsCompleted);

export default router;

