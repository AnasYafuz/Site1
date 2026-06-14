import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState, AdminAccount, ActivationKey, UserRole } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType extends AuthState {
  loginAsAdmin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAsUser: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    userType: null,
  });

  useEffect(() => {
    const storedAuth = localStorage.getItem('auth_state');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        setAuthState(parsed);
      } catch (e) {
        localStorage.removeItem('auth_state');
      }
    }
  }, []);

  const syncUserFromServer = async (params: { keyValue?: string; username?: string; password?: string }) => {
    if (params.keyValue) {
      await supabase.functions.invoke('firebase-stats', {
        body: { action: 'get_key', keyValue: params.keyValue },
      });
      return;
    }

    if (params.username && params.password) {
      await supabase.functions.invoke('firebase-stats', {
        body: {
          action: 'find_key_by_credentials',
          username: params.username,
          password: params.password,
        },
      });
    }
  };

  const loginAsAdmin = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('admin_accounts')
        .select('*')
        .eq('username', username)
        .eq('password_hash', password)
        .maybeSingle();

      if (error) {
        return { success: false, error: 'حدث خطأ في الاتصال' };
      }

      if (!data) {
        return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
      }

      const newState: AuthState = {
        isAuthenticated: true,
        user: data as AdminAccount,
        userType: data.role as UserRole,
      };

      setAuthState(newState);
      localStorage.setItem('auth_state', JSON.stringify(newState));

      return { success: true };
    } catch (e) {
      return { success: false, error: 'حدث خطأ غير متوقع' };
    }
  };

  const loginAsUser = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      let { data, error } = await supabase
        .from('activation_keys')
        .select('*')
        .eq('username', username)
        .eq('password_hash', password)
        .maybeSingle();

      if (!data) {
        await syncUserFromServer({ username, password });

        const retryResult = await supabase
          .from('activation_keys')
          .select('*')
          .eq('username', username)
          .eq('password_hash', password)
          .maybeSingle();

        data = retryResult.data;
        error = retryResult.error;
      }

      if (error) {
        return { success: false, error: 'حدث خطأ في الاتصال' };
      }

      if (!data) {
        return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
      }

      if (!data.is_active) {
        return { success: false, error: 'هذا المفتاح غير مفعل' };
      }

      const newState: AuthState = {
        isAuthenticated: true,
        user: data as ActivationKey,
        userType: 'user',
      };

      setAuthState(newState);
      localStorage.setItem('auth_state', JSON.stringify(newState));

      return { success: true };
    } catch (e) {
      return { success: false, error: 'حدث خطأ غير متوقع' };
    }
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      userType: null,
    });
    localStorage.removeItem('auth_state');
  };

  return (
    <AuthContext.Provider value={{ ...authState, loginAsAdmin, loginAsUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
