"use client"

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import api from '@/app/services/apiService';
import GameArena from '@/app/components/GameArena';

export default function GameArenaPage({ params }: { params: Promise<{ groupId: string }> }) {
  const router = useRouter();
  const { groupId } = use(params);
  
  const [members, setMembers] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
        router.push('/auth/login');
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(Number(payload.sub));
        fetchMatchDetails();
    } catch (e) {
        router.push('/auth/login');
    }
  }, [groupId]);

  const fetchMatchDetails = async () => {
    try {
      // 1. Verify match is actually active
      const gameResp = await api.get(`/games/state/${groupId}`);
      if (!gameResp.data || gameResp.data.status !== 'active') {
          setError("This Arena has grown silent. The match is no longer active.");
          setLoading(false);
          return;
      }

      // 2. Fetch members for this group
      const membersResp = await api.get(`/groups/${groupId}/members`);
      setMembers(membersResp.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to synchronize with the Arena Intelligence.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
            <Loader2 className="animate-spin text-gold mx-auto mb-4" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold animate-pulse">Synchronizing Battle Grid...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-8 text-center">
        <div className="max-w-md">
          <p className="text-red-500 font-bold mb-6 italic">{error}</p>
          <button 
            onClick={() => router.push('/game')}
            className="rounded-2xl border border-gold/20 bg-gold/5 px-8 py-3 font-bold text-gold transition-all hover:bg-gold/10"
          >
            Return to Arena List
          </button>
        </div>
      </div>
    );
  }

  return (
    <GameArena 
      groupId={Number(groupId)} 
      currentUserId={currentUserId!} 
      groupMembers={members} 
      onClose={() => router.push('/game')} 
    />
  );
}
