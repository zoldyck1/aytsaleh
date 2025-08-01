-- Update publications table to add image fields
-- This script adds the missing image columns to match our TypeScript interface

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

-- Update existing columns to match our interface
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

-- Rename image_url to main_image_url if image_url exists and main_image_url doesn't
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
    END IF;
END $$;

-- Drop the old image_url column if both exist (avoid duplication)
DO $$
BEGIN
    IF EXISTS (
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

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_publications_is_featured ON publications(is_featured);
CREATE INDEX IF NOT EXISTS idx_publications_is_published_on_main ON publications(is_published_on_main);
CREATE INDEX IF NOT EXISTS idx_publications_main_image_url ON publications(main_image_url) WHERE main_image_url IS NOT NULL;

-- Update the existing indexes if column names changed
DO $$
BEGIN
    -- Drop old featured index if it exists and is_featured index doesn't
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_publications_featured'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_publications_is_featured'
    ) THEN
        DROP INDEX IF EXISTS idx_publications_featured;
    END IF;
END $$;

-- Show the final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'publications' 
ORDER BY ordinal_position;
