"use client"

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Users, Trophy, Loader2, Sparkles, LogOut, Swords, Star, RefreshCw,
  Crown, Zap, Flame, Anchor, Target, Gem, Coins, CircleDollarSign, Award, Component
} from 'lucide-react';
import { useTheme } from '@/app/components/ThemeProvider';
import Confetti from './Confetti';

const IconRenderer = ({ name, size = 16, className = "", style = {} }: { name: string, size?: number, className?: string, style?: any }) => {
  const icons: Record<string, any> = {
    Shield, Swords, Crown, Zap, Flame, Trophy, Target, Gem, Anchor, Sparkles,
    Coins, CircleDollarSign, Award, Star, Component
  };
  const IconComponent = icons[name] || Shield;
  return <IconComponent size={size} className={className} style={style} />;
};

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
  const { gender, theme } = useTheme();
  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playingCard, setPlayingCard] = useState<number | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const lastResultsCountRef = useRef(0);
  const initializedRef = useRef(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newWinner, setNewWinner] = useState<any>(null);
  const [isInactive, setIsInactive] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 Minutes

  // Roulette selection state
  const [showRoulette, setShowRoulette] = useState(false);
  const [rouletteHighlight, setRouletteHighlight] = useState<number>(0); // index into groupMembers
  const [rouletteWinner, setRouletteWinner] = useState<any>(null); // member object
  const seenGameIdsRef = useRef<Set<number>>(new Set());

  // Activity Sensor Protocol
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (isInactive) {
          setIsInactive(false);
          fetchGameState(); // Immediate tactical re-sync on wake
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [isInactive]);

  useEffect(() => {
    fetchGameState();
    
    const interval = setInterval(() => {
        if (Date.now() - lastActivityRef.current > INACTIVITY_TIMEOUT) {
            if (!isInactive) setIsInactive(true);
            return;
        }
        fetchGameState();
    }, 2000);
    
    // Arena Heartbeat Loop (Aggressive Sync)
    const hbInterval = setInterval(() => {
        if (Date.now() - lastActivityRef.current > INACTIVITY_TIMEOUT) return;
        sendHeartbeat();
    }, 3000);
    
    sendHeartbeat(); // Initial pulse
    
    return () => {
        clearInterval(interval);
        clearInterval(hbInterval);
    };
  }, [groupId, isInactive]);

  const sendHeartbeat = async () => {
      try {
          const { default: api } = await import('@/app/services/apiService');
          await api.post(`/groups/${groupId}/heartbeat`);
      } catch (err) {
          console.error("Heartbeat sync failed:", err);
      }
  };

  const fetchGameState = async () => {
    try {
      const { default: api } = await import('@/app/services/apiService');
      const response = await api.get(`/games/state/${groupId}`);
      const newState = response.data;
      
      const newResults = newState.results || [];
      
      if (!initializedRef.current) {
        lastResultsCountRef.current = newResults.length;
        initializedRef.current = true;
      } else if (newResults.length > lastResultsCountRef.current) {
        const newest = newResults.sort((a: any, b: any) => b.created_at - a.created_at)[0];
        if (newest) {
            const member = groupMembers.find(m => Number(m.id) === Number(newest.user_id));
            setNewWinner({ ...newest, name: member?.full_name || "A Legend" });
            setShowConfetti(true);
            setTimeout(() => {
                setShowConfetti(false);
                setNewWinner(null);
            }, 5000);
        }
        lastResultsCountRef.current = newResults.length;
      }

      setGameState(newState);

      // --- First Legend Roulette ---
      // Trigger only for fresh games (created within 20s) that we haven't shown yet
      const gameId = newState.game_id;
      const createdAt = newState.created_at;
      const now = Math.floor(Date.now() / 1000);
      const isFreshGame = createdAt && (now - createdAt) < 20;
      if (isFreshGame && gameId && !seenGameIdsRef.current.has(gameId) && newState.status === 'active') {
          seenGameIdsRef.current.add(gameId);
          const firstUserId = newState.current_turn_user_id;
          const winnerMember = groupMembers.find(m => Number(m.id) === Number(firstUserId));
          if (winnerMember && groupMembers.length > 0) {
              setShowRoulette(true);
              setRouletteWinner(null);

              // Build a roulette schedule: fast cycling → slow → land
              const totalDuration = 3200; // ms
              const schedule: number[] = [];
              // Phase 1: 500ms, fast (80ms steps)
              let elapsed = 0;
              let step = 80;
              while (elapsed < 1200) { schedule.push(step); elapsed += step; }
              // Phase 2: slow down
              for (const s of [120, 160, 200, 260, 320, 400, 500]) {
                  schedule.push(s); elapsed += s;
                  if (elapsed >= totalDuration) break;
              }

              const winnerIndex = groupMembers.findIndex(m => Number(m.id) === Number(firstUserId));
              let currentIdx = 0;
              let i = 0;

              const runStep = () => {
                  if (i < schedule.length - 1) {
                      currentIdx = (currentIdx + 1) % groupMembers.length;
                      setRouletteHighlight(currentIdx);
                      i++;
                      setTimeout(runStep, schedule[i]);
                  } else {
                      // Land on the actual winner
                      setRouletteHighlight(winnerIndex);
                      setRouletteWinner(winnerMember);
                      // Auto-dismiss after 2.5s
                      setTimeout(() => setShowRoulette(false), 2500);
                  }
              };

              setTimeout(runStep, schedule[0]);
          }
      }

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
    if (!window.confirm("Are you sure you want to officially end the match for everyone?")) return;
    try {
      const { default: api } = await import('@/app/services/apiService');
      await api.post(`/games/${gameState.game_id}/end?requestor_id=${currentUserId}`);
      onClose();
    } catch (err: any) {
       alert(err.response?.data?.detail || "Termination failed.");
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
    // Use the game's stored shuffled turn order (matches backend play_turn logic exactly)
    const finishedIds = new Set((gameState.results || []).map((r: any) => Number(r.user_id)));

    let memberIds: number[];
    if (gameState.turn_order) {
      memberIds = gameState.turn_order.split(',').map(Number);
    } else {
      // Fallback: alphabetical by id (legacy games)
      memberIds = groupMembers.map((m: any) => Number(m.id)).sort((a: number, b: number) => a - b);
    }

    const currentIdx = memberIds.indexOf(Number(currentUserId));
    if (currentIdx === -1) return "Ally";

    // Walk forward in the shuffled order, skipping finished players
    let nextIdx = (currentIdx + 1) % memberIds.length;
    while (finishedIds.has(memberIds[nextIdx]) && nextIdx !== currentIdx) {
      nextIdx = (nextIdx + 1) % memberIds.length;
    }

    const targetId = memberIds[nextIdx];
    return groupMembers.find((m: any) => Number(m.id) === targetId)?.full_name || "Ally";
  };

  const results = gameState.results || [];
  const iHaveWon = results.some((r: any) => Number(r.user_id) === Number(currentUserId));
  // Spectator mode: current user has finished (secured any position)
  const iHaveFinished = results.some((r: any) => Number(r.user_id) === Number(currentUserId));

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background md:p-6 lg:p-12 overflow-y-auto text-text-primary">
      <AnimatePresence>
        {showConfetti && <Confetti />}
        {newWinner && (
            <motion.div
                initial={{ y: -100, opacity: 0, scale: 0.5 }}
                animate={{ y: 50, opacity: 1, scale: 1 }}
                exit={{ y: -100, opacity: 0, scale: 0.5 }}
                className="fixed top-0 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-4 rounded-3xl bg-gold p-1 pr-6 shadow-[0_0_50px_rgba(255,215,0,0.5)] border-4 border-black/10"
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-gold">
                    <Trophy size={24} />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/60 leading-none mb-1">Victory Claimed!</span>
                    <span className="text-sm font-black text-black">
                        {newWinner.name} SECURED {newWinner.position === 1 ? "CHAMPION" : `${newWinner.position}${newWinner.position === 2 ? 'ND' : newWinner.position === 3 ? 'RD' : 'TH'}`} POSITION!
                    </span>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameState.status === 'finished' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[70] flex flex-col items-center justify-center bg-black/95 p-4 md:p-8 text-center backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="relative flex flex-col items-center w-full max-w-3xl px-4"
            >
              <div className="mb-8 flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-3xl bg-gold/10 text-gold shadow-[0_0_100px_rgba(255,215,0,0.3)] ring-1 ring-gold/20">
                <Trophy size={40} className="md:w-12 md:h-12 animate-bounce" />
              </div>
              <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase mb-2">ARENA LEADERBOARD</h2>
              <p className="text-text-secondary uppercase tracking-[0.3em] font-bold text-[10px] mb-8">Official Match Standings</p>
              
              <div className="w-full space-y-3 mb-10 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {[...(gameState.results || [])].sort((a: any, b: any) => a.position - b.position).map((res: any, idx: number) => {
                      const member = groupMembers.find(m => Number(m.id) === Number(res.user_id));
                      const isChampion = res.position === 1;
                      
                      return (
                          <motion.div 
                            key={res.user_id}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`flex items-center justify-between p-4 md:p-6 rounded-[1.5rem] border ${isChampion ? 'bg-gold/10 border-gold shadow-lg shadow-gold/5' : 'bg-white/5 border-white/5'}`}
                          >
                              <div className="flex items-center gap-4 md:gap-6">
                                  <div className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl font-black text-sm md:text-base ${isChampion ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'bg-white/10 text-white border border-white/10'}`}>
                                      #{res.position}
                                  </div>
                                  <div className="text-left">
                                      <div className={`text-base md:text-xl font-black ${isChampion ? 'text-gold' : 'text-white'}`}>{member?.full_name || "Unknown Legend"}</div>
                                      <div className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">@{member?.username || "unknown"}</div>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="text-sm font-black text-text-secondary uppercase tracking-widest mb-0.5">Scored</div>
                                  <div className={`text-xl md:text-2xl font-black ${isChampion ? 'text-gold' : 'text-white'}`}>{res.points} <span className="text-xs opacity-50">PTS</span></div>
                              </div>
                          </motion.div>
                      );
                  })}
              </div>

              <button 
                onClick={onClose}
                className="w-full md:w-auto rounded-2xl bg-gold px-12 py-4 text-xl font-black text-black transition-all hover:scale-[1.05] shadow-2xl shadow-gold/20"
              >
                RETURN TO HQ
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-6 flex flex-col gap-4 p-4 md:mb-8 md:flex-row md:items-center md:justify-between md:p-0">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold shadow-lg shadow-gold/10 ring-1 ring-gold/20">
            <Trophy size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black italic tracking-tighter uppercase">
              {gameState.status === 'finished' ? 'Match Finalized' : 'ARENA ACTIVE'}
            </h1>
            <p className="text-[10px] text-text-secondary uppercase tracking-[0.2em] font-bold">
               {gameState.status === 'finished' ? 'Victory Claimed' : 'Live Battle Progression'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {Number(currentUserId) === Number(gameState?.group_creator_id) && (
              <button 
                onClick={handleEndMatch}
                className="flex-1 md:flex-none group flex items-center justify-center gap-2 rounded-xl md:rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-2 md:px-6 md:py-3 text-sm md:text-base font-bold text-red-500 transition-all hover:bg-red-500/10 active:scale-95"
              >
                <LogOut size={16} className="md:w-[18px] transition-transform group-hover:-translate-x-1" />
                End Match
              </button>
          )}
          <button onClick={onClose} className="flex-1 md:flex-none rounded-xl md:rounded-2xl border border-border-primary bg-card px-4 py-2 md:px-6 md:py-3 text-sm md:text-base font-bold transition-all hover:bg-white/5">
            Exit Arena
          </button>
        </div>
      </header>

      <div className="flex-1 relative flex flex-col items-center justify-start md:justify-center p-4 md:p-0 pb-32">
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none hidden md:flex">
           <Shield size={400} className="text-gold" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 w-full max-w-7xl relative z-10">
          {playerGroups.map((player) => (
            <motion.div 
              key={player.id}
              initial={player.isCurrentTurn ? { borderColor: "var(--gold)" } : {}}
              animate={player.isCurrentTurn ? { 
                boxShadow: [
                  "0 0 20px 4px var(--gender-glow)",
                  "0 0 40px 8px var(--gender-glow)",
                  "0 0 20px 4px var(--gender-glow)"
                ]
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className={`glass rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 relative overflow-hidden flex flex-col items-center transition-all duration-500 border-[3px] ${player.isCurrentTurn ? 'bg-gold/10 border-gold shadow-[0_0_60px_var(--gender-glow)] scale-[1.02]' : 'border-white/5 opacity-80'}`}
            >
              {player.isCurrentTurn && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              )}
              
              <div className={`absolute -right-16 -top-16 h-32 w-32 md:h-48 md:w-48 rounded-full bg-gradient-to-br ${player.theme.from} ${player.theme.to} ${player.isCurrentTurn ? 'opacity-30' : 'opacity-10'} blur-2xl md:blur-3xl`} />
              
              <div className="mb-4 md:mb-6 flex items-center gap-3 md:gap-4 self-start relative z-10">
                  <div className={`relative flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl bg-gradient-to-br ${player.theme.from} ${player.theme.to} text-black text-sm md:text-base font-black uppercase shadow-lg ${player.isCurrentTurn ? 'ring-4 ring-gold/40 shadow-[0_0_15px_var(--gender-glow)]' : ''}`}>
                    {player.username?.[0] || 'U'}
                    {(() => {
                        const res = results.find((r: any) => Number(r.user_id) === Number(player.id));
                        if (!res) return null;
                        return (
                            <div className="absolute -left-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-gold shadow-lg border-2 border-background z-20 text-[10px] font-black">
                                #{res.position}
                            </div>
                        );
                    })()}
                    {player.isCurrentTurn && (
                        <span className="absolute -right-2 -top-2 flex h-4 w-4 md:h-5 md:w-5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 md:h-5 md:w-5 bg-gold border-2 border-background"></span>
                        </span>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-base md:text-lg font-black tracking-tight ${player.isCurrentTurn ? 'text-gold' : ''}`}>{player.full_name}</h3>
                    <div className="flex items-center gap-2">
                        <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${Number(player.id) === Number(currentUserId) ? 'text-gold' : 'text-text-secondary'}`}>
                            {Number(player.id) === Number(currentUserId)
                              ? (iHaveFinished ? 'SPECTATING' : 'YOU')
                              : 'ALLY'}
                        </span>
                        {(iHaveFinished && Number(player.id) !== Number(currentUserId)) || (iHaveFinished && Number(player.id) === Number(currentUserId)) ? (
                            <span className="text-[9px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                                👁 VISIBLE
                            </span>
                        ) : null}
                        {player.isCurrentTurn && (
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gold italic flex items-center gap-1 bg-gold/10 px-2 py-0.5 rounded-full border border-gold/20">
                                <Sparkles size={8} /> CURRENT TURN
                            </span>
                        )}
                    </div>
                  </div>
              </div>

              <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-center w-full min-h-[120px] md:min-h-[160px] relative z-10">
                <AnimatePresence>
                    {(Number(player.id) !== Number(currentUserId)) && (!gameState.player_presence || (!gameState.player_presence[String(player.id)] && !gameState.player_presence[player.id])) && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-x-0 inset-y-0 z-20 flex flex-col items-center justify-center rounded-[1rem] bg-black/60 backdrop-blur-md border border-white/10"
                        >
                            <Loader2 className="animate-spin text-gold mb-2" size={24} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-primary px-4 text-center">Syncing legend presence...</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {player.cards.map((card: any) => {
                    const cardType = (card.card_type || '').toUpperCase();
                    const isMe = Number(player.id) === Number(currentUserId);
                    // Spectator sees ally cards face-up (they've already finished)
                    const isRevealed = isMe || iHaveFinished;
                    
                    // Use ONLY the admin-configured color from the DB.
                    const dbColor = card.color;
                    const isValidHex = dbColor && /^#([0-9A-Fa-f]{3,6})$/.test(dbColor);
                    const baseColor = isValidHex ? dbColor : '#FFD700';
                    
                    const textColorClass = 'text-white font-black';
                    const allyIconColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.2)';

                    return (
                        <div key={card.id} className="relative">
                            <AnimatePresence>
                                {/* Selection Arrow Removed */}
                            </AnimatePresence>
                            
                            <motion.div
                              layout
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              whileHover={isMe && isMyTurn ? { scale: 1.05, y: -5 } : {}}
                              onClick={() => {
                                  if (isMe && isMyTurn && card.id) {
                                      const cid = Number(card.id);
                                      setSelectedCardId(prev => (prev !== null && Number(prev) === cid) ? null : cid);
                                  }
                              }}
                              className={`relative aspect-[2/3] w-16 md:w-24 rounded-xl md:rounded-2xl p-0.5 shadow-xl border-2 transition-all ${playingCard === card.id ? 'opacity-50 scale-95' : ''} ${selectedCardId !== null && Number(selectedCardId) === Number(card.id) ? 'ring-2 md:ring-4' : ''} ${isMe && isMyTurn ? 'cursor-pointer' : ''}`}
                              style={{ 
                                  // Selection ring uses the card's own DB color — not var(--gold)
                                  ...(selectedCardId !== null && Number(selectedCardId) === Number(card.id)
                                    ? { ['--tw-ring-color' as any]: baseColor }
                                    : {}),
                                  boxShadow: selectedCardId !== null && Number(selectedCardId) === Number(card.id)
                                      ? `0 0 40px ${baseColor}CC`
                                      : results.some((r: any) => Number(r.user_id) === Number(player.id)) ? `0 0 30px ${baseColor}` : isRevealed
                                      ? `0 0 15px ${baseColor}99`
                                      : theme === 'dark' ? `0 0 8px rgba(255,255,255,0.06)` : `0 0 8px rgba(0,0,0,0.06)`,
                                  borderColor: isRevealed ? baseColor : (theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
                                  backgroundColor: isRevealed ? baseColor : (theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                                  // Spectator ally cards: slightly dimmed to distinguish from own cards
                                  opacity: !isMe && iHaveFinished ? 0.85 : 1,
                              }}
                            >
                          <div className={`h-full w-full rounded-[0.55rem] md:rounded-[0.9rem] flex flex-col items-center justify-center relative overflow-hidden`}>
                            {/* Premium Shimmer Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                            
                            {isRevealed ? (
                                 <div className={`flex flex-col items-center justify-center gap-1 z-10 ${textColorClass} w-full h-full`}>
                                     {/* Center Icon */}
                                     <div className="mb-1 md:mb-2 transform scale-150 md:scale-[2] opacity-90">
                                         <IconRenderer name={card.icon} size={16} />
                                     </div>
                                     
                                     {/* Name below icon */}
                                     <div className="text-[9px] md:text-[11px] uppercase tracking-[0.2em] font-black opacity-80">
                                         {cardType}
                                     </div>

                                     {/* Amount in Bottom-Center */}
                                     <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2">
                                         <div className="text-[8px] md:text-xs tracking-widest font-black text-white uppercase">
                                             {card.value}
                                         </div>
                                     </div>
                                 </div>
                            ) : (
                                <div className="flex h-full w-full items-center justify-center z-10 opacity-10">
                                    <IconRenderer name="Shield" size={24} className="md:w-12 md:h-12 " style={{ color: allyIconColor }} />
                                </div>
                            )}
                          </div>
                            </motion.div>
                        </div>
                    );
                })}
              </div>

              <div className="mt-4 md:mt-8 flex w-full items-center justify-between border-t border-white/5 pt-3 md:pt-4">
                 <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-tighter text-text-secondary">
                    {player.cards.length} Cards Held
                 </div>
                 {player.isCurrentTurn ? (
                     <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-gold animate-pulse shadow-[0_0_100px_rgba(255,215,0,0.5)]" />
                 ) : (
                     <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-white/10" />
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
            className="fixed bottom-6 md:bottom-12 left-1/2 z-[80] flex -translate-x-1/2 flex-col items-center gap-4 w-[95%] md:w-auto"
          >
             <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 rounded-2xl md:rounded-[2rem] bg-black/90 md:bg-black/80 p-3 md:p-4 md:px-8 backdrop-blur-2xl border border-white/10 shadow-2xl w-full">
                {!selectedCardId ? (
                    <div className="flex items-center gap-3 text-[10px] md:text-sm font-black text-gold uppercase tracking-widest italic text-center w-full justify-center">
                        <Sparkles className="hidden md:block animate-pulse" size={16} />
                        {playerGroups.find(p => Number(p.id) === Number(currentUserId))?.cards.length === 4 
                            ? "INITIATE BATTLE... PASS A CARD" 
                            : "YOU HOLD INFLUENCE... SELECT TO PASS"}
                    </div>
                ) : (
                    <div className="flex items-center justify-between md:justify-center gap-4 md:gap-8 w-full">
                        <div className="flex flex-col">
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-text-secondary tracking-tighter">Recipient</span>
                            <span className="text-sm md:text-lg font-black text-white truncate max-w-[120px] md:max-w-none">{findRecipient()}</span>
                        </div>
                        <button 
                          onClick={handlePlayCard}
                          disabled={!!playingCard}
                          className="flex items-center gap-2 rounded-xl md:rounded-2xl bg-gold px-4 md:px-8 py-2 md:py-3 text-[10px] md:text-sm font-black text-black shadow-lg shadow-gold/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 whitespace-nowrap"
                        >
                            {playingCard ? <Loader2 className="animate-spin" size={16} /> : <><Shield size={14} className="md:w-[18px]" /> CONFIRM PASS</>}
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
            className={`fixed bottom-6 md:bottom-12 left-1/2 z-[80] -translate-x-1/2 rounded-full p-2 md:p-4 px-4 md:px-8 backdrop-blur-xl border shadow-2xl transition-colors duration-500 ${
                theme === 'dark' 
                ? 'bg-black/60 border-white/10 text-white' 
                : 'bg-white/80 border-black/10 text-black'
            }`}
          >
              <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs font-black uppercase tracking-widest">
                  {iHaveWon ? (
                      <>
                        <Trophy size={14} className="text-gold animate-bounce" />
                        <span className="text-gold">Status: Victorious (Waiting for Runner Up...)</span>
                      </>
                  ) : (
                      <>
                        <Loader2 className="animate-spin md:w-[14px]" size={12} />
                        Waiting for {playerGroups.find(p => p.isCurrentTurn)?.full_name.split(' ')[0] || "Legend"}...
                      </>
                  )}
              </div>
          </motion.div>
      )}

      <div className="fixed bottom-2 right-2 md:bottom-4 md:right-4 text-[7px] md:text-[8px] font-mono text-white/10 flex gap-2">
          <span>G:{gameState.game_id}</span>
          <span className="hidden md:inline">TURN:{gameState.current_turn_user_id}</span>
          <span className="hidden md:inline">SELF:{currentUserId}</span>
      </div>

      <AnimatePresence>
        {isInactive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-2xl p-8 text-center"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 animate-pulse rounded-full bg-gold/20 blur-3xl" />
              <Shield className="relative mx-auto text-gold" size={80} />
            </div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2 text-white">Tactical Standby</h2>
            <p className="max-w-sm text-text-secondary uppercase tracking-[0.2em] font-bold text-[10px] mb-10 leading-loose">
              Sync suspended to preserve power and server resources. All tactical sensors are in standby.
            </p>
            <button 
              onClick={() => {
                  lastActivityRef.current = Date.now();
                  setIsInactive(false);
                  fetchGameState();
                  sendHeartbeat();
              }}
              className="group flex items-center gap-3 rounded-full bg-gold px-10 py-4 text-[11px] font-black text-black transition-all hover:scale-110 active:scale-95 shadow-[0_0_50px_rgba(255,215,0,0.3)] border-b-4 border-black/20"
            >
              <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
              RE-ENGAGE ARENA
            </button>
          </motion.div>
        )}

        {/* First Legend Roulette Overlay */}
        {showRoulette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-black/90 backdrop-blur-2xl"
          >
            {/* Header */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mb-8 text-center"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gold/60 mb-2">System Selecting</p>
              <h2 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase text-white">
                First Legend
              </h2>
            </motion.div>

            {/* Player Roulette Drum */}
            <div className="w-full max-w-sm space-y-2 px-6">
              {groupMembers.map((member: any, idx: number) => {
                const isHighlighted = idx === rouletteHighlight;
                const isWinner = rouletteWinner && Number(member.id) === Number(rouletteWinner.id);
                return (
                  <motion.div
                    key={member.id}
                    animate={{
                      scale: isHighlighted ? 1.06 : 1,
                      opacity: isHighlighted ? 1 : 0.25,
                      backgroundColor: isHighlighted
                        ? (isWinner ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.12)')
                        : 'rgba(255,255,255,0.03)',
                    }}
                    transition={{ duration: 0.1 }}
                    className="flex items-center gap-4 rounded-2xl border px-5 py-3"
                    style={{
                      borderColor: isHighlighted
                        ? (isWinner ? 'rgba(255,215,0,0.6)' : 'rgba(255,255,255,0.3)')
                        : 'rgba(255,255,255,0.05)',
                      boxShadow: isHighlighted && isWinner
                        ? '0 0 40px rgba(255,215,0,0.4)'
                        : isHighlighted
                        ? '0 0 20px rgba(255,255,255,0.15)'
                        : 'none',
                    }}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black uppercase ${isHighlighted && isWinner ? 'bg-gold text-black' : 'bg-white/10 text-white'}`}>
                      {member.username?.[0] || 'U'}
                    </div>
                    <span className={`text-sm font-black tracking-tight ${isHighlighted ? 'text-white' : 'text-white/40'}`}>
                      {member.full_name}
                    </span>
                    {isWinner && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto text-[9px] font-black uppercase tracking-widest bg-gold text-black px-2 py-0.5 rounded-full"
                      >
                        FIRST MOVE
                      </motion.span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Winner announcement */}
            {rouletteWinner && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-center"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold/60">Chosen by System</p>
                <p className="text-xl font-black text-gold mt-1">{rouletteWinner.full_name} goes first!</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

