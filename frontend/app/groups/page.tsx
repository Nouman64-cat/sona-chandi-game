"use client"

import React, { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Loader2, Users } from 'lucide-react';
import api from '@/app/services/apiService';

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub;

      const response = await api.post(`/groups/?creator_id=${userId}`, {
        name: newGroupName,
        description: newGroupDesc
      });
      setGroups([...groups, response.data] as any);
      setShowCreate(false);
      setNewGroupName('');
      setNewGroupDesc('');
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex bg-[#050505] text-white">
      <Navbar />
      
      <main className="min-h-screen flex-1 p-6 pb-24 md:pb-6 md:pl-24 lg:pl-72">
        <div className="mx-auto max-w-4xl pt-8">
          <header className="mb-12 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Your <span className="gold-text">Squads</span></h1>
              <p className="mt-2 text-zinc-500">Create or join competitive groups.</p>
            </div>
            <button 
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 rounded-2xl bg-gold px-6 py-3 font-bold text-black transition-all hover:scale-105 active:scale-95"
            >
                <Plus size={20} />
                Create Group
            </button>
          </header>

          <AnimatePresence>
            {showCreate && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass mb-12 rounded-3xl p-8"
              >
                 <h3 className="mb-6 text-xl font-bold">New Group Details</h3>
                 <form onSubmit={handleCreateGroup} className="space-y-4">
                    <input 
                      type="text" 
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Group Name (e.g. Phoenix Elite)"
                      required
                      className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 outline-none focus:border-gold/50"
                    />
                    <textarea 
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      placeholder="Short description..."
                      className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 outline-none focus:border-gold/50"
                    />
                    <div className="flex gap-4">
                        <button type="submit" disabled={creating} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gold py-4 font-bold text-black">
                            {creating ? <Loader2 className="animate-spin" /> : 'Confirm Creation'}
                        </button>
                        <button type="button" onClick={() => setShowCreate(false)} className="rounded-2xl border border-white/10 px-8 font-bold text-white">
                            Cancel
                        </button>
                    </div>
                 </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid gap-6 md:grid-cols-2">
            {[1,2].map(i => (
                <div key={i} className="glass rounded-3xl p-8 relative overflow-hidden group">
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gold/10 blur-2xl transition-all group-hover:bg-gold/20" />
                    <Shield className="mb-4 text-gold" size={32} />
                    <h3 className="text-xl font-bold">Alpha Warriors</h3>
                    <p className="mt-2 text-sm text-zinc-500">The primary competitive squad for high stakes missions.</p>
                    <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <Users size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">12 Members</span>
                        </div>
                        <button className="text-sm font-bold border-b border-gold text-gold hover:text-white transition-all">
                            View Squad
                        </button>
                    </div>
                </div>
            ))}
          </div>

          <div className="mt-20 text-center border-t border-white/5 pt-12">
             <p className="text-zinc-600 text-sm italic">You can add your friends to these groups from the squad view.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
