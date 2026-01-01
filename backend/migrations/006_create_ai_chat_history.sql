-- Migration: Create ai_chat_history table
-- This table stores chat history between users and AI
-- Run this SQL in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  transaction_data JSONB, -- Stores parsed transaction data if AI created a transaction
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_chat_user_id ON ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_created_at ON ai_chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_user_created ON ai_chat_history(user_id, created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own chat history
CREATE POLICY "Users can read own chat history" ON ai_chat_history
  FOR SELECT USING (true); -- Adjust with auth check if needed

-- Policy: Users can insert their own chat messages
CREATE POLICY "Users can insert own chat" ON ai_chat_history
  FOR INSERT WITH CHECK (true); -- Adjust with auth check if needed

