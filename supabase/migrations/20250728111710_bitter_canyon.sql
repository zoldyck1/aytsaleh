/*
  # Create Admin Table and Enhanced Security

  1. New Tables
    - `admins`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `role` (text, default 'admin')
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `last_login` (timestamp)

  2. Security
    - Enable RLS on `admins` table
    - Add policies for admin management
    - Update existing policies to use admin table

  3. Enhanced Post and Comment Policies
    - Link admin authentication to admin table
    - Improve security with proper role checking
*/

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create policies for admins table
CREATE POLICY "Admins can read their own data"
  ON admins
  FOR SELECT
  TO authenticated
  USING (auth.email() = email);

CREATE POLICY "Super admins can manage all admins"
  ON admins
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = auth.email() 
      AND role = 'super_admin' 
      AND is_active = true
    )
  );

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE email = auth.email() 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update last login
CREATE OR REPLACE FUNCTION update_admin_last_login()
RETURNS trigger AS $$
BEGIN
  UPDATE admins 
  SET last_login = now() 
  WHERE email = auth.email();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update posts policies to use admin table
DROP POLICY IF EXISTS "المدراء يمكنهم إدارة المنشورات" ON posts;
CREATE POLICY "المدراء يمكنهم إدارة المنشورات"
  ON posts
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Update comments policies to use admin table
DROP POLICY IF EXISTS "المدراء يمكنهم حذف التعليقات" ON comments;
CREATE POLICY "المدراء يمكنهم حذف التعليقات"
  ON comments
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Insert default admin (you should change this email and create the user in Supabase Auth)
INSERT INTO admins (email, name, role) 
VALUES ('admin@example.com', 'مدير النظام', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS admins_email_idx ON admins(email);
CREATE INDEX IF NOT EXISTS admins_active_idx ON admins(is_active) WHERE is_active = true;