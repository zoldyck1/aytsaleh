import { supabase } from '../lib/supabase';
import { Image, NewImage } from '../lib/supabase';

export class ImageService {
  private static readonly BUCKET_NAME = 'post-images';
  private static bucketCreated = false;

  // Check if bucket exists (without creating)
  private static async checkBucketExists(): Promise<boolean> {
    try {
      // Try to list files in the bucket as a simple existence check
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list('', { limit: 1 });
      
      // If no error, bucket exists
      if (!error) {
        this.bucketCreated = true;
        return true;
      }
      
      // If bucket doesn't exist, we'll get a specific error
      if (error.message.includes('Bucket not found') || error.message.includes('not found')) {
        return false;
      }
      
      // For other errors, assume bucket exists but we don't have access
      console.warn('Bucket check returned unexpected error:', error);
      this.bucketCreated = true;
      return true;
    } catch (error) {
      console.error('Error checking bucket existence:', error);
      // Assume bucket exists to proceed with upload attempt
      return true;
    }
  }

  // Upload image file to Supabase storage
  static async uploadImage(file: File, postId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${postId}/${Date.now()}.${fileExt}`;

      // Try to upload directly
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file);

      if (error) {
        // If bucket not found, provide a helpful error message
        if (error.message.includes('Bucket not found') || error.message.includes('not found')) {
          throw new Error(`مجلد التخزين '${this.BUCKET_NAME}' غير موجود. يرجى إنشاء المجلد في لوحة تحكم Supabase أولاً.`);
        }
        
        // For permission errors
        if (error.message.includes('row-level security') || error.message.includes('policy')) {
          throw new Error('ليس لديك صلاحية لرفع الصور. يرجى التحقق من صلاحيات التخزين.');
        }
        
        throw new Error(`فشل في رفع الصورة: ${error.message}`);
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(data.path);

      return publicData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Create image record in database
  static async createImage(imageData: NewImage): Promise<Image> {
    try {
      const { data, error } = await supabase
        .from('images')
        .insert([imageData])
        .select()
        .single();

      if (error) {
        throw new Error(`فشل في حفظ بيانات الصورة: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating image record:', error);
      throw error;
    }
  }

  // Get images for a post
  static async getImagesByPostId(postId: string): Promise<Image[]> {
    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('post_id', postId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`فشل في جلب الصور: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching images:', error);
      throw error;
    }
  }

  // Update image
  static async updateImage(id: string, updates: Partial<Image>): Promise<Image> {
    try {
      const { data, error } = await supabase
        .from('images')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`فشل في تحديث الصورة: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating image:', error);
      throw error;
    }
  }

  // Delete image
  static async deleteImage(id: string): Promise<void> {
    try {
      // First get the image data to delete from storage
      const { data: imageData, error: fetchError } = await supabase
        .from('images')
        .select('url, file_name')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error(`فشل في جلب بيانات الصورة: ${fetchError.message}`);
      }

      // Delete from storage - extract file path from URL
      if (imageData.url) {
        try {
          // Extract the file path from the full URL
          const url = new URL(imageData.url);
          const pathSegments = url.pathname.split('/');
          const bucketIndex = pathSegments.findIndex(segment => segment === this.BUCKET_NAME);
          
          if (bucketIndex !== -1 && bucketIndex < pathSegments.length - 1) {
            const filePath = pathSegments.slice(bucketIndex + 1).join('/');
            
            const { error: storageError } = await supabase.storage
              .from(this.BUCKET_NAME)
              .remove([filePath]);

            if (storageError) {
              console.warn('Warning: Could not delete file from storage:', storageError);
            }
          }
        } catch (urlError) {
          // If URL parsing fails, try with file_name as fallback
          if (imageData.file_name) {
            const { error: storageError } = await supabase.storage
              .from(this.BUCKET_NAME)
              .remove([imageData.file_name]);

            if (storageError) {
              console.warn('Warning: Could not delete file from storage:', storageError);
            }
          }
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('images')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`فشل في حذف الصورة: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  // Upload multiple images for a post
  static async uploadPostImages(files: File[], postId: string): Promise<Image[]> {
    try {
      const uploadedImages: Image[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Upload file to storage
        const url = await this.uploadImage(file, postId);
        
        // Create image record
        const imageData: NewImage = {
          post_id: postId,
          url,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          display_order: i,
          alt_text: `صورة ${i + 1} للمنشور`
        };

        const image = await this.createImage(imageData);
        uploadedImages.push(image);
      }

      return uploadedImages;
    } catch (error) {
      console.error('Error uploading post images:', error);
      throw error;
    }
  }

  // Validate image file
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    const maxSizeInMB = 5;
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',
      'image/tif',
      'image/ico',
      'image/avif',
      'image/heic',
      'image/heif'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'نوع الملف غير مدعوم. يرجى استخدام صور بصيغة JPG، PNG، WebP، GIF، SVG، BMP، TIFF، ICO، AVIF، أو HEIC'
      };
    }

    if (file.size > maxSizeInMB * 1024 * 1024) {
      return {
        isValid: false,
        error: `حجم الملف كبير جداً. الحد الأقصى ${maxSizeInMB} ميجابايت`
      };
    }

    return { isValid: true };
  }

  // Validate multiple images
  static validateImages(files: File[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxFiles = 10;

    if (files.length > maxFiles) {
      errors.push(`عدد الصور كبير جداً. الحد الأقصى ${maxFiles} صور`);
    }

    files.forEach((file, index) => {
      const validation = this.validateImageFile(file);
      if (!validation.isValid) {
        errors.push(`الصورة ${index + 1}: ${validation.error}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
