import { supabase, Publication, NewPublication } from '../lib/supabase';
import { ImageService } from './imageService';

export class PublicationService {
  static async getAllPublications(): Promise<Publication[]> {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('انتهت مهلة الاتصال مع قاعدة البيانات')), 8000);
    });

    try {
      // Race between the actual request and timeout
      const result = await Promise.race([
        supabase
          .from('publications')
          .select('*')
          .order('created_at', { ascending: false }),
        timeoutPromise
      ]);

      const { data, error } = result as any;

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          // Table doesn't exist - return empty array instead of throwing
          console.warn('Publications table does not exist, returning empty array');
          return [];
        }
        throw new Error(`خطأ في جلب المنشورات: ${error.message}`);
      }

      return data || [];
    } catch (err) {
      console.error('Error in getAllPublications:', err);
      if (err instanceof Error) {
        if (err.message.includes('relation') || err.message.includes('table') || err.message.includes('قاعدة البيانات')) {
          // Database/table issue - return empty array
          return [];
        }
      }
      throw err;
    }
  }

  static async getPublicationById(id: string): Promise<Publication | null> {
    const { data, error } = await supabase
      .from('publications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // المنشور غير موجود
      }
      throw new Error(`خطأ في جلب المنشور: ${error.message}`);
    }

    return data;
  }

  static async createPublication(publication: NewPublication): Promise<Publication> {
    const { data, error } = await supabase
      .from('publications')
      .insert([publication])
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      const errorMessage = error.message || error.details || error.hint || 'حدث خطأ غير متوقع';
      throw new Error(`خطأ في إنشاء المنشور: ${errorMessage}`);
    }

    return data;
  }
  
  // Upload publication images and create publication
  static async createPublicationWithImages(
    publicationData: NewPublication,
    mainImage?: File,
    additionalImages?: File[]
  ): Promise<Publication> {
    try {
      let mainImageUrl: string | undefined;
      let additionalImageUrls: string[] = [];
      
      // Generate temporary publication ID for image uploads
      const tempId = `pub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Upload main image if provided
      if (mainImage) {
        try {
          mainImageUrl = await this.uploadPublicationImage(mainImage, tempId, 'main');
        } catch (error) {
          console.error('Failed to upload main image:', error);
          throw new Error('فشل في رفع الصورة الرئيسية');
        }
      }
      
      // Upload additional images if provided
      if (additionalImages && additionalImages.length > 0) {
        try {
          for (let i = 0; i < additionalImages.length; i++) {
            const imageUrl = await this.uploadPublicationImage(additionalImages[i], tempId, `additional_${i}`);
            additionalImageUrls.push(imageUrl);
          }
        } catch (error) {
          console.error('Failed to upload additional images:', error);
          throw new Error('فشل في رفع الصور الإضافية');
        }
      }
      
      // Create publication with image URLs
      const publicationWithImages: NewPublication = {
        ...publicationData,
        main_image_url: mainImageUrl,
        additional_images: additionalImageUrls.length > 0 ? additionalImageUrls : undefined
      };
      
      return await this.createPublication(publicationWithImages);
    } catch (error) {
      console.error('Error creating publication with images:', error);
      throw error;
    }
  }
  
  // Upload a single publication image
  private static async uploadPublicationImage(file: File, publicationId: string, imageType: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `publications/${publicationId}/${imageType}_${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('post-images') // Using the same bucket as posts
        .upload(fileName, file);
      
      if (error) {
        throw new Error(`فشل في رفع الصورة: ${error.message}`);
      }
      
      // Get public URL
      const { data: publicData } = supabase.storage
        .from('post-images')
        .getPublicUrl(data.path);
      
      return publicData.publicUrl;
    } catch (error) {
      console.error('Error uploading publication image:', error);
      throw error;
    }
  }

  static async updatePublication(id: string, updates: Partial<NewPublication>): Promise<Publication> {
    const { data, error } = await supabase
      .from('publications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`خطأ في تحديث المنشور: ${error.message}`);
    }

    return data;
  }

  static async deletePublication(id: string): Promise<void> {
    const { error } = await supabase
      .from('publications')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`خطأ في حذف المنشور: ${error.message}`);
    }
  }

  static async getFeaturedPublications(): Promise<Publication[]> {
    const { data, error } = await supabase
      .from('publications')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return [];
      }
      throw new Error(`خطأ في جلب المنشورات المميزة: ${error.message}`);
    }

    return data || [];
  }

  static async getPublicationsByCategory(category: string): Promise<Publication[]> {
    const { data, error } = await supabase
      .from('publications')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return [];
      }
      throw new Error(`خطأ في جلب منشورات الفئة: ${error.message}`);
    }

    return data || [];
  }

  // Helper method to update additional_pages separately
  private static async updatePublicationPages(id: string, pages: string[]): Promise<void> {
    const { error } = await supabase
      .from('publications')
      .update({ additional_pages: pages })
      .eq('id', id);

    if (error) {
      throw new Error(`خطأ في تحديث الصفحات الإضافية: ${error.message}`);
    }
  }
}
