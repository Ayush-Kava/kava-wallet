import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';

interface AuthUser {
  id: number;
  email: string;
  full_name?: string | null;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const nextUser = data?.data?.user ?? null;
          setUser(nextUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to load auth session', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void loadUser();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, fullName }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Sign up failed');
      }

      const data = await res.json();
      const nextUser = data?.data?.user ?? null;
      setUser(nextUser);

      toast({
        title: 'Account created!',
        description: "Welcome to KavaFlow. Let's get your finances organized.",
      });

      return { error: null };
    } catch (error: any) {
      const message =
        error.message === 'User already registered'
          ? 'This email is already registered. Please sign in instead.'
          : error.message;

      toast({
        title: 'Sign up failed',
        description: message,
        variant: 'destructive',
      });

      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Invalid credentials');
      }

      const data = await res.json();
      const nextUser = data?.data?.user ?? null;
      setUser(nextUser);

      toast({
        title: 'Welcome back!',
        description: "You've successfully signed in.",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });

      return { error };
    }
  };

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    toast({
      title: 'Signed out',
      description: "You've been successfully signed out.",
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
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
