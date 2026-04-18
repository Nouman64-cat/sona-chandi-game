"use client"

import React, { useState, useEffect, useCallback } from 'react';

import Navbar from '@/app/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, Loader2, Check, Sparkles } from 'lucide-react';
import api from '@/app/services/apiService';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

  // Initial fetch on mount
  useEffect(() => {
    performSearch("");
  }, []);

  // Debounced live search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchTerm: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `/users/search?query=${encodeURIComponent(searchTerm)}`;
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        url += `&searcher_id=${payload.sub}`;
      }
      
      const response = await api.get(url);
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
      const token = localStorage.getItem('token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub;

      await api.post(`/friends/${userId}/add/${friendId}`);
      // Refresh result to show as pending
      setResults(results.map((r: any) => r.id === friendId ? { ...r, is_pending: true } : r) as any);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="flex bg-background text-text-primary">
      <Navbar />
      
      <main className="min-h-screen flex-1 p-6 pb-24 md:pb-6 md:pl-24 lg:pl-72">
        <div className="mx-auto max-w-4xl pt-8">
          <header className="mb-12">
            <h1 className="text-4xl font-bold">Find <span className="gold-text">Legends</span></h1>
            <p className="mt-2 text-text-secondary">Search for players by name or username.</p>
          </header>

          <div className="mb-12 translate-y-0 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-secondary" size={24} />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search username or name..."
              className="w-full rounded-3xl border border-border-primary bg-black/5 dark:bg-white/5 py-6 pl-16 pr-8 text-xl outline-none transition-all focus:border-gold/50 focus:bg-white/10 text-text-primary placeholder:opacity-50"
            />
            {loading && <div className="absolute right-6 top-1/2 -translate-y-1/2"><Loader2 className="animate-spin text-gold" size={24} /></div>}
          </div>

          <div className="mb-8 flex items-center gap-2 px-2">
            {query ? (
               <>
                 <Search size={16} className="text-gold" />
                 <span className="text-sm font-bold uppercase tracking-widest text-text-secondary">Search Results</span>
               </>
            ) : (
               <>
                 <Sparkles size={16} className="text-gold" />
                 <span className="text-sm font-bold uppercase tracking-widest text-text-secondary">Recommended Legends</span>
               </>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {results.map((user: any, i) => (
                <motion.div
                  key={user.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="glass flex items-center justify-between rounded-3xl p-6 border border-black/5 dark:border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl font-bold uppercase ${user.is_self ? 'bg-gold/20 text-gold' : 'bg-black/10 dark:bg-silver/10 text-text-secondary'}`}>
                      {user.username[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-bold text-text-primary">
                        {user.full_name}
                        {user.is_self && <span className="rounded-md bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">You</span>}
                      </div>
                      <div className="text-sm text-text-secondary">@{user.username}</div>
                    </div>
                  </div>
                  
                  {!user.is_self && (
                    <button 
                      onClick={() => !user.is_friend && !user.is_pending && addFriend(user.id)}
                      disabled={addingId === user.id || user.is_friend || user.is_pending}
                      className={`flex h-10 px-4 items-center justify-center rounded-xl transition-all ${
                        user.is_friend 
                          ? 'bg-green-500/20 text-green-600 dark:text-green-500 cursor-default' 
                          : user.is_pending
                          ? 'bg-gold/10 text-gold/60 cursor-default italic text-xs'
                          : 'bg-black/10 dark:bg-white/10 text-gold-legible dark:text-gold hover:bg-gold hover:text-black'
                      }`}
                    >
                      {addingId === user.id ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : user.is_friend ? (
                        <Check size={20} />
                      ) : user.is_pending ? (
                        'Request Sent'
                      ) : (
                        <UserPlus size={20} />
                      )}
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {!loading && results.length === 0 && query && (
             <div className="mt-20 text-center">
                <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-text-secondary opacity-30 uppercase tracking-widest">
                    <Search size={40} />
                </div>
                <p className="text-text-secondary font-medium">No legends found matching "{query}"</p>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}


