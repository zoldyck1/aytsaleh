-- Create categories table
CREATE TABLE categories (
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

-- Add category_id column to posts table (if it doesn't exist)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Add author column to posts table (if it doesn't exist)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS author VARCHAR(100) DEFAULT 'المحرر';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);

-- Insert default categories
INSERT INTO categories (name, name_ar, slug, description, icon, color, is_active, display_order) VALUES
('Articles', 'مقالات', 'articles', 'مقالات تحليلية ومتخصصة', 'FileText', '#059669', true, 1),
('Reports', 'تقارير', 'reports', 'تقارير مفصلة وشاملة', 'BarChart3', '#0d9488', true, 2),
('Research', 'أبحاث', 'research', 'دراسات وأبحاث علمية', 'BookOpen', '#14b8a6', true, 3),
('News', 'أخبار', 'news', 'آخر الأخبار والمستجدات', 'Newspaper', '#22c55e', true, 4),
('Opinions', 'آراء', 'opinions', 'مقالات الرأي والتحليلات', 'MessageSquare', '#16a34a', true, 5);

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories table
-- Allow everyone to read active categories
CREATE POLICY "Allow public read access to active categories" ON categories
    FOR SELECT USING (is_active = true);

-- Allow authenticated users to read all categories (for admin)
CREATE POLICY "Allow authenticated users to read all categories" ON categories
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow only authenticated users to insert/update/delete categories (admin only)
CREATE POLICY "Allow authenticated users to manage categories" ON categories
    FOR ALL USING (auth.role() = 'authenticated');

-- Update existing posts to have a default category (optional)
-- This assigns the first category to posts that don't have a category
UPDATE posts 
SET category_id = (SELECT id FROM categories WHERE slug = 'articles' LIMIT 1)
WHERE category_id IS NULL;

-- Create a function to automatically set display_order
CREATE OR REPLACE FUNCTION set_category_display_order()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_order IS NULL OR NEW.display_order = 0 THEN
        NEW.display_order := (SELECT COALESCE(MAX(display_order), 0) + 1 FROM categories);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set display_order
CREATE TRIGGER trigger_set_category_display_order
    BEFORE INSERT ON categories
    FOR EACH ROW
    EXECUTE FUNCTION set_category_display_order();

-- Create a view for posts with category information (optional, for easier queries)
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
