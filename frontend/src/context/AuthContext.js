'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs';
import API, { setTokenProvider } from '@/lib/api';

const AuthContext = createContext();

function getInitialUser() {
  if (typeof window === 'undefined') return null;
  try {
    const storedUser = localStorage.getItem('auth_user');
    const storedToken = localStorage.getItem('auth_token');
    if (storedUser && storedToken) {
      window.__clerk_token = storedToken;
      return JSON.parse(storedUser);
    }
  } catch {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  }
  return null;
}

export function AuthProvider({ children }) {
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { signOut: clerkSignOut, getToken, isLoaded: isAuthLoaded } = useClerkAuth();
  const [dbUser, setDbUser] = useState(null);

  // Register a live token provider so the API interceptor can always
  // fetch a fresh Clerk session token instead of relying on the cached one.
  useEffect(() => {
    setTokenProvider(async () => {
      if (!clerkUser) return null;
      try {
        const token = await getToken();
        return token || null;
      } catch {
        return null;
      }
    });
    return () => setTokenProvider(null);
  }, [clerkUser, getToken]);

  // Restore local auth user from storage after hydration
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const saved = getInitialUser();
    Promise.resolve().then(() => {
      if (saved) setDbUser(saved);
      setHydrated(true);
    });
  }, []);

  // Re-hydrate when login/register writes to localStorage (no page refresh needed)
  useEffect(() => {
    const rehydrate = () => {
      const saved = getInitialUser();
      if (saved) setDbUser(saved);
    };
    window.addEventListener('auth-storage-update', rehydrate);
    return () => window.removeEventListener('auth-storage-update', rehydrate);
  }, []);

  const authLoadDone = isUserLoaded && isAuthLoaded && hydrated;
  const loading = (!authLoadDone && !dbUser) || (clerkUser && !dbUser);

  // Keep Clerk token cached on window for components that read it directly.
  // Do NOT overwrite with null — preserve the last valid token.
  useEffect(() => {
    if (!isAuthLoaded) return;
    const updateToken = async () => {
      if (clerkUser) {
        const token = await getToken();
        if (token) window.__clerk_token = token;
      }
    };
    updateToken();
    const interval = setInterval(updateToken, 50000);
    return () => clearInterval(interval);
  }, [clerkUser, isAuthLoaded, getToken]);

  // Sync Clerk user with MongoDB on sign-in
  useEffect(() => {
    if (!authLoadDone || !clerkUser) return;

    const sync = async () => {
      try {
        const token = await getToken();
        const { data } = await API.post('/auth/sync', {
          clerkUserId: clerkUser.id,
          name: clerkUser.fullName || clerkUser.firstName || 'User',
          email: clerkUser.primaryEmailAddress?.emailAddress,
          phone: clerkUser.primaryPhoneNumber?.phoneNumber || '',
          role: clerkUser.publicMetadata?.role || 'customer',
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDbUser(data);
      } catch (err) {
        console.error('User sync failed:', err);
        setDbUser({
          name: clerkUser.fullName || clerkUser.firstName || 'User',
          email: clerkUser.primaryEmailAddress?.emailAddress,
          role: clerkUser.publicMetadata?.role || 'customer',
          clerkUserId: clerkUser.id,
        });
      }
    };

    sync();
  }, [authLoadDone, clerkUser, getToken]);

  const user = dbUser ? {
    _id: dbUser._id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    phone: dbUser.phone,
    restaurantId: dbUser.restaurantId,
    clerkUserId: dbUser.clerkUserId,
  } : null;

  const getAuthToken = useCallback(async () => {
    if (clerkUser) {
      try {
        const token = await getToken();
        if (token) return token;
      } catch { /* fall through */ }
    }
    if (typeof window !== 'undefined' && window.__clerk_token) {
      return window.__clerk_token;
    }
    return null;
  }, [clerkUser, getToken]);

  const logout = async () => {
    setDbUser(null);
    window.__clerk_token = null;
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    await clerkSignOut();
  };

  return (
    <AuthContext.Provider value={{ user, logout, loading, getAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
