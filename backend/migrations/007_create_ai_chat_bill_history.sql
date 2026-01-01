-- Migration: Create ai_chat_bill_history table
-- This table stores chat history between users and AI for Smart Bill creation
-- Run this SQL in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ai_chat_bill_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  bill_data JSONB, -- Stores parsed bill data if AI created a bill
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_chat_bill_user_id ON ai_chat_bill_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_bill_created_at ON ai_chat_bill_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_bill_user_created ON ai_chat_bill_history(user_id, created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE ai_chat_bill_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own chat history
CREATE POLICY "Users can read own bill chat history" ON ai_chat_bill_history
  FOR SELECT USING (true);

-- Policy: Users can insert their own chat messages
CREATE POLICY "Users can insert own bill chat" ON ai_chat_bill_history
  FOR INSERT WITH CHECK (true);

