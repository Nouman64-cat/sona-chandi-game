"use client"

import React, { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, 
    Trash2, 
    Shield, 
    Search, 
    Loader2, 
    AlertCircle, 
    CheckCircle2, 
    User as UserIcon,
    Mail,
    Phone,
    ShieldAlert
} from 'lucide-react';
import api from '@/app/services/apiService';

interface UserRecord {
  id: number;
  full_name: string;
  username: string;
  email: string;
  gender: string;
  number: string;
  is_admin: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(Number(payload.sub));
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to access the Legend Registry.");
    } finally {
      setLoading(false);
    }
  };

  const handlePurge = async (user: UserRecord) => {
    if (user.id === currentUserId) return;
    
    const confirmed = window.confirm(`DANGER: Are you sure you want to permanently purge ${user.full_name} (@${user.username}) from the Arena? This will dissolve all their squad memberships and friendships.`);
    
    if (!confirmed) return;

    setPurging(user.id);
    setError(null);
    setSuccessMsg(null);
    
    try {
      await api.delete(`/admin/users/${user.id}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setSuccessMsg(`Legend ${user.username} has been purged from the archives.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Purge command failed.");
    } finally {
      setPurging(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-gold">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="flex bg-background text-text-primary">
      <Navbar />
      
      <main className="min-h-screen flex-1 p-4 md:p-6 pb-24 md:pl-24 lg:pl-72">
        <div className="mx-auto max-w-6xl pt-8">
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gold/10 text-gold shadow-lg shadow-gold/10">
                    <Users size={20} />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-gold">Tactical Oversight</h2>
            </div>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase mb-4">
              Legend <span className="silver-text">Registry</span>
            </h1>
            <p className="text-text-secondary italic">Manage the population of the Sona Chandi Arena.</p>
          </header>

          <AnimatePresence>
            {successMsg && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mb-8 flex items-center gap-3 rounded-2xl bg-green-500/10 p-4 text-green-500 border border-green-500/20"
                >
                    <CheckCircle2 size={20} />
                    <span className="font-bold">{successMsg}</span>
                </motion.div>
            )}
            {error && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 flex items-center gap-3 rounded-2xl bg-red-500/10 p-4 text-red-500 border border-red-500/20"
                >
                    <AlertCircle size={20} />
                    <span className="font-bold">{error}</span>
                </motion.div>
            )}
          </AnimatePresence>

          <div className="mb-8 relative max-w-xl">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
             <input 
                type="text"
                placeholder="Find a legend by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl bg-card p-4 pl-12 text-lg font-bold border border-white/5 focus:border-gold/40 outline-none transition-all shadow-xl"
             />
          </div>

          <div className="grid gap-4">
            {filteredUsers.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass flex flex-col md:flex-row items-center justify-between p-6 rounded-[2rem] gap-6 border transition-all duration-300 ${user.id === currentUserId ? 'border-gold/20 bg-gold/5' : 'border-white/5 hover:border-gold/10'}`}
              >
                <div className="flex items-center gap-6 w-full">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-[1.5rem] shadow-lg ${user.is_admin ? 'bg-gold text-black' : 'bg-white/5 text-text-secondary border border-white/10'}`}>
                        {user.is_admin ? <Shield size={32} /> : <UserIcon size={32} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-xl font-black italic tracking-tight uppercase truncate">{user.full_name}</h3>
                            <span className="text-xs font-bold text-gold/60">@{user.username}</span>
                            {user.is_admin && (
                                <span className="flex items-center gap-1 rounded-full bg-gold/10 px-3 py-1 text-[9px] font-black text-gold uppercase tracking-widest border border-gold/20">
                                    Commander
                                </span>
                            )}
                            {user.id === currentUserId && (
                                <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[9px] font-black text-white uppercase tracking-widest border border-white/20">
                                    YOU
                                </span>
                            )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-text-secondary">
                            <span className="flex items-center gap-1.5"><Mail size={14} className="opacity-50" /> {user.email}</span>
                            <span className="flex items-center gap-1.5"><Phone size={14} className="opacity-50" /> {user.number}</span>
                            <span className="flex items-center gap-1.5 uppercase font-bold tracking-widest opacity-30">{user.gender}</span>
                            <span className="opacity-30">ID: {user.id}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    {user.id !== currentUserId && (
                        <button 
                            onClick={() => handlePurge(user)}
                            disabled={purging === user.id}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-4 text-sm font-black text-red-500 transition-all hover:bg-red-500/10 active:scale-95 disabled:opacity-50"
                        >
                            {purging === user.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                            PURGE LEGEND
                        </button>
                    )}
                    {user.id === currentUserId && (
                        <div className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl bg-white/5 px-6 py-4 text-xs font-black text-text-secondary border border-white/5 cursor-not-allowed italic">
                            PROTECTED ID
                        </div>
                    )}
                </div>
              </motion.div>
            ))}

            {filteredUsers.length === 0 && !loading && (
                <div className="rounded-[3rem] border-2 border-dashed border-white/5 p-20 text-center">
                    <ShieldAlert className="mx-auto text-text-secondary mb-4 opacity-20" size={60} />
                    <p className="text-text-secondary font-bold uppercase tracking-widest">No legends found matching your query.</p>
                </div>
            )}
          </div>

          <footer className="mt-12 p-8 rounded-[2rem] bg-red-500/5 border border-red-500/10">
              <div className="flex items-center gap-4 mb-4">
                  <ShieldAlert className="text-red-500" />
                  <h4 className="font-black uppercase tracking-tighter text-red-500">Commander's Oath</h4>
              </div>
              <p className="text-sm text-text-secondary italic">
                  With the power of the Registry comes the responsibility of the Arena. Purging a legend is a permanent action that removes all their tactical influence, squad memberships, and active card assets. Use your authority with strategic precision.
              </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
