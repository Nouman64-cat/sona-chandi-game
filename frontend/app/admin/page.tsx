"use client"

import React, { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Save, Shield, Swords, Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '@/app/services/apiService';

interface CardTemplate {
  id: number;
  card_type: string;
  name: string;
  value: number;
}

export default function AdminDashboard() {
  const [cards, setCards] = useState<CardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/auth/login';
        return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.is_admin) {
        setError("Legendary authority (Admin) required to access this chamber.");
        setLoading(false);
        return;
      }
      setIsAdmin(true);
      
      const response = await api.get('/admin/cards');
      setCards(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to communicate with the Command Center.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (card: CardTemplate) => {
    setSaving(card.id);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.put(`/admin/cards/${card.id}`, {
        name: card.name,
        value: Number(card.value),
        color: card.color
      });
      setSuccessMsg(`Intelligence updated for ${card.card_type}!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Update failed.");
    } finally {
      setSaving(null);
    }
  };

  const updateLocalCard = (id: number, field: string, value: any) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-gold">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  if (!isAdmin && error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-8 text-center">
        <div className="max-w-md">
          <AlertCircle className="mx-auto mb-6 text-red-500" size={60} />
          <h2 className="text-2xl font-bold uppercase tracking-tighter">Forbidden Chamber</h2>
          <p className="mt-4 text-text-secondary">{error}</p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="mt-8 rounded-2xl border border-gold/20 bg-gold/5 px-8 py-3 font-bold text-gold transition-all hover:bg-gold/10"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-background text-text-primary">
      <Navbar />
      
      <main className="min-h-screen flex-1 p-4 md:p-6 pb-24 md:pl-24 lg:pl-72">
        <div className="mx-auto max-w-5xl pt-8">
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gold/10 text-gold shadow-lg shadow-gold/10">
                    <Shield size={20} />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-gold">Commander's Dashboard</h2>
            </div>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase mb-4">
              Arena <span className="silver-text">Intelligence</span>
            </h1>
            <p className="text-text-secondary italic">Redefine the economy of the Sona Chandi Arena.</p>
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

          <div className="grid gap-6">
            {cards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass relative overflow-hidden rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/5 hover:border-gold/20 transition-all duration-500"
              >
                <div className="flex items-center gap-6">
                    <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-3xl bg-gold/5 text-gold shadow-low border border-gold/10 relative group">
                        <Swords size={28} className="md:w-8 md:h-8 group-hover:rotate-12 transition-transform" />
                        <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gold text-black text-xs font-black ring-4 ring-background">
                            {card.card_type}
                        </span>
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2 block">Display Name</label>
                                <input 
                                    type="text" 
                                    value={card.name}
                                    onChange={(e) => updateLocalCard(card.id, 'name', e.target.value)}
                                    className="w-full rounded-xl bg-white/5 p-3 text-lg font-bold border border-transparent focus:border-gold/40 focus:bg-white/10 outline-none transition-all"
                                    placeholder="e.g. Platinum"
                                />
                            </div>
                            <div className="w-full md:w-32">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2 block">Value</label>
                                <input 
                                    type="number" 
                                    value={card.value}
                                    onChange={(e) => updateLocalCard(card.id, 'value', e.target.value)}
                                    className="w-full rounded-xl bg-white/5 p-3 text-lg font-bold border border-transparent focus:border-gold/40 focus:bg-white/10 outline-none transition-all"
                                    placeholder="0"
                                />
                            </div>
                            <div className="w-full md:w-48">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2 block">Aura Color</label>
                                <div className="flex items-center gap-3">
                                    <div className="relative group/color shadow-lg shadow-black/20">
                                        <input 
                                            type="color" 
                                            id={`color-${card.id}`}
                                            value={card.color}
                                            onChange={(e) => updateLocalCard(card.id, 'color', e.target.value)}
                                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                        />
                                        <div 
                                            className="h-12 w-12 rounded-xl border border-white/10 ring-2 ring-transparent transition-all group-hover/color:ring-gold/30"
                                            style={{ backgroundColor: card.color }}
                                        />
                                    </div>
                                    <div className="flex-1 relative">
                                        <input 
                                            type="text" 
                                            value={card.color}
                                            onChange={(e) => updateLocalCard(card.id, 'color', e.target.value)}
                                            className="w-full rounded-xl bg-white/5 p-3 pr-4 text-sm font-mono font-bold border border-transparent focus:border-gold/40 focus:bg-white/10 outline-none transition-all uppercase"
                                            placeholder="#000000"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: card.color }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => handleUpdate(card)}
                    disabled={saving === card.id}
                    className="flex items-center justify-center gap-3 rounded-2xl bg-gold px-8 py-4 font-black text-black shadow-lg shadow-gold/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                    {saving === card.id ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>
                            <Save size={20} />
                            UPDATE CARD
                        </>
                    )}
                </button>
              </motion.div>
            ))}

            {cards.length === 0 && (
                <div className="rounded-[3rem] border-2 border-dashed border-white/5 p-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-gold mb-4" size={40} />
                    <p className="text-text-secondary font-bold uppercase tracking-widest">Awaiting Arena Protocols...</p>
                </div>
            )}
          </div>

          <footer className="mt-12 p-8 rounded-[2rem] bg-gold/5 border border-gold/10">
              <div className="flex items-center gap-4 mb-4">
                  <Sparkles className="text-gold" />
                  <h4 className="font-black uppercase tracking-tighter">Arena Pro-Tip</h4>
              </div>
              <p className="text-sm text-text-secondary">
                  Renaming card types to higher values or custom themes (like "Emerald" or "Titanium") can increase the tactical excitement for your Legends. Note that these changes will apply to **all new matches** started after you click Update.
              </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
