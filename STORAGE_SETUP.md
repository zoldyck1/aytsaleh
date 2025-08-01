# إعداد مجلد التخزين في Supabase

بسبب قيود الأمان في Supabase، يجب إنشاء مجلد التخزين يدوياً من لوحة التحكم.

## الخطوات المطلوبة:

### 1. إنشاء Storage Bucket

1. اذهب إلى لوحة تحكم Supabase الخاصة بمشروعك
2. انقر على **Storage** في القائمة الجانبية
3. انقر على **New bucket** 
4. أدخل اسم المجلد: `post-images`
5. اجعل المجلد **Public** (عام)
6. انقر على **Create bucket**

### 2. إعداد Storage Policies

انسخ والصق هذه السياسات في قسم **Storage Policies**:

#### سياسة للقراءة (Read Policy):
```sql
CREATE POLICY "Allow public read access on post-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'post-images');
```

#### سياسة للكتابة (Upload Policy):
```sql
CREATE POLICY "Allow authenticated users to upload to post-images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'post-images' 
  AND auth.role() = 'authenticated'
);
```

#### سياسة للحذف (Delete Policy):
```sql
CREATE POLICY "Allow authenticated users to delete from post-images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'post-images' 
  AND auth.role() = 'authenticated'
);
```

### 3. التحقق من الإعداد

بعد إنشاء المجلد والسياسات، جرب رفع صورة من لوحة التحكم للتأكد من أن كل شيء يعمل بشكل صحيح.

## ملاحظات مهمة:

- تأكد من أن اسم المجلد هو `post-images` بالضبط
- تأكد من أن المجلد عام (Public)
- تأكد من تطبيق جميع السياسات الثلاث

بعد إكمال هذه الخطوات، ستتمكن من رفع الصور من التطبيق بنجاح.
