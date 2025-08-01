import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Admin } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    // Force timeout after 10 seconds to prevent infinite loading
    const forceTimeout = () => {
      timeoutId = setTimeout(() => {
        if (isMounted) {
          console.warn('Auth loading timeout - forcing loading to false');
          setLoading(false);
        }
      }, 10000);
    };

    const initAuth = async () => {
      try {
        forceTimeout();
        
        console.log('Initializing auth...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('Auth session error:', error);
          clearTimeout(timeoutId);
          setLoading(false);
          return;
        }

        console.log('Session obtained:', session?.user?.email || 'No user');
        setUser(session?.user ?? null);
        
        // Set admin data immediately for authenticated users
        if (session?.user) {
          const mockAdmin: Admin = {
            id: '1',
            email: session.user.email || '',
            name: 'مدير التطبيق',
            role: 'super_admin',
            is_active: true,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          };
          console.log('Setting mock admin:', mockAdmin);
          setAdmin(mockAdmin);
        } else {
          setAdmin(null);
        }
        
        clearTimeout(timeoutId);
        setLoading(false);
        console.log('Auth initialization completed');
        
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email || 'No user');
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const mockAdmin: Admin = {
            id: '1',
            email: session.user.email || '',
            name: 'مدير التطبيق',
            role: 'super_admin',
            is_active: true,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          };
          setAdmin(mockAdmin);
        } else {
          setAdmin(null);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (err) {
      console.error('Sign in error:', err);
      return { data: null, error: err as any };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      setAdmin(null);
      setUser(null);
      return { error };
    } catch (err) {
      console.error('Sign out error:', err);
      return { error: err as any };
    }
  };

  return {
    user,
    admin,
    loading,
    signIn,
    signOut,
  };
}
