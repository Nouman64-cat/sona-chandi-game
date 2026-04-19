"use client"

import React, { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Save, Shield, Swords, Sparkles, Loader2, AlertCircle, CheckCircle2,
  Crown, Zap, Flame, Trophy, Gem, Coins, CircleDollarSign, Award, Star, Component,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '@/app/services/apiService';

interface CardTemplate {
  id: number;
  card_type: string;
  name: string;
  value: number;
  color: string;
  icon: string;
}

const ICON_OPTIONS = [
  { name: 'Gem', icon: Gem },
  { name: 'Crown', icon: Crown },
  { name: 'Coins', icon: Coins },
  { name: 'CircleDollarSign', icon: CircleDollarSign },
  { name: 'Award', icon: Award },
  { name: 'Star', icon: Star },
  { name: 'Component', icon: Component },
  { name: 'Trophy', icon: Trophy },
  { name: 'Zap', icon: Zap },
  { name: 'Flame', icon: Flame },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Swords', icon: Swords },
  { name: 'Shield', icon: Shield },
];

const IconRenderer = ({ name, size = 16, className = "" }: { name: string, size?: number, className?: string }) => {
  const IconComponent = ICON_OPTIONS.find(opt => opt.name === name)?.icon || Shield;
  return <IconComponent size={size} className={className} />;
};

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
        card_type: card.card_type,
        name: card.name,
        value: Number(card.value),
        color: card.color,
        icon: card.icon
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

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const currentCard = cards[currentIndex];

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
    <div className="flex bg-background text-text-primary overflow-hidden">
      <Navbar />
      
      {/* Dynamic Background Aura */}
      <div 
        className="fixed inset-0 pointer-events-none transition-all duration-1000 opacity-20"
        style={{ 
          background: `radial-gradient(circle at 50% 50%, ${currentCard?.color || '#000'} 0%, transparent 70%)` 
        }}
      />

      <main className="min-h-screen flex-1 p-4 md:p-6 pb-24 md:pl-24 lg:pl-72 relative z-10">
        <div className="mx-auto max-w-6xl pt-8">
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gold/10 text-gold shadow-lg shadow-gold/10">
                    <Shield size={20} />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-gold dark:text-gold">Commander's Dashboard</h2>
            </div>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase mb-4">
              Arena <span className="silver-text">Intelligence</span>
            </h1>
            <div className="flex items-center justify-between">
                <p className="text-text-secondary italic">Redefine the economy of the Sona Chandi Arena.</p>
                {cards.length > 0 && (
                    <div className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/20 text-gold font-black text-xs uppercase tracking-widest">
                        Legend {currentIndex + 1} of {cards.length}
                    </div>
                )}
            </div>
          </header>

          <AnimatePresence mode="wait">
            {successMsg && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mb-8 flex items-center gap-3 rounded-2xl bg-green-500/10 p-4 text-green-600 dark:text-green-500 border border-green-500/20"
                >
                    <CheckCircle2 size={20} />
                    <span className="font-bold">{successMsg}</span>
                </motion.div>
            )}
            {error && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 flex items-center gap-3 rounded-2xl bg-red-500/10 p-4 text-red-600 dark:text-red-500 border border-red-500/20"
                >
                    <AlertCircle size={20} />
                    <span className="font-bold">{error}</span>
                </motion.div>
            )}
          </AnimatePresence>

          <div className="relative flex flex-col lg:flex-row items-center gap-8 lg:gap-12 min-h-[600px]">
            {/* Carousel Navigation - Left */}
            <button 
                onClick={prevCard}
                className="absolute left-[-20px] lg:left-[-70px] top-1/2 -translate-y-1/2 z-30 p-5 rounded-full bg-gold/5 border border-gold/20 text-gold shadow-lg shadow-black/20 hover:text-black hover:bg-gold hover:scale-110 hover:shadow-gold/20 transition-all active:scale-95 group"
            >
                <ChevronLeft size={36} className="group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* Carousel Navigation - Right */}
            <button 
                onClick={nextCard}
                className="absolute right-[-20px] lg:right-[-70px] top-1/2 -translate-y-1/2 z-30 p-5 rounded-full bg-gold/5 border border-gold/20 text-gold shadow-lg shadow-black/20 hover:text-black hover:bg-gold hover:scale-110 hover:shadow-gold/20 transition-all active:scale-95 group"
            >
                <ChevronRight size={36} className="group-hover:translate-x-1 transition-transform" />
            </button>

            {cards.length > 0 && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentCard.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 w-full"
                    >
                        {/* LEFT: HERO PREVIEW */}
                        <div className="flex-shrink-0 relative group">
                            <div className="absolute -inset-4 bg-gold/5 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div 
                                className="relative aspect-[2/3] w-56 md:w-72 rounded-[2.5rem] md:rounded-[3rem] p-1 shadow-2xl border-[3px] transition-all duration-700 hover:rotate-2"
                                style={{ 
                                    boxShadow: `0 0 40px ${currentCard.color}44`,
                                    borderColor: currentCard.color,
                                    backgroundColor: currentCard.color,
                                }}
                            >
                                <div className="h-full w-full rounded-[2.2rem] md:rounded-[2.7rem] flex flex-col items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                                    
                                    <div className="flex flex-col items-center justify-center gap-1 z-10 text-white font-black w-full h-full">
                                        {/* Center Icon */}
                                        <div className="mb-4 transform scale-[3] opacity-90">
                                            <IconRenderer name={currentCard.icon} size={24} />
                                        </div>
                                        
                                        {/* Name below icon */}
                                        <div className="text-[12px] md:text-[14px] uppercase tracking-[0.4em] font-black opacity-80 text-center mb-8">
                                            {currentCard.name}
                                        </div>

                                        {/* Amount in Bottom-Center */}
                                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
                                            <div className="text-[12px] md:text-xl tracking-[0.2em] font-black text-white uppercase opacity-40">
                                                {currentCard.value}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-8 flex justify-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gold/40 italic">Legend Template {currentCard.card_type}</span>
                            </div>
                        </div>

                        {/* RIGHT: CONTROL PANEL */}
                        <div className="flex-1 w-full max-w-xl">
                            <div className="glass rounded-[2.5rem] p-8 md:p-10 border border-white/5 space-y-8">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gold mb-4 block">Legend Identity</label>
                                    <input 
                                        type="text" 
                                        value={currentCard.name}
                                        onChange={(e) => updateLocalCard(currentCard.id, 'name', e.target.value)}
                                        className="w-full rounded-2xl bg-white/5 p-4 text-2xl font-black text-text-primary border border-white/10 focus:border-gold/40 focus:bg-white/10 outline-none transition-all"
                                        placeholder="Enter Legend Name"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-4 block">Strategic Value</label>
                                        <input 
                                            type="number" 
                                            value={currentCard.value}
                                            onChange={(e) => updateLocalCard(currentCard.id, 'value', e.target.value)}
                                            className="w-full rounded-2xl bg-white/5 p-4 text-xl font-black text-text-primary border border-white/10 focus:border-gold/40 focus:bg-white/10 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-4 block">Aura Hue</label>
                                        <div className="flex items-center gap-3">
                                            <div className="relative group/color shadow-lg shadow-black/20">
                                                <input 
                                                    type="color" 
                                                    value={currentCard.color}
                                                    onChange={(e) => updateLocalCard(currentCard.id, 'color', e.target.value)}
                                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                                />
                                                <div 
                                                    className="h-14 w-14 rounded-2xl border border-white/10 transition-all group-hover/color:scale-110"
                                                    style={{ backgroundColor: currentCard.color }}
                                                />
                                            </div>
                                            <input 
                                                type="text" 
                                                value={currentCard.color}
                                                onChange={(e) => updateLocalCard(currentCard.id, 'color', e.target.value)}
                                                className="flex-1 rounded-2xl bg-white/5 p-4 text-sm font-mono font-black text-text-primary border border-white/10 focus:border-gold/40 focus:bg-white/10 outline-none transition-all uppercase"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-4 block">Legendary Icon Selection</label>
                                    <div className="grid grid-cols-5 md:grid-cols-7 gap-3">
                                        {ICON_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.name}
                                                onClick={() => updateLocalCard(currentCard.id, 'icon', opt.name)}
                                                className={`flex aspect-square items-center justify-center rounded-2xl transition-all border ${currentCard.icon === opt.name ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20 scale-110' : 'bg-white/5 text-text-secondary border-white/5 hover:bg-white/10'}`}
                                                title={opt.name}
                                            >
                                                <opt.icon size={20} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleUpdate(currentCard)}
                                    disabled={saving === currentCard.id}
                                    className="w-full flex items-center justify-center gap-4 rounded-[2rem] bg-gold p-6 font-black text-black shadow-xl shadow-gold/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                >
                                    {saving === currentCard.id ? (
                                        <Loader2 className="animate-spin" size={24} />
                                    ) : (
                                        <>
                                            <Save size={24} />
                                            <span className="text-xl italic tracking-tighter uppercase">Commit Intelligence</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
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
