"use client"

import React, { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { UserMinus, Loader2, MessageSquare, Shield, X } from 'lucide-react';
import api from '@/app/services/apiService';

export default function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub;

      const [friendsRes, requestsRes] = await Promise.all([
        api.get(`/friends/${userId}`),
        api.get(`/friends/${userId}/requests`)
      ]);
      
      setFriends(friendsRes.data);
      setRequests(requestsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requesterId: number) => {
    setActingId(requesterId);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub;

      await api.post(`/friends/${userId}/accept/${requesterId}`);
      
      // Move from requests to friends
      const acceptedUser = requests.find((r: any) => r.id === requesterId);
      setRequests(requests.filter((r: any) => r.id !== requesterId));
      if (acceptedUser) setFriends([...friends, acceptedUser] as any);
    } catch (err) {
      console.error(err);
    } finally {
      setActingId(null);
    }
  };

  const declineRequest = async (requesterId: number) => {
    setActingId(requesterId);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub;

      await api.post(`/friends/${userId}/decline/${requesterId}`);
      setRequests(requests.filter((r: any) => r.id !== requesterId));
    } catch (err) {
      console.error(err);
    } finally {
      setActingId(null);
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
            <h1 className="text-4xl font-bold">The <span className="silver-text">Alliance</span></h1>
            <p className="mt-2 text-text-secondary">Security clearance managed. Consensual connections only.</p>
          </header>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="animate-spin text-gold" size={40} />
            </div>
          ) : (
            <div className="space-y-12">
              {/* Incoming Transmissions */}
              {requests.length > 0 && (
                <section>
                  <h3 className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gold/60">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />
                    Incoming Transmissions
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <AnimatePresence mode="popLayout">
                      {requests.map((req: any) => (
                        <motion.div
                          key={req.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="glass border-gold/20 flex items-center justify-between rounded-3xl p-6 shadow-lg shadow-gold/5"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold text-black font-black uppercase">
                              {req.username[0]}
                            </div>
                            <div>
                              <div className="font-bold text-text-primary">{req.full_name}</div>
                              <div className="text-xs text-text-secondary">Requesting clearance...</div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={() => acceptRequest(req.id)}
                              disabled={actingId === req.id}
                              className="flex h-10 px-4 items-center justify-center rounded-xl bg-gold text-black font-bold text-sm hover:scale-105 transition-all disabled:opacity-50"
                            >
                              {actingId === req.id ? <Loader2 className="animate-spin" size={18} /> : 'Accept'}
                            </button>
                            <button 
                              onClick={() => declineRequest(req.id)}
                              disabled={actingId === req.id}
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-red-500/10 hover:text-red-500 transition-all disabled:opacity-50"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </section>
              )}

              {/* Active Alliance */}
              <section>
                <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary/60">Active Alliance</h3>
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
                            <div className="font-bold text-text-primary">{friend.full_name}</div>
                            <div className="text-sm text-text-secondary">@{friend.username}</div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary transition-all">
                              <MessageSquare size={18} />
                          </button>
                          <button 
                            onClick={() => removeFriend(friend.id)}
                            disabled={removingId === friend.id}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-500 hover:text-white transition-all"
                          >
                            {removingId === friend.id ? <Loader2 className="animate-spin" size={18} /> : <UserMinus size={18} />}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                {!loading && friends.length === 0 && (
                  <div className="py-20 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-text-secondary/20">
                      <Shield size={40} />
                    </div>
                    <p className="text-text-secondary italic">The Alliance is currently empty. Start transmissions via search.</p>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

