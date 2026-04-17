"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, Users, Shield, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: Home, path: '/dashboard' },
    { label: 'Search', icon: Search, path: '/search' },
    { label: 'Friends', icon: Users, path: '/friends' },
    { label: 'Groups', icon: Shield, path: '/groups' },
  ];

  return (
    <>
      {/* Desktop Sidebar / Top Nav */}
      <nav className="fixed left-0 top-0 hidden h-full w-20 flex-col items-center border-r border-white/10 bg-black/50 py-8 backdrop-blur-xl md:flex lg:w-64 lg:items-start lg:px-6">
        <div className="mb-12 hidden lg:block">
          <h1 className="gold-text text-2xl font-bold tracking-tighter italic">SONA CHANDI</h1>
        </div>
        <div className="flex flex-1 flex-col gap-4">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path} className="group relative">
              <div className={`flex items-center gap-4 rounded-xl p-3 transition-all duration-300 ${pathname === item.path ? 'bg-gold/10 text-gold' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
                <item.icon size={24} />
                <span className="hidden font-medium lg:block">{item.label}</span>
                {pathname === item.path && (
                  <motion.div layoutId="nav-pill" className="absolute -left-1 h-3/5 w-1 rounded-full bg-gold lg:left-0" />
                )}
              </div>
            </Link>
          ))}
        </div>
        <button onClick={handleLogout} className="mt-auto flex items-center gap-4 rounded-xl p-3 text-zinc-500 transition-all hover:bg-red-500/10 hover:text-red-500 lg:w-full">
          <LogOut size={24} />
          <span className="hidden font-medium lg:block">Logout</span>
        </button>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-white/10 bg-black/80 px-4 pb-4 backdrop-blur-2xl md:hidden">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path} className="relative flex flex-col items-center gap-1">
            <div className={`rounded-xl p-2 transition-all ${pathname === item.path ? 'text-gold' : 'text-zinc-500'}`}>
              <item.icon size={24} />
              {pathname === item.path && (
                <motion.div layoutId="nav-dot" className="absolute -bottom-1 h-1 w-1 rounded-full bg-gold" />
              )}
            </div>
            <span className={`text-[10px] font-medium ${pathname === item.path ? 'text-gold' : 'text-zinc-500'}`}>{item.label}</span>
          </Link>
        ))}
        <button onClick={handleLogout} className="flex flex-col items-center gap-1 p-2 text-zinc-500">
          <LogOut size={24} />
          <span className="text-[10px] font-medium">Logout</span>
        </button>
      </nav>
    </>
  );
};

export default Navbar;
