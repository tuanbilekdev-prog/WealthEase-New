import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { chatWithAI, getChatHistory } from '../controllers/aiChatController.js';

const router = express.Router();

// Protect all AI chat routes with authentication middleware
router.use(verifyToken);

// POST /api/ai-chat - Send message to AI and get response
router.post('/chat', chatWithAI);

// GET /api/ai-chat/history - Get chat history
router.get('/history', getChatHistory);

export default router;

