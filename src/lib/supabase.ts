
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('مفاتيح Supabase مفقودة في متغيرات البيئة');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// أنواع البيانات
export interface Image {
  id: string;
  post_id: string;
  url: string;
  alt_text?: string;
  caption?: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  display_order: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  category_id?: string;
  category?: Category;
  created_at: string;
  images?: Image[];
  author?: string;
}

export interface Publication {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  is_featured: boolean;
  is_published_on_main: boolean;
  main_image_url?: string;
  additional_images?: string[];
  created_at: string;
  updated_at: string;
  view_count: number;
  comment_count: number;
}

export interface NewPublication {
  title: string;
  content: string;
  category: string;
  is_featured: boolean;
  is_published_on_main: boolean;
  main_image_url?: string;
  additional_images?: string[];
}

export interface Comment {
  id: string;
  post_id: string;
  name: string;
  comment: string;
  created_at: string;
}

export interface NewPost {
  title: string;
  description: string;
  images?: File[];
}

export interface NewImage {
  post_id: string;
  url: string;
  alt_text?: string;
  caption?: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  display_order?: number;
}

export interface NewComment {
  post_id: string;
  name: string;
  comment: string;
}

export interface NewCategory {
  name: string;
  name_ar: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active: boolean;
  display_order: number;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}