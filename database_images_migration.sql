-- Migration to add images support to posts
-- Run this in Supabase SQL Editor

-- 1. Create images table
CREATE TABLE IF NOT EXISTS public.images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    caption TEXT,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add RLS policies for images table
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Images are viewable by everyone" ON public.images
    FOR SELECT USING (true);

-- Allow authenticated users to insert images (for admins)
CREATE POLICY "Admins can insert images" ON public.images
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update images (for admins)  
CREATE POLICY "Admins can update images" ON public.images
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete images (for admins)
CREATE POLICY "Admins can delete images" ON public.images
    FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Create storage bucket for post images
-- Note: This needs to be done in Supabase Dashboard Storage section or via API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true);

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS images_post_id_idx ON public.images(post_id);
CREATE INDEX IF NOT EXISTS images_display_order_idx ON public.images(post_id, display_order);

-- 5. Add function to get posts with images
CREATE OR REPLACE FUNCTION get_posts_with_images()
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    images JSON
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.created_at,
        COALESCE(
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id', i.id,
                    'url', i.url,
                    'alt_text', i.alt_text,
                    'caption', i.caption,
                    'display_order', i.display_order
                )
                ORDER BY i.display_order, i.created_at
            ) FILTER (WHERE i.id IS NOT NULL),
            '[]'::json
        ) as images
    FROM public.posts p
    LEFT JOIN public.images i ON p.id = i.post_id
    GROUP BY p.id, p.title, p.description, p.created_at
    ORDER BY p.created_at DESC;
END;
$$;

COMMENT ON TABLE public.images IS 'Images associated with posts';
COMMENT ON FUNCTION get_posts_with_images() IS 'Returns posts with their associated images as JSON';
