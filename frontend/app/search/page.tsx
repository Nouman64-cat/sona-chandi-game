"use client"

import React, { useState } from 'react';
import Navbar from '@/app/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, Loader2, Check } from 'lucide-react';
import api from '@/app/services/apiService';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const response = await api.get(`/users/search?query=${query}`);
      setResults(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async (friendId: number) => {
    setAddingId(friendId);
    try {
      // Assuming a hardcoded user ID for now since we don't have a full auth context
      // In a real app, the backend would get user_id from the JWT token
      // But based on my backend routes, it needs {user_id}/add/{friend_id}
      // I'll need to parse the JWT to get the user ID
      const token = localStorage.getItem('token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub;

      await api.post(`/friends/${userId}/add/${friendId}`);
      // Refresh or mark as added
      setResults(results.map((r: any) => r.id === friendId ? { ...r, isAdded: true } : r) as any);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="flex bg-[#050505] text-white">
      <Navbar />
      
      <main className="min-h-screen flex-1 p-6 pb-24 md:pb-6 md:pl-24 lg:pl-72">
        <div className="mx-auto max-w-4xl pt-8">
          <header className="mb-12">
            <h1 className="text-4xl font-bold">Find <span className="gold-text">Legends</span></h1>
            <p className="mt-2 text-zinc-500">Search for players by name or username.</p>
          </header>

          <form onSubmit={handleSearch} className="mb-12 translate-y-0 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" size={24} />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search username or name..."
              className="w-full rounded-3xl border border-white/10 bg-white/5 py-6 pl-16 pr-32 text-xl outline-none transition-all focus:border-gold/50 focus:bg-white/10"
            />
            <button 
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-2xl bg-gold px-6 py-3 font-bold text-black transition-all hover:scale-105 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Search'}
            </button>
          </form>

          <div className="grid gap-6 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {results.map((user: any, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass flex items-center justify-between rounded-3xl p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-silver/10 text-silver font-bold uppercase">
                      {user.username[0]}
                    </div>
                    <div>
                      <div className="font-bold">{user.full_name}</div>
                      <div className="text-sm text-zinc-500">@{user.username}</div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => !user.isAdded && addFriend(user.id)}
                    disabled={addingId === user.id || user.isAdded}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${user.isAdded ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-gold hover:bg-gold hover:text-black'}`}
                  >
                    {addingId === user.id ? <Loader2 className="animate-spin" size={20} /> : (user.isAdded ? <Check size={20} /> : <UserPlus size={20} />)}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {!loading && results.length === 0 && query && (
             <div className="mt-20 text-center">
                <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-white/5 flex items-center justify-center text-zinc-700">
                    <Search size={40} />
                </div>
                <p className="text-zinc-500">No legends found with that name.</p>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
