-- Create publications table
CREATE TABLE IF NOT EXISTS publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    featured BOOLEAN DEFAULT false,
    image_url TEXT,
    additional_pages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on category for better query performance
CREATE INDEX IF NOT EXISTS idx_publications_category ON publications(category);

-- Create an index on featured for better query performance
CREATE INDEX IF NOT EXISTS idx_publications_featured ON publications(featured);

-- Create an index on created_at for better query performance
CREATE INDEX IF NOT EXISTS idx_publications_created_at ON publications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;

-- Create policies for publications table (only if they don't exist)
-- Allow all operations for authenticated users (you can modify this as needed)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'publications' 
        AND policyname = 'Allow all operations for authenticated users'
    ) THEN
        CREATE POLICY "Allow all operations for authenticated users" ON publications
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Allow read access for anonymous users (public access)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'publications' 
        AND policyname = 'Allow read access for everyone'
    ) THEN
        CREATE POLICY "Allow read access for everyone" ON publications
            FOR SELECT USING (true);
    END IF;
END $$;
