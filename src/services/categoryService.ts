import { supabase, Category, NewCategory } from '../lib/supabase';

export class CategoryService {
  static async getAllCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        throw new Error(`خطأ في جلب الفئات: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('CategoryService.getAllCategories error:', error);
      throw error;
    }
  }

  static async getAllCategoriesForAdmin(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching categories for admin:', error);
        throw new Error(`خطأ في جلب الفئات: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('CategoryService.getAllCategoriesForAdmin error:', error);
      throw error;
    }
  }

  static async getCategoryById(id: string): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching category:', error);
        throw new Error(`خطأ في جلب الفئة: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('CategoryService.getCategoryById error:', error);
      throw error;
    }
  }

  static async createCategory(category: NewCategory): Promise<Category> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        throw new Error(`خطأ في إنشاء الفئة: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('CategoryService.createCategory error:', error);
      throw error;
    }
  }

  static async updateCategory(id: string, updates: Partial<NewCategory>): Promise<Category> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating category:', error);
        throw new Error(`خطأ في تحديث الفئة: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('CategoryService.updateCategory error:', error);
      throw error;
    }
  }

  static async deleteCategory(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting category:', error);
        throw new Error(`خطأ في حذف الفئة: ${error.message}`);
      }
    } catch (error) {
      console.error('CategoryService.deleteCategory error:', error);
      throw error;
    }
  }

  static async toggleCategoryStatus(id: string, isActive: boolean): Promise<Category> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error toggling category status:', error);
        throw new Error(`خطأ في تحديث حالة الفئة: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('CategoryService.toggleCategoryStatus error:', error);
      throw error;
    }
  }

  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
