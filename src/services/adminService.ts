import { supabase, Admin } from '../lib/supabase';

export class AdminService {
  static async getCurrentAdmin(): Promise<Admin | null> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        throw new Error(`فشل في الحصول على بيانات المستخدم: ${userError.message}`);
      }
      
      if (!user?.email) {
        return null;
      }

      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user.email)
        .eq('is_active', true)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no record found

      if (error) {
        console.error('Error fetching admin:', error);
        // Don't throw here to prevent infinite loops, just log and return null
        if (error.code === 'PGRST116') {
          // Table doesn't exist
          console.warn('Admins table does not exist');
        } else if (error.code === '42P01') {
          // Relation does not exist
          console.warn('Admins table relation does not exist');
        }
        return null;
      }

      return data;
    } catch (err) {
      console.error('Unexpected error in getCurrentAdmin:', err);
      throw err;
    }
  }

  static async updateLastLogin(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      return;
    }

    await supabase
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('email', user.email);
  }

  static async getAllAdmins(): Promise<Admin[]> {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          // Table doesn't exist - return empty array instead of throwing
          console.warn('Admins table does not exist, returning empty array');
          return [];
        }
        throw new Error(`خطأ في جلب المدراء: ${error.message}`);
      }

      return data || [];
    } catch (err) {
      console.error('Error in getAllAdmins:', err);
      if (err instanceof Error && (err.message.includes('relation') || err.message.includes('table'))) {
        // Database/table issue - return empty array
        return [];
      }
      throw err;
    }
  }

  static async createAdmin(admin: { email: string; name: string; role: 'admin' | 'super_admin' }): Promise<Admin> {
    const { data, error } = await supabase
      .from('admins')
      .insert([admin])
      .select()
      .single();

    if (error) {
      throw new Error(`خطأ في إنشاء المدير: ${error.message}`);
    }

    return data;
  }

  static async updateAdmin(id: string, updates: Partial<Pick<Admin, 'name' | 'role' | 'is_active'>>): Promise<Admin> {
    const { data, error } = await supabase
      .from('admins')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`خطأ في تحديث المدير: ${error.message}`);
    }

    return data;
  }

  static async deleteAdmin(id: string): Promise<void> {
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`خطأ في حذف المدير: ${error.message}`);
    }
  }
}