/*
  # إنشاء جداول المنصة الإخبارية

  1. الجداول الجديدة
    - `posts`
      - `id` (uuid, المفتاح الأساسي)
      - `title` (text, عنوان المنشور)
      - `description` (text, وصف المنشور)
      - `created_at` (timestamptz, تاريخ الإنشاء)
    
    - `comments`
      - `id` (uuid, المفتاح الأساسي)
      - `post_id` (uuid, مرجع للمنشور)
      - `name` (text, اسم المعلق)
      - `comment` (text, نص التعليق)
      - `created_at` (timestamptz, تاريخ الإنشاء)

  2. الأمان
    - تفعيل RLS على كلا الجدولين
    - سياسات للقراءة العامة والكتابة للتعليقات
    - سياسات المدير للمنشورات
*/

-- إنشاء جدول المنشورات
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- إنشاء جدول التعليقات
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  name text NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- تفعيل أمان الصفوف
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- سياسات المنشورات
CREATE POLICY "الجميع يمكنهم قراءة المنشورات"
  ON posts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "المدراء يمكنهم إدارة المنشورات"
  ON posts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- سياسات التعليقات
CREATE POLICY "الجميع يمكنهم قراءة التعليقات"
  ON comments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "الجميع يمكنهم إضافة التعليقات"
  ON comments
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "المدراء يمكنهم حذف التعليقات"
  ON comments
  FOR DELETE
  TO authenticated
  USING (true);

-- إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments(created_at DESC);