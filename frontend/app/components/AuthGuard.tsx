"use client"

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import api from '@/app/services/apiService';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('token');
      
      // 1. If no token and trying to reach a protected page, redirect
      const isPublicPage = pathname === '/auth/login' || pathname === '/auth/register' || pathname === '/';
      
      if (!token) {
        if (!isPublicPage) {
          router.push('/auth/login');
          return;
        }
        setLoading(false);
        return;
      }

      // 2. If token exists, perform a handshake with the backend
      try {
        await api.get('/auth/me');
        // If successful, and we are on a login/register page, move to dashboard
        if (isPublicPage) {
          router.push('/dashboard');
        }
      } catch (err) {
        // If the handshake fails (e.g. 401), the interceptor will clear the token and redirect
        // We handle it here just in case to avoid infinite loading
        console.error("Session verification failed", err);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
            <Loader2 className="animate-spin text-gold mx-auto mb-4" size={48} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold animate-pulse">Verifying Arena Legend...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
