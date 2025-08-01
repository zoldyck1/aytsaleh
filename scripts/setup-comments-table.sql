-- Setup Comments Table
-- Run this in your Supabase SQL Editor to ensure the comments table is properly configured

-- Create comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id TEXT NOT NULL, -- Changed to TEXT to handle both regular posts and publication IDs like 'pub-123'
    name TEXT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to comments" ON comments;
DROP POLICY IF EXISTS "Allow public insert access to comments" ON comments;
DROP POLICY IF EXISTS "Allow authenticated users to delete comments" ON comments;

-- Create policies
-- Allow everyone to read comments
CREATE POLICY "Allow public read access to comments" ON comments
    FOR SELECT USING (true);

-- Allow everyone to insert comments (no authentication required)
CREATE POLICY "Allow public insert access to comments" ON comments
    FOR INSERT WITH CHECK (true);

-- Allow authenticated users (admins) to delete comments
CREATE POLICY "Allow authenticated users to delete comments" ON comments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Grant necessary permissions
GRANT ALL ON comments TO anon;
GRANT ALL ON comments TO authenticated;
GRANT ALL ON comments TO service_role;

-- Show the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'comments' 
ORDER BY ordinal_position;

-- Show existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'comments';
