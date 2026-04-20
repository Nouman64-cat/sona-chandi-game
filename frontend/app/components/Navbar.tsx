"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, Users, Shield, LogOut, Sun, Moon, Swords, Settings, BookOpen, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/app/components/ThemeProvider';

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: Home, path: '/dashboard' },
    { label: 'Search', icon: Search, path: '/search' },
    { label: 'Friends', icon: Users, path: '/friends' },
    { label: 'Groups', icon: Shield, path: '/groups' },
    { label: 'Arena', icon: Swords, path: '/game' },
    { label: 'History', icon: BookOpen, path: '/history' },
    { label: 'Profile', icon: UserIcon, path: '/profile' },
  ];

  const [userInfo, setUserInfo] = React.useState<{name: string, username: string, isAdmin: boolean, profilePicture?: string} | null>(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Token minimal display first for speed
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserInfo({
            name: payload.full_name || 'Legend',
            username: payload.username || 'unknown',
            isAdmin: !!payload.is_admin
          });
          
          // Background fetch for fresh profile_picture
          const { default: api } = await import('@/app/services/apiService');
          const res = await api.get('/auth/me');
          setUserInfo(prev => ({
            name: res.data.full_name,
            username: res.data.username,
            isAdmin: prev?.isAdmin || false,
            profilePicture: res.data.profile_picture_url
          }));
        } catch (e) {
          console.error("Auth sync error", e);
        }
      }
    };
    fetchUser();
  }, []);

  const adminItem = { label: 'Intelligence', icon: Settings, path: '/admin' };
  const adminUsersItem = { label: 'Oversight', icon: Users, path: '/admin/users' };

  return (
    <>
      {/* Desktop Sidebar / Top Nav */}
      <nav className="fixed left-0 top-0 z-50 hidden h-full w-20 flex-col items-center border-r border-white/10 bg-nav-bg py-8 backdrop-blur-xl md:flex lg:w-64 lg:items-start lg:px-6">
        <div className="mb-12 hidden lg:block">
          <h1 className="gold-text text-2xl font-bold tracking-tighter italic">SONA CHANDI</h1>
        </div>
        <div className="flex flex-1 flex-col gap-4 w-full">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path} className="group relative">
              <div className={`flex items-center gap-4 rounded-xl p-3 transition-all duration-300 ${pathname === item.path ? 'bg-gold/10 text-gold' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'}`}>
                <item.icon size={24} />
                <span className="hidden font-medium lg:block">{item.label}</span>
                {pathname === item.path && (
                  <motion.div layoutId="nav-pill" className="absolute -left-1 h-3/5 w-1 rounded-full bg-gold lg:left-0" />
                )}
              </div>
            </Link>
          ))}
          
          {userInfo?.isAdmin && (
            <div className="mt-8 flex flex-col gap-2 w-full border-t border-white/5 pt-8">
              <h3 className="hidden px-3 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary lg:block mb-2">Commander Hub</h3>
              <Link href={adminItem.path} className="group relative">
                <div className={`flex items-center gap-4 rounded-xl p-3 transition-all duration-300 ${pathname === adminItem.path ? 'bg-gold/10 text-gold' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'}`}>
                  <adminItem.icon size={24} />
                  <span className="hidden font-medium lg:block">{adminItem.label}</span>
                  {pathname === adminItem.path && (
                    <motion.div layoutId="nav-pill" className="absolute -left-1 h-3/5 w-1 rounded-full bg-gold lg:left-0" />
                  )}
                </div>
              </Link>
              <Link href={adminUsersItem.path} className="group relative">
                <div className={`flex items-center gap-4 rounded-xl p-3 transition-all duration-300 ${pathname === adminUsersItem.path ? 'bg-gold/10 text-gold' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'}`}>
                  <adminUsersItem.icon size={24} />
                  <span className="hidden font-medium lg:block">{adminUsersItem.label}</span>
                  {pathname === adminUsersItem.path && (
                    <motion.div layoutId="nav-pill" className="absolute -left-1 h-3/5 w-1 rounded-full bg-gold lg:left-0" />
                  )}
                </div>
              </Link>
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-4 w-full">
          {userInfo && (
            <div className="mb-4 hidden items-center gap-3 rounded-2xl bg-white/5 p-4 lg:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-black font-black uppercase shadow-lg shadow-gold/20 overflow-hidden">
                {userInfo.profilePicture ? (
                  <img src={userInfo.profilePicture} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  userInfo.name[0]
                )}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-bold text-text-primary">{userInfo.name}</p>
                <p className="truncate text-[10px] text-text-secondary">@{userInfo.username}</p>
              </div>
            </div>
          )}
          
          <button 
            onClick={toggleTheme}
            className="flex items-center gap-4 rounded-xl p-3 text-text-secondary transition-all hover:bg-white/5 hover:text-text-primary lg:w-full"
          >
            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
            <span className="hidden font-medium lg:block">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          <button onClick={handleLogout} className="flex items-center gap-4 rounded-xl p-3 text-red-500/50 transition-all hover:bg-red-500/10 hover:text-red-500 lg:w-full">
            <LogOut size={24} />
            <span className="hidden font-medium lg:block">Logout</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-border-primary bg-nav-bg px-4 pb-4 backdrop-blur-2xl md:hidden">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path} className="relative flex flex-col items-center gap-1">
            <div className={`rounded-xl p-2 transition-all ${pathname === item.path ? 'text-gold' : 'text-text-secondary'}`}>
              <item.icon size={24} />
              {pathname === item.path && (
                <motion.div layoutId="nav-dot" className="absolute -bottom-1 h-1 w-1 rounded-full bg-gold" />
              )}
            </div>
          </Link>
        ))}

        {userInfo?.isAdmin && (
          <Link href={adminItem.path} className="relative flex flex-col items-center gap-1">
            <div className={`rounded-xl p-2 transition-all ${pathname === adminItem.path ? 'text-gold' : 'text-text-secondary'}`}>
              <adminItem.icon size={24} />
              {pathname === adminItem.path && (
                <motion.div layoutId="nav-dot" className="absolute -bottom-1 h-1 w-1 rounded-full bg-gold" />
              )}
            </div>
          </Link>
        )}
        <button onClick={toggleTheme} className="flex flex-col items-center gap-1 p-2 text-text-secondary">
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>
        <button onClick={handleLogout} className="flex flex-col items-center gap-1 p-2 text-red-500/50">
          <LogOut size={24} />
        </button>
      </nav>


    </>
  );
};

export default Navbar;
