-- Fix Comments Table to Support Publication IDs
-- Run this in your Supabase SQL Editor

-- First, check if we have any existing comments
SELECT COUNT(*) as existing_comments_count FROM comments;

-- Drop the existing foreign key constraint if it exists
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;

-- Change post_id column from UUID to TEXT to support publication IDs like 'pub-123'
ALTER TABLE comments ALTER COLUMN post_id TYPE TEXT;

-- Update Row Level Security policies to ensure they still work
DROP POLICY IF EXISTS "الجميع يمكنهم قراءة التعليقات" ON comments;
DROP POLICY IF EXISTS "الجميع يمكنهم إضافة التعليقات" ON comments;
DROP POLICY IF EXISTS "المدراء يمكنهم حذف التعليقات" ON comments;

-- Recreate policies with English names for better compatibility
CREATE POLICY "Allow public read access to comments" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to comments" ON comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete comments" ON comments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Ensure proper permissions
GRANT ALL ON comments TO anon;
GRANT ALL ON comments TO authenticated;
GRANT ALL ON comments TO service_role;

-- Show the updated table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'comments' 
ORDER BY ordinal_position;

-- Test insert to verify it works (you can remove this after testing)
-- INSERT INTO comments (post_id, name, comment) VALUES ('pub-test-123', 'Test User', 'Test comment');
-- SELECT * FROM comments WHERE post_id = 'pub-test-123';
-- DELETE FROM comments WHERE post_id = 'pub-test-123';
