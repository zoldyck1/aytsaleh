-- Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read their own admin record" ON public.admins;
DROP POLICY IF EXISTS "Allow admins to read all admin records" ON public.admins;
DROP POLICY IF EXISTS "Allow super_admins to manage admin records" ON public.admins;

-- Create policy to allow authenticated users to read their own admin record
CREATE POLICY "Allow authenticated users to read their own admin record" ON public.admins
    FOR SELECT USING (auth.email() = email);

-- Create policy to allow admins to read all admin records
CREATE POLICY "Allow admins to read all admin records" ON public.admins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.email() AND is_active = true
        )
    );

-- Create policy to allow super_admins to manage admin records
CREATE POLICY "Allow super_admins to manage admin records" ON public.admins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE email = auth.email() AND role = 'super_admin' AND is_active = true
        )
    );

-- Insert initial admin user
INSERT INTO public.admins (email, name, role, is_active) 
VALUES ('mohammed@jam3ia.com', 'Mohammed Admin', 'super_admin', true)
ON CONFLICT (email) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON public.admins TO authenticated;
GRANT ALL ON public.admins TO service_role;

-- Show the created table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'admins' AND table_schema = 'public'
ORDER BY ordinal_position;
