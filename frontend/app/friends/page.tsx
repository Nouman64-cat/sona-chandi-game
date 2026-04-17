"use client"

import React, { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { UserMinus, Loader2, MessageSquare } from 'lucide-react';
import api from '@/app/services/apiService';

export default function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub;

      const response = await api.get(`/friends/${userId}`);
      setFriends(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendId: number) => {
    setRemovingId(friendId);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub;

      await api.delete(`/friends/${userId}/remove/${friendId}`);
      setFriends(friends.filter((f: any) => f.id !== friendId));
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="flex bg-background text-text-primary">
      <Navbar />
      
      <main className="min-h-screen flex-1 p-6 pb-24 md:pb-6 md:pl-24 lg:pl-72">
        <div className="mx-auto max-w-4xl pt-8">
          <header className="mb-12">
            <h1 className="text-4xl font-bold">Your <span className="silver-text">Alliance</span></h1>
            <p className="mt-2 text-text-secondary">Manage your connections and friendships.</p>
          </header>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="animate-spin text-gold" size={40} />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {friends.map((friend: any, i) => (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass flex items-center justify-between rounded-3xl p-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold font-bold uppercase">
                        {friend.username[0]}
                      </div>
                      <div>
                        <div className="font-bold">{friend.full_name}</div>
                        <div className="text-sm text-text-secondary">@{friend.username}</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                       <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-text-secondary hover:bg-white/10 hover:text-text-primary transition-all">
                          <MessageSquare size={18} />
                       </button>
                       <button 
                        onClick={() => removeFriend(friend.id)}
                        disabled={removingId === friend.id}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      >
                        {removingId === friend.id ? <Loader2 className="animate-spin" size={18} /> : <UserMinus size={18} />}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          
          {!loading && friends.length === 0 && (
             <div className="mt-20 text-center">
                <p className="text-text-secondary italic">You don't have any friends yet. Use search to find some!</p>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}

