import express from 'express';
import { uploadAvatar, avatarUploadMiddleware } from '../controllers/profileController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/upload-avatar', verifyToken, avatarUploadMiddleware, uploadAvatar);

export default router;
