"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#050505]">
       <div className="gold-text text-2xl font-bold animate-pulse">SONA CHANDI</div>
    </div>
  );
}

