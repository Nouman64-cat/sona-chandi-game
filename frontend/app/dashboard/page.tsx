"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';

import { motion } from 'framer-motion';
import { Users, Shield, TrendingUp, Trophy } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // In a real app, we'd fetch the current user details using the JWT
    // For now, we'll just check if logged in
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/auth/login';
    }
  }, []);

  const stats = [
    { label: 'Total Friends', value: '12', icon: Users, color: 'text-gold' },
    { label: 'Active Groups', value: '4', icon: Shield, color: 'text-silver' },
    { label: 'Win Rate', value: '68%', icon: TrendingUp, color: 'text-green-500' },
    { label: 'Rank', value: '#124', icon: Trophy, color: 'text-gold' },
  ];

  return (
    <div className="flex bg-[#050505] text-white">
      <Navbar />
      
      <main className="min-h-screen flex-1 p-6 pb-24 md:pb-6 md:pl-24 lg:pl-72">
        <div className="mx-auto max-w-5xl pt-8">
          <header className="mb-12">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm font-bold uppercase tracking-[0.3em] text-gold"
            >
              Commander Dashboard
            </motion.h2>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-bold md:text-5xl"
            >
              Welcome back, <span className="silver-text">Legend</span>
            </motion.h1>
          </header>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-3xl p-6 text-center"
              >
                <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
             <motion.div 
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               className="glass rounded-3xl p-8"
             >
                <h3 className="mb-6 text-xl font-bold">Recent Activity</h3>
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-4 rounded-2xl bg-white/5 p-4">
                      <div className="h-10 w-10 rounded-full bg-gold/20" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">You added <span className="text-gold">Sultan</span> as a friend</div>
                        <div className="text-xs text-zinc-500">2 hours ago</div>
                      </div>
                    </div>
                  ))}
                </div>
             </motion.div>

             <motion.div 
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               className="glass rounded-3xl p-8"
             >
                <h3 className="mb-6 text-xl font-bold">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-4">
                  <button className="flex items-center gap-4 rounded-2xl bg-gold p-4 font-bold text-black transition-all hover:scale-[1.02]">
                    <Shield size={20} />
                    Create New Group
                  </button>
                  <Link href="/search" className="flex items-center gap-4 rounded-2xl border border-white/10 p-4 font-bold text-white transition-all hover:bg-white/5 w-full">
                    <Users size={20} />
                    Find More Friends
                  </Link>

                </div>
             </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
