import { supabase, Post, NewPost, Image } from '../lib/supabase';

export class PostService {
  static async getAllPosts(): Promise<Post[]> {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('انتهت مهلة الاتصال مع قاعدة البيانات')), 8000);
    });

    try {
      // Race between the actual request and timeout
      const result = await Promise.race([
        supabase
          .from('posts')
          .select(`
            *,
            images (
              id,
              url,
              alt_text,
              caption,
              display_order
            ),
            category:categories (
              id,
              name,
              name_ar,
              slug,
              icon,
              color
            )
          `)
          .order('created_at', { ascending: false }),
        timeoutPromise
      ]);

      const { data, error } = result as any;

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          // Table doesn't exist - return empty array instead of throwing
          console.warn('Posts table does not exist, returning empty array');
          return [];
        }
        throw new Error(`خطأ في جلب المنشورات: ${error.message}`);
      }

      // Sort images by display_order for each post
      const postsWithSortedImages = (data || []).map((post: any) => ({
        ...post,
        images: post.images ? post.images.sort((a: Image, b: Image) => a.display_order - b.display_order) : []
      }));

      return postsWithSortedImages;
    } catch (err) {
      console.error('Error in getAllPosts:', err);
      if (err instanceof Error) {
        if (err.message.includes('relation') || err.message.includes('table') || err.message.includes('قاعدة البيانات')) {
          // Database/table issue - return empty array
          return [];
        }
      }
      throw err;
    }
  }

  static async getPostById(id: string): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        images (
          id,
          url,
          alt_text,
          caption,
          display_order
        ),
        category:categories (
          id,
          name,
          name_ar,
          slug,
          icon,
          color
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // المنشور غير موجود
      }
      throw new Error(`خطأ في جلب المنشور: ${error.message}`);
    }

    // Sort images by display_order
    if (data && data.images) {
      data.images = data.images.sort((a: Image, b: Image) => a.display_order - b.display_order);
    }

    return data;
  }

  static async createPost(post: NewPost): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .insert([post])
      .select()
      .single();

    if (error) {
      throw new Error(`خطأ في إنشاء المنشور: ${error.message}`);
    }

    return data;
  }

  static async updatePost(id: string, updates: Partial<NewPost>): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`خطأ في تحديث المنشور: ${error.message}`);
    }

    return data;
  }

  static async deletePost(id: string): Promise<void> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`خطأ في حذف المنشور: ${error.message}`);
    }
  }
}