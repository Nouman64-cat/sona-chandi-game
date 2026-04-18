"use client"

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, Trophy, Loader2, Sparkles, LogOut, Swords } from 'lucide-react';

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
  const [playingCard, setPlayingCard] = useState<number | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  useEffect(() => {
    fetchGameState();
    const interval = setInterval(fetchGameState, 2000);
    return () => clearInterval(interval);
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

  const handlePlayCard = async () => {
    if (!selectedCardId || !gameState || Number(gameState.current_turn_user_id) !== Number(currentUserId)) return;
    
    const cardId = selectedCardId;
    setPlayingCard(cardId);
    try {
      const { default: api } = await import('@/app/services/apiService');
      await api.post(`/games/${gameState.game_id}/play?card_id=${cardId}&requestor_id=${currentUserId}`);
      setSelectedCardId(null);
      await fetchGameState();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Move failed.");
    } finally {
      setPlayingCard(null);
    }
  };

  const handleEndMatch = async () => {
    if (!window.confirm("Are you sure you want to abandon the match?")) return;
    try {
      const { default: api } = await import('@/app/services/apiService');
      await api.post(`/games/${gameState.game_id}/end`);
      onClose();
    } catch (err: any) {
      console.error(err);
    }
  };

  if (loading && !gameState) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-gold">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  if (!gameState || gameState.status === 'inactive') {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-8 text-center text-text-primary">
        <div>
          <Shield className="mx-auto mb-6 text-zinc-800" size={60} />
          <h2 className="text-2xl font-bold">No Active Match</h2>
          <p className="mt-2 text-text-secondary">Start a game from the squad management menu.</p>
          <button onClick={onClose} className="mt-8 rounded-2xl bg-gold px-8 py-3 font-bold text-black">Return to HQ</button>
        </div>
      </div>
    );
  }

  const isMyTurn = gameState.current_turn_user_id && Number(gameState.current_turn_user_id) === Number(currentUserId);

  const playerGroups = groupMembers.map((member, idx) => {
    const cards = gameState.cards.filter((c: any) => Number(c.user_id) === Number(member.id));
    return {
      ...member,
      cards,
      isCurrentTurn: gameState.current_turn_user_id && Number(gameState.current_turn_user_id) === Number(member.id),
      theme: THEMES[idx % THEMES.length] || THEMES[0]
    };
  });

  const findRecipient = () => {
    const memberIds = groupMembers.map(m => Number(m.id)).sort((a,b) => a - b);
    const currentIdx = memberIds.indexOf(Number(currentUserId));
    const nextIdx = (currentIdx + 1) % memberIds.length;
    const targetId = memberIds[nextIdx];
    return groupMembers.find(m => Number(m.id) === Number(targetId))?.full_name || "Ally";
  };

  const winner = gameState.winner_id ? groupMembers.find(m => Number(m.id) === Number(gameState.winner_id)) : null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background p-6 lg:p-12 overflow-hidden text-text-primary">
      <AnimatePresence>
        {winner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[70] flex flex-col items-center justify-center bg-black/90 p-8 text-center backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              className="relative flex flex-col items-center"
            >
              <div className="mb-8 flex h-40 w-40 items-center justify-center rounded-3xl bg-gold/10 text-gold shadow-[0_0_100px_rgba(255,215,0,0.3)] ring-1 ring-gold/20">
                <Trophy size={80} className="animate-bounce" />
              </div>
              <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-2">LEGEND CONQUERED</h2>
              <p className="text-2xl font-bold gold-text mb-8">{winner.full_name} has claimed the victory!</p>
              <button 
                onClick={onClose}
                className="rounded-2xl bg-gold px-12 py-4 text-xl font-black text-black transition-all hover:scale-[1.05] shadow-2xl shadow-gold/20"
              >
                DISMISS ARENA
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold shadow-lg shadow-gold/10 ring-1 ring-gold/20">
            <Trophy size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">
              {gameState.status === 'finished' ? 'Match Finalized' : 'ARENA ACTIVE'}
            </h1>
            <p className="text-xs text-text-secondary uppercase tracking-[0.2em] font-bold">
               {gameState.status === 'finished' ? 'Victory Claimed' : 'Live Battle Progression'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleEndMatch}
            className="group flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-3 font-bold text-red-500 transition-all hover:bg-red-500/10 active:scale-95"
          >
            <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
            End Match
          </button>
          <button onClick={onClose} className="rounded-2xl border border-border-primary bg-card px-6 py-3 font-bold transition-all hover:bg-white/5">
            Exit Arena
          </button>
        </div>
      </header>

      <div className="flex-1 relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
           <Shield size={400} className="text-gold" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-7xl relative z-10">
          {playerGroups.map((player) => (
            <motion.div 
              key={player.id}
              className={`glass rounded-[2rem] p-6 relative overflow-hidden flex flex-col items-center border-2 transition-all duration-500 ${player.isCurrentTurn ? 'bg-gold/5 border-gold/40 shadow-[0_0_50px_rgba(255,215,0,0.1)]' : 'border-white/5'}`}
            >
              <div className={`absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${player.theme.from} ${player.theme.to} opacity-10 blur-3xl`} />
              
              <div className="mb-6 flex items-center gap-4 self-start">
                  <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${player.theme.from} ${player.theme.to} text-black font-black uppercase`}>
                    {player.username?.[0] || 'U'}
                    {player.isCurrentTurn && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-gold"></span>
                        </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">{player.full_name}</h3>
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${Number(player.id) === Number(currentUserId) ? 'text-gold' : 'text-text-secondary'}`}>
                            {Number(player.id) === Number(currentUserId) ? 'YOU' : 'ALLY'}
                        </span>
                        {player.isCurrentTurn && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-gold italic flex items-center gap-1">
                                <Sparkles size={10} /> ACTING...
                            </span>
                        )}
                    </div>
                  </div>
              </div>

              <div className="flex gap-4 items-center justify-center w-full min-h-[160px]">
                {player.cards.map((card: any) => (
                    <motion.div
                      key={card.id}
                      layout
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      whileHover={Number(player.id) === Number(currentUserId) && isMyTurn ? { scale: 1.05, y: -10 } : {}}
                      onClick={() => Number(player.id) === Number(currentUserId) && isMyTurn && setSelectedCardId(card.id)}
                      className={`relative aspect-[2/3] w-24 rounded-2xl p-0.5 shadow-2xl transition-all ${player.theme.glow} ${playingCard === card.id ? 'opacity-50 scale-95' : ''} ${selectedCardId === card.id ? 'ring-4 ring-gold' : ''} ${Number(player.id) === Number(currentUserId) && isMyTurn ? 'cursor-pointer' : ''}`}
                    >
                      <div className={`h-full w-full rounded-[0.9rem] bg-gradient-to-br ${player.theme.from} ${player.theme.via} ${player.theme.to} p-[1px]`}>
                        <div className={`h-full w-full rounded-[0.85rem] ${Number(player.id) === Number(currentUserId) ? 'bg-background/90' : 'bg-background/80 shadow-inner'} backdrop-blur-3xl p-3 flex flex-col justify-between overflow-hidden`}>
                            {Number(player.id) === Number(currentUserId) ? (
                                <>
                                    <span className="text-[10px] font-black opacity-50 uppercase tracking-tighter">{card.card_type}</span>
                                    <div className="text-center">
                                        <div className={`text-xl font-black bg-gradient-to-br ${player.theme.from} ${player.theme.to} bg-clip-text text-transparent`}>
                                            {card.value}
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Shield size={10} className="text-gold/20" />
                                    </div>
                                </>
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <Shield size={24} className="text-gold opacity-10 animate-pulse" />
                                </div>
                            )}
                        </div>
                      </div>
                    </motion.div>
                ))}
              </div>

              <div className="mt-8 flex w-full items-center justify-between border-t border-white/5 pt-4">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-text-secondary">
                    {player.cards.length} Cards Held
                 </div>
                 {player.isCurrentTurn ? (
                     <div className="h-2 w-2 rounded-full bg-gold animate-pulse shadow-[0_0_100px_rgba(255,215,0,0.5)]" />
                 ) : (
                     <div className="h-2 w-2 rounded-full bg-white/10" />
                 )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {isMyTurn && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-12 left-1/2 z-[80] flex -translate-x-1/2 flex-col items-center gap-4"
          >
             <div className="flex items-center gap-6 rounded-[2rem] bg-black/80 p-4 px-8 backdrop-blur-2xl border border-white/10 shadow-2xl">
                {!selectedCardId ? (
                    <div className="flex items-center gap-3 text-sm font-black text-gold uppercase tracking-widest italic text-center">
                        <Sparkles className="hidden md:block animate-pulse" />
                        {playerGroups.find(p => Number(p.id) === Number(currentUserId))?.cards.length === 4 
                            ? "INITIATE THE BATTLE... PASS A CARD" 
                            : "YOU HOLD THE INFLUENCE... SELECT TO PASS"}
                    </div>
                ) : (
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary tracking-tighter">Target Recipient</span>
                            <span className="text-lg font-black text-white">{findRecipient()}</span>
                        </div>
                        <button 
                          onClick={handlePlayCard}
                          disabled={!!playingCard}
                          className="flex items-center gap-2 rounded-2xl bg-gold px-8 py-3 text-sm font-black text-black shadow-lg shadow-gold/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                            {playingCard ? <Loader2 className="animate-spin" /> : <><Shield size={18} /> CONFIRM PASS</>}
                        </button>
                    </div>
                )}
             </div>
          </motion.div>
      )}

      {!isMyTurn && gameState.status === 'active' && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-12 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-white/5 p-4 px-8 backdrop-blur-xl border border-white/5"
          >
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-text-secondary">
                  <Loader2 className="animate-spin" size={14} />
                  Waiting for {playerGroups.find(p => p.isCurrentTurn)?.full_name || "Legend"} to act...
              </div>
          </motion.div>
      )}

      <div className="fixed bottom-4 right-4 text-[8px] font-mono text-white/10 flex gap-2">
          <span>GAME_ID: {gameState.game_id}</span>
          <span>TURN: {gameState.current_turn_user_id}</span>
          <span>SELF: {currentUserId}</span>
      </div>
    </div>
  );
}
