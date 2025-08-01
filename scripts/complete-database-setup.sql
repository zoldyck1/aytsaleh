-- Complete Database Setup Script
-- Run this in your Supabase SQL Editor

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7), -- For hex color codes like #059669
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Update posts table structure
-- Add category_id column to posts table (if it doesn't exist)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Add author column to posts table (if it doesn't exist)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS author VARCHAR(100) DEFAULT 'المحرر';

-- 3. Update publications table to match TypeScript interfaces
-- Add main_image_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'publications' 
        AND column_name = 'main_image_url'
    ) THEN
        ALTER TABLE publications ADD COLUMN main_image_url TEXT;
    END IF;
END $$;

-- Add additional_images column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'publications' 
        AND column_name = 'additional_images'
    ) THEN
        ALTER TABLE publications ADD COLUMN additional_images TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Rename 'featured' to 'is_featured' if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'publications' 
        AND column_name = 'featured'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'publications' 
        AND column_name = 'is_featured'
    ) THEN
        ALTER TABLE publications RENAME COLUMN featured TO is_featured;
    END IF;
END $$;

-- Add is_published_on_main column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'publications' 
        AND column_name = 'is_published_on_main'
    ) THEN
        ALTER TABLE publications ADD COLUMN is_published_on_main BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Handle image_url to main_image_url migration
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'publications' 
        AND column_name = 'image_url'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'publications' 
        AND column_name = 'main_image_url'
    ) THEN
        ALTER TABLE publications RENAME COLUMN image_url TO main_image_url;
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'publications' 
        AND column_name = 'image_url'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'publications' 
        AND column_name = 'main_image_url'
    ) THEN
        -- Copy data from image_url to main_image_url if main_image_url is null
        UPDATE publications 
        SET main_image_url = image_url 
        WHERE main_image_url IS NULL AND image_url IS NOT NULL;
        
        -- Drop the old column
        ALTER TABLE publications DROP COLUMN image_url;
    END IF;
END $$;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_publications_is_featured ON publications(is_featured);
CREATE INDEX IF NOT EXISTS idx_publications_is_published_on_main ON publications(is_published_on_main);
CREATE INDEX IF NOT EXISTS idx_publications_main_image_url ON publications(main_image_url) WHERE main_image_url IS NOT NULL;

-- 5. Insert default categories
INSERT INTO categories (name, name_ar, slug, description, icon, color, is_active, display_order) VALUES
('Articles', 'مقالات', 'articles', 'مقالات تحليلية ومتخصصة', 'FileText', '#059669', true, 1),
('Reports', 'تقارير', 'reports', 'تقارير مفصلة وشاملة', 'BarChart3', '#0d9488', true, 2),
('Research', 'أبحاث', 'research', 'دراسات وأبحاث علمية', 'BookOpen', '#14b8a6', true, 3),
('News', 'أخبار', 'news', 'آخر الأخبار والمستجدات', 'Newspaper', '#22c55e', true, 4),
('Opinions', 'آراء', 'opinions', 'مقالات الرأي والتحليلات', 'MessageSquare', '#16a34a', true, 5)
ON CONFLICT (slug) DO NOTHING;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for categories table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to active categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated users to read all categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated users to manage categories" ON categories;

-- Allow everyone to read active categories
CREATE POLICY "Allow public read access to active categories" ON categories
    FOR SELECT USING (is_active = true);

-- Allow authenticated users to read all categories (for admin)
CREATE POLICY "Allow authenticated users to read all categories" ON categories
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow only authenticated users to insert/update/delete categories (admin only)
CREATE POLICY "Allow authenticated users to manage categories" ON categories
    FOR ALL USING (auth.role() = 'authenticated');

-- 8. Update existing posts to have a default category (optional)
-- This assigns the first category to posts that don't have a category
UPDATE posts 
SET category_id = (SELECT id FROM categories WHERE slug = 'articles' LIMIT 1)
WHERE category_id IS NULL;

-- 9. Create a function to automatically set display_order
CREATE OR REPLACE FUNCTION set_category_display_order()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_order IS NULL OR NEW.display_order = 0 THEN
        NEW.display_order := (SELECT COALESCE(MAX(display_order), 0) + 1 FROM categories);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to automatically set display_order
DROP TRIGGER IF EXISTS trigger_set_category_display_order ON categories;
CREATE TRIGGER trigger_set_category_display_order
    BEFORE INSERT ON categories
    FOR EACH ROW
    EXECUTE FUNCTION set_category_display_order();

-- 11. Create a view for posts with category information (optional, for easier queries)
CREATE OR REPLACE VIEW posts_with_categories AS
SELECT 
    p.*,
    c.name as category_name,
    c.name_ar as category_name_ar,
    c.slug as category_slug,
    c.color as category_color,
    c.icon as category_icon
FROM posts p
LEFT JOIN categories c ON p.category_id = c.id;

-- 12. Show final table structures
SELECT 'Categories table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'categories' 
ORDER BY ordinal_position;

SELECT 'Publications table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'publications' 
ORDER BY ordinal_position;

SELECT 'Posts table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;
