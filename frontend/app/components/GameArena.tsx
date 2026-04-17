"use client"

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, Trophy, Loader2, Sparkles, User as UserIcon } from 'lucide-react';

interface GameArenaProps {
  groupId: number;
  currentUserId: number;
  groupMembers: any[];
  onClose: () => void;
}

const THEMES = [
  { name: 'Gold Sun', from: 'from-gold', via: 'via-yellow-500', to: 'to-amber-500', glow: 'shadow-gold/20' },
  { name: 'Lunar Silver', from: 'from-silver', via: 'via-zinc-300', to: 'to-zinc-500', glow: 'shadow-silver/20' },
  { name: 'Crimson Copper', from: 'from-orange-400', via: 'via-red-500', to: 'to-rose-700', glow: 'shadow-red-500/20' },
  { name: 'Sapphire Platinum', from: 'from-blue-400', via: 'via-cyan-500', to: 'to-indigo-600', glow: 'shadow-blue-500/20' },
];

export default function GameArena({ groupId, currentUserId, groupMembers, onClose }: GameArenaProps) {
  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGameState();
  }, [groupId]);

  const fetchGameState = async () => {
    try {
      const { default: api } = await import('@/app/services/apiService');
      const response = await api.get(`/games/state/${groupId}`);
      setGameState(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-gold" size={40} />
      </div>
    );
  }

  if (!gameState || gameState.status === 'inactive') {
      return (
          <div className="flex h-screen items-center justify-center bg-background p-8 text-center">
              <div>
                  <Shield className="mx-auto mb-6 text-zinc-800" size={60} />
                  <h2 className="text-2xl font-bold">No Active Match</h2>
                  <p className="mt-2 text-text-secondary">Start a game from the squad management menu.</p>
                  <button onClick={onClose} className="mt-8 rounded-2xl bg-gold px-8 py-3 font-bold text-black">Return to HQ</button>
              </div>
          </div>
      );
  }

  const myCards = gameState.cards.filter((c: any) => c.user_id === currentUserId);
  const otherPlayers = groupMembers.filter((m: any) => m.id !== currentUserId);

  // Group cards by user
  const playerGroups = groupMembers.map((member, idx) => {
    const cards = gameState.cards.filter((c: any) => c.user_id === member.id);
    return {
        ...member,
        cards,
        theme: THEMES[cards[0]?.theme_index % THEMES.length] || THEMES[0]
    };
  });

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background p-6 lg:p-12 overflow-hidden">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold shadow-lg shadow-gold/10 ring-1 ring-gold/20">
            <Trophy size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">ARENA <span className="gold-text">ACTIVATE</span></h1>
            <p className="text-sm text-text-secondary uppercase tracking-[0.2em] font-bold">Live Match • Group ID {groupId}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-2xl border border-border-primary bg-card px-6 py-3 font-bold transition-all hover:bg-white/5">
          Exit Arena
        </button>
      </header>

      <div className="flex-1 relative flex items-center justify-center">
        {/* Arena Center */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
           <Shield size={400} className="text-gold" />
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-6xl relative z-10">
          {playerGroups.map((player) => (
            <motion.div 
              key={player.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`glass rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col items-center ${player.isActive ? 'ring-2 ring-gold' : ''}`}
            >
              <div className={`absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${player.theme.from} ${player.theme.to} opacity-10 blur-3xl`} />
              
              <div className="mb-6 flex items-center gap-4 self-start">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${player.theme.from} ${player.theme.to} text-black font-black`}>
                    {player.username[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">{player.full_name}</h3>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${player.id === currentUserId ? 'text-gold' : 'text-text-secondary'}`}>
                        {player.id === currentUserId ? 'YOU (THE LEGEND)' : 'OPPONENT ALLY'}
                    </span>
                  </div>
              </div>

              {/* Cards Row */}
              <div className="flex gap-4 items-center justify-center w-full">
                {player.cards.map((card: any, cardIdx: number) => (
                    <motion.div
                      key={card.id}
                      initial={{ y: 200, rotate: -20, opacity: 0 }}
                      animate={{ y: 0, rotate: 0, opacity: 1 }}
                      transition={{ delay: 0.5 + (cardIdx * 0.1) }}
                      whileHover={{ scale: 1.05, y: -10 }}
                      className={`relative aspect-[2/3] w-24 rounded-2xl p-0.5 shadow-2xl ${player.theme.glow}`}
                    >
                      <div className={`h-full w-full rounded-[0.9rem] bg-gradient-to-br ${player.theme.from} ${player.theme.via} ${player.theme.to} p-[1px]`}>
                        <div className="h-full w-full rounded-[0.85rem] bg-background/90 backdrop-blur-3xl p-3 flex flex-col justify-between">
                            <span className="text-xs font-black opacity-50">{card.card_type}</span>
                            <div className="text-center">
                                <div className={`text-2xl font-black bg-gradient-to-br ${player.theme.from} ${player.theme.to} bg-clip-text text-transparent`}>
                                    {card.value}
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Shield size={12} className="opacity-30" />
                            </div>
                        </div>
                      </div>
                    </motion.div>
                ))}
              </div>

              {/* Status Footer */}
              <div className="mt-8 flex w-full items-center justify-between border-t border-white/5 pt-4">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-text-secondary">
                    <Sparkles size={12} className="text-gold" />
                    Squad Influence: {(player.id * 123) % 1000}
                 </div>
                 <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
