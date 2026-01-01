import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn('⚠️  WARNING: OPENAI_API_KEY not set in .env');
  console.warn('   AI Chat feature will not work without OpenAI API key');
  console.warn('   Get your key from: https://platform.openai.com/api-keys');
}

export const openai = apiKey ? new OpenAI({
  apiKey: apiKey,
}) : null;

