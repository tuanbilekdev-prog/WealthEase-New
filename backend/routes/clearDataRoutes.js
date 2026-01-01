import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { clearFinancialData } from '../controllers/clearDataController.js';

const router = express.Router();

router.use(verifyToken);
router.post('/', clearFinancialData);

export default router;


