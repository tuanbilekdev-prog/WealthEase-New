import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { chatWithAI, getChatHistory } from '../controllers/aiChatBillController.js';

const router = express.Router();

// Protect all AI chat bill routes with authentication middleware
router.use(verifyToken);

// POST /api/ai-chat-bill - Send message to AI and get response
router.post('/chat', chatWithAI);

// GET /api/ai-chat-bill/history - Get chat history
router.get('/history', getChatHistory);

export default router;

