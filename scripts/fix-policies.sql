-- Fix infinite recursion in RLS policies
-- First, drop all existing policies to start fresh

-- Drop posts policies
DROP POLICY IF EXISTS "Allow public read access to posts" ON public.posts;
DROP POLICY IF EXISTS "Allow admins to manage posts" ON public.posts;

-- Drop comments policies  
DROP POLICY IF EXISTS "Allow public read access to comments" ON public.comments;
DROP POLICY IF EXISTS "Allow public to create comments" ON public.comments;
DROP POLICY IF EXISTS "Allow admins to manage comments" ON public.comments;

-- Drop admin policies
DROP POLICY IF EXISTS "Allow authenticated users to read their own admin record" ON public.admins;
DROP POLICY IF EXISTS "Allow admins to read all admin records" ON public.admins;
DROP POLICY IF EXISTS "Allow super_admins to manage admin records" ON public.admins;

-- Disable RLS temporarily to recreate policies
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create simplified policies without circular references

-- Posts policies - Allow public read, authenticated users can manage
CREATE POLICY "posts_select_policy" ON public.posts
    FOR SELECT USING (true);

CREATE POLICY "posts_insert_policy" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "posts_update_policy" ON public.posts
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "posts_delete_policy" ON public.posts
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Comments policies - Allow public read and insert, authenticated users can delete
CREATE POLICY "comments_select_policy" ON public.comments
    FOR SELECT USING (true);

CREATE POLICY "comments_insert_policy" ON public.comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "comments_update_policy" ON public.comments
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "comments_delete_policy" ON public.comments
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Admins policies - Only authenticated users can read their own records
CREATE POLICY "admins_select_policy" ON public.admins
    FOR SELECT USING (auth.email() = email);

CREATE POLICY "admins_insert_policy" ON public.admins
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "admins_update_policy" ON public.admins
    FOR UPDATE USING (auth.email() = email);

CREATE POLICY "admins_delete_policy" ON public.admins
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT ALL ON public.posts TO authenticated;
GRANT ALL ON public.posts TO anon;
GRANT ALL ON public.comments TO authenticated;
GRANT ALL ON public.comments TO anon;
GRANT ALL ON public.admins TO authenticated;

-- Show success message
SELECT 'Policies fixed successfully!' as status;
