-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security (RLS) for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to posts" ON public.posts;
DROP POLICY IF EXISTS "Allow admins to manage posts" ON public.posts;
DROP POLICY IF EXISTS "Allow public read access to comments" ON public.comments;
DROP POLICY IF EXISTS "Allow public to create comments" ON public.comments;
DROP POLICY IF EXISTS "Allow admins to manage comments" ON public.comments;

-- Create policies for posts
-- Allow anyone to read posts
CREATE POLICY "Allow public read access to posts" ON public.posts
    FOR SELECT USING (true);

-- Allow admins to manage posts
CREATE POLICY "Allow admins to manage posts" ON public.posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.email() AND is_active = true
        )
    );

-- Create policies for comments
-- Allow anyone to read comments
CREATE POLICY "Allow public read access to comments" ON public.comments
    FOR SELECT USING (true);

-- Allow anyone to create comments
CREATE POLICY "Allow public to create comments" ON public.comments
    FOR INSERT WITH CHECK (true);

-- Allow admins to manage comments
CREATE POLICY "Allow admins to manage comments" ON public.comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.email() AND is_active = true
        )
    );

-- Grant necessary permissions
GRANT ALL ON public.posts TO authenticated;
GRANT ALL ON public.posts TO anon;
GRANT ALL ON public.comments TO authenticated;
GRANT ALL ON public.comments TO anon;

-- Insert some sample posts for testing
INSERT INTO public.posts (title, description) VALUES 
('مرحباً بكم في موقع الجمعية', 'نرحب بجميع الزوار في موقع الجمعية الجديد. ستجدون هنا آخر الأخبار والفعاليات والأنشطة.'),
('فعالية خيرية جديدة', 'تم تنظيم فعالية خيرية جديدة لمساعدة الأسر المحتاجة. نرجو من الجميع المشاركة والتفاعل.'),
('ورشة عمل تطوعية', 'سيتم عقد ورشة عمل تطوعية الأسبوع القادم لتدريب المتطوعين الجدد على آليات العمل الخيري.')
ON CONFLICT DO NOTHING;

-- Show the created tables structure
SELECT 'Posts Table Structure:' AS info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Comments Table Structure:' AS info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'comments' AND table_schema = 'public'
ORDER BY ordinal_position;
