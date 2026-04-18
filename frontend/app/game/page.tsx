"use client"

import React, { useEffect, useState, Suspense } from 'react';
import Navbar from '@/app/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Shield, Loader2, Sparkles, Trophy, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/app/services/apiService';

function GameContent() {
  const router = useRouter();
  const [activeMatches, setActiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(Number(payload.sub));
    }
    fetchActiveMatches();
  }, []);

  const fetchActiveMatches = async () => {
    try {
      // Fetch all groups the user is in and check for active games
      const groupsResp = await api.get('/groups/');
      const matches: any = [];
      
      for (const group of groupsResp.data) {
        try {
          const gameResp = await api.get(`/games/state/${group.id}`);
          if (gameResp.data && gameResp.data.status === 'active') {
            // Also fetch members for this group to pass to Arena later
            const membersResp = await api.get(`/groups/${group.id}/members`);
            matches.push({
              ...group,
              gameId: gameResp.data.game_id,
              members: membersResp.data
            });
          }
        } catch (e) {
            // No game for this group
        }
      }
      setActiveMatches(matches);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-background text-text-primary">
      <Navbar />
      
      <main className="min-h-screen flex-1 p-6 pb-24 md:pb-6 md:pl-24 lg:pl-72">
        <div className="mx-auto max-w-4xl pt-8">
          <header className="mb-12">
            <h1 className="text-4xl font-bold">Live <span className="gold-text">Arena</span></h1>
            <p className="mt-2 text-text-secondary italic">Enter active matches and prove your legend.</p>
          </header>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="animate-spin text-gold" size={40} />
            </div>
          ) : (
            <div className="space-y-6">
              {activeMatches.map((match: any) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass flex flex-col md:flex-row md:items-center justify-between rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden group border border-gold/10 hover:border-gold/30 transition-all gap-6"
                >
                  <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gold/5 blur-3xl group-hover:bg-gold/10 transition-all" />
                  
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl md:rounded-3xl bg-gold/10 text-gold shadow-low ring-1 ring-gold/20 flex-shrink-0">
                      <Swords size={28} className="md:w-8 md:h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold truncate max-w-[150px] md:max-w-none">{match.name}</h3>
                      <div className="mt-1 md:mt-2 flex items-center gap-3 md:gap-4 flex-wrap">
                        <span className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest text-text-secondary whitespace-nowrap">
                          <Shield size={12} className="text-silver md:w-[14px]" /> 4 Legends Active
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[9px] md:text-[10px] font-bold text-green-500 uppercase tracking-widest">Live Now</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => router.push(`/game/${match.id}`)}
                    className="flex items-center justify-center gap-2 rounded-xl md:rounded-2xl bg-gold px-6 md:px-8 py-3 md:py-4 font-black text-black transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-gold/20 w-full md:w-auto relative z-10"
                  >
                    Enter Match
                    <ChevronRight size={18} className="md:w-5 md:h-5" />
                  </button>
                </motion.div>
              ))}

              {activeMatches.length === 0 && (
                <div className="rounded-[2.5rem] border border-dashed border-border-primary p-20 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 text-text-secondary">
                    <Trophy size={40} className="opacity-20" />
                  </div>
                  <h3 className="text-xl font-bold">No High-Stakes Matches Found</h3>
                  <p className="mt-2 text-text-secondary">Start a new game with your squad in the Groups section.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-gold" size={40} />
      </div>
    }>
      <GameContent />
    </Suspense>
  );
}
