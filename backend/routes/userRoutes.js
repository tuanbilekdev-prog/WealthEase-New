import express from 'express';
import { getCurrentUser, updateTheme, updateAvatar } from '../controllers/userController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me', verifyToken, getCurrentUser);
router.patch('/theme', verifyToken, updateTheme);
router.put('/avatar', verifyToken, updateAvatar);

export default router;

