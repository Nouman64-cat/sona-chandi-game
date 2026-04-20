"use client"

import React, { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Loader2, Users, X, UserMinus, Settings, Trash2, LogOut, Swords } from 'lucide-react';
import api from '@/app/services/apiService';
import GameArena from '@/app/components/GameArena';

function GroupsContent() {
  const searchParams = useSearchParams();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(searchParams.get('create') === 'true');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Game specific state
  const [showArena, setShowArena] = useState(false);
  const [activeGameId, setActiveGameId] = useState<number | null>(null);
  const [startingGame, setStartingGame] = useState(false);
  const ignoredGameIdRef = useRef<number | null>(null);

  
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState(searchParams.get('code') || '');
  const [joiningByCode, setJoiningByCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const [pollInterval, setPollInterval] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(Number(payload.sub));
    }
    fetchGroups();
    fetchFriends();

    return () => {
        if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  // Poll for member status when modal is open
  useEffect(() => {
      if (selectedGroup) {
          const interval = setInterval(() => {
              refreshGroupData(selectedGroup.id);
          }, 3000);
          setPollInterval(interval);
          return () => clearInterval(interval);
      } else {
          if (pollInterval) clearInterval(pollInterval);
      }
  }, [selectedGroup]);

  const refreshGroupData = async (groupId: number) => {
      try {
          // Pulse 1: Tactical Member Sync with strict cache-busting
          const ts = new Date().getTime();
          const respMembers = await api.get(`/groups/${groupId}/members?t=${ts}`);
          setGroupMembers(respMembers.data);

          // Pulse 2: Combat Engagement Monitoring
          const respGame = await api.get(`/games/state/${groupId}?t=${ts}`);
          const gameStatus = respGame.data?.status;

          if (gameStatus === 'active') {
              // Match is live — auto-pull users into arena
              if (respGame.data.game_id !== ignoredGameIdRef.current) {
                  setActiveGameId(respGame.data.game_id);
                  setShowArena(true);
              }
          } else {
              // Match ended or no match — reset lobby to pre-match state
              setActiveGameId(null);
          }
      } catch (err) {
          console.error("Polling error:", err);
      }
  };

  const setReadyStatus = async (isReady: boolean) => {
      try {
          await api.post(`/groups/${selectedGroup.id}/ready?is_ready=${isReady}`);
          refreshGroupData(selectedGroup.id);
      } catch (err: any) {
          alert(err.response?.data?.detail || "Failed to update readiness.");
      }
  };

  useEffect(() => {
    if (searchParams.get('code')) {
      setShowJoinModal(true);
    }
  }, [searchParams]);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups/'); 
      setGroups(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFriends = async () => {
      try {
          const token = localStorage.getItem('token');
          if (!token) return;
          const payload = JSON.parse(atob(token.split('.')[1]));
          const response = await api.get(`/friends/${payload.sub}`);
          setFriends(response.data);
      } catch (err) {
          console.error(err);
      }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await api.post(`/groups/?creator_id=${currentUserId}`, {
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

  const handleJoinByCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inviteCodeInput) return;
    setJoiningByCode(true);
    try {
      const response = await api.post(`/groups/join/${inviteCodeInput}`);
      alert(response.data.message);
      setShowJoinModal(false);
      fetchGroups();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to join squad. The beacon might be offline.");
    } finally {
      setJoiningByCode(false);
    }
  };

  const handleRefreshBeacon = async () => {
    if (!window.confirm("Recalibrating the beacon will invalidate all existing invitation links. Proceed?")) return;
    try {
      const resp = await api.post(`/groups/${selectedGroup.id}/beacon/refresh`);
      setSelectedGroup({ ...selectedGroup, invite_code: resp.data.invite_code });
      alert("Alliance Beacon has been recalibrated.");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to refresh beacon.");
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?code=${selectedGroup.invite_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectGroup = async (group: any) => {
    setSelectedGroup(group);
    setGroupMembers([]);
    setActiveGameId(null);
    try {
      const respMembers = await api.get(`/groups/${group.id}/members`);
      setGroupMembers(respMembers.data);
      
      const respGame = await api.get(`/games/state/${group.id}`);
      // Only show 'Enter Arena' if there is a currently ACTIVE match
      if (respGame.data && respGame.data.status === 'active') {
          setActiveGameId(respGame.data.game_id);
      }
      // Finished / inactive matches → activeGameId stays null → lobby resets
    } catch (err) {
      console.error(err);
    }
  };

  const addMember = async (userId: number) => {
    try {
      await api.post(`/groups/${selectedGroup.id}/add-member/${userId}?admin_id=${currentUserId}`);
      refreshGroupData(selectedGroup.id);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to add member");
    }
  };

  const removeMember = async (userId: number) => {
    try {
       await api.post(`/groups/${selectedGroup.id}/leave/${userId}?requestor_id=${currentUserId}`);
       setGroupMembers(groupMembers.filter((m: any) => m.id !== userId));
    } catch (err: any) {
        alert(err.response?.data?.detail || "Failed to remove member");
    }
  };

  const deleteGroup = async () => {
      if (!window.confirm("Are you sure you want to disband this squad?")) return;
      try {
          await api.delete(`/groups/${selectedGroup.id}?admin_id=${currentUserId}`);
          setGroups(groups.filter((g: any) => g.id !== selectedGroup.id));
          setSelectedGroup(null);
      } catch (err: any) {
          alert(err.response?.data?.detail || "Failed to delete group");
      }
  };

  const handleStartGame = async () => {
      setStartingGame(true);
      try {
          const response = await api.post(`/games/start/${selectedGroup.id}?requestor_id=${currentUserId}`);
          setActiveGameId(response.data.id);
          setShowArena(true);
      } catch (err: any) {
          alert(err.response?.data?.detail || "Failed to start match.");
      } finally {
          setStartingGame(false);
      }
  };

  const isFullSquadReady = groupMembers.length > 0 && groupMembers.every((m: any) => m.is_ready);
  const currentUserMembership = (groupMembers as any[]).find((m: any) => m.id === currentUserId);


  return (
    <div className="flex bg-background text-text-primary">
      <Navbar />
      
      {showArena && selectedGroup && (
        <GameArena 
          groupId={selectedGroup.id} 
          currentUserId={currentUserId!} 
          groupMembers={groupMembers} 
          onClose={() => {
              ignoredGameIdRef.current = activeGameId;
              setShowArena(false);
          }}
        />
      )}
      
      <main className="min-h-screen flex-1 p-6 pb-24 md:pb-6 md:pl-24 lg:pl-72">
        <div className="mx-auto max-w-4xl pt-8">
          <header className="mb-12 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Your <span className="gold-text">Squads</span></h1>
              <p className="mt-2 text-text-secondary">Form alliances and dominate the leaderboards.</p>
            </div>
            <div className="flex gap-4">
                <button 
                    onClick={() => setShowJoinModal(true)}
                    className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-6 py-3 font-bold text-text-primary transition-all hover:bg-white/10 active:scale-95 shadow-lg"
                >
                    <Swords size={20} className="text-gold" />
                    Join via Beacon
                </button>
                <button 
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 rounded-2xl bg-gold px-6 py-3 font-bold text-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-gold/20"
                >
                    <Plus size={20} />
                    Create Squad
                </button>
            </div>
          </header>

          <AnimatePresence>
            {showCreate && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass mb-12 rounded-3xl p-8 border border-black/5 dark:border-white/5 shadow-2xl"
              >
                 <h3 className="mb-6 text-xl font-bold text-text-primary">New Squad Details</h3>
                 <form onSubmit={handleCreateGroup} className="space-y-4">
                    <input 
                      type="text" 
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Squad Name (e.g. Phoenix Elite)"
                      required
                      className="w-full rounded-2xl border border-border-primary bg-black/5 dark:bg-white/5 p-4 text-text-primary outline-none focus:border-gold/50"
                    />
                    <textarea 
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      placeholder="Short description..."
                      className="w-full rounded-2xl border border-border-primary bg-black/5 dark:bg-white/5 p-4 text-text-primary outline-none focus:border-gold/50"
                    />
                    <div className="flex gap-4">
                        <button type="submit" disabled={creating} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gold py-4 font-bold text-black hover:scale-[1.02] transition-transform">
                            {creating ? <Loader2 className="animate-spin" /> : 'Confirm Creation'}
                        </button>
                        <button type="button" onClick={() => setShowCreate(false)} className="rounded-2xl border border-border-primary px-8 font-bold text-text-secondary hover:text-text-primary transition-colors">
                            Cancel
                        </button>
                    </div>
                 </form>
              </motion.div>
            )}

            {showJoinModal && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-6 backdrop-blur-md"
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="glass max-w-md w-full rounded-[2rem] p-10 relative border border-gold/20"
                    >
                        <button onClick={() => setShowJoinModal(false)} className="absolute right-6 top-6 text-text-secondary hover:text-text-primary transition-colors">
                            <X size={24} />
                        </button>
                        <div className="text-center mb-10">
                            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gold/10 text-gold shadow-2xl shadow-gold/20">
                                <Swords size={48} />
                            </div>
                            <h2 className="text-3xl font-bold text-text-primary">Squad Pursuit</h2>
                            <p className="mt-2 text-text-secondary">Enter the Alliance Beacon code to join a legendary formation.</p>
                        </div>
                        <form onSubmit={handleJoinByCode} className="space-y-6">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={inviteCodeInput}
                                    onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                                    placeholder="ENTER BEACON CODE..."
                                    className="w-full rounded-2xl border-2 border-border-primary bg-white/5 py-5 text-center text-2xl font-black tracking-[0.5em] text-gold outline-none focus:border-gold"
                                    maxLength={10}
                                />
                            </div>
                            <button 
                                disabled={joiningByCode || !inviteCodeInput}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gold py-5 text-xl font-black uppercase text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale"
                            >
                                {joiningByCode ? <Loader2 className="animate-spin" /> : 'Engage Alliance'}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
          </AnimatePresence>

          <div className="grid gap-6 md:grid-cols-2">
            {groups.map((group: any) => (
                <div 
                    key={group.id} 
                    onClick={() => selectGroup(group)}
                    className="glass rounded-3xl p-8 relative overflow-hidden group cursor-pointer transition-all hover:border-gold/30 border border-black/5 dark:border-white/5 shadow-xl hover:shadow-gold/5"
                >
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gold/10 blur-2xl transition-all group-hover:bg-gold/20" />
                    <div className="flex items-center justify-between mb-4">
                        <Shield className="text-gold" size={32} />
                        {group.creator_id === currentUserId && (
                             <span className="rounded-lg bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gold border border-gold/20">Commander</span>
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-text-primary">{group.name}</h3>
                    <p className="mt-2 text-sm text-text-secondary line-clamp-2">{group.description || "No description provided."}</p>
                    <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-text-secondary">
                            <Users size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">Deploy Squad</span>
                        </div>
                    </div>
                </div>
            ))}
          </div>

          <AnimatePresence>
              {selectedGroup && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
                  >
                          <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="glass max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] p-8 border border-black/10 dark:border-white/10 shadow-3xl"
                          >
                               <div className="mb-8 flex items-center justify-between">
                                   <div className="flex items-center gap-4">
                                       <Shield className="text-gold" size={40} />
                                       <div>
                                           <h2 className="text-3xl font-bold text-text-primary">{selectedGroup.name}</h2>
                                           <p className="text-text-secondary">{selectedGroup.description || "Alliance active."}</p>
                                       </div>
                                   </div>
                                   <button onClick={() => setSelectedGroup(null)} className="rounded-full bg-black/5 dark:bg-white/5 p-2 text-text-secondary hover:text-text-primary transition-colors">
                                       <X size={24} />
                                   </button>
                               </div>

                          <div className="grid gap-8 lg:grid-cols-3">
                              {/* Left Column: Member List */}
                              <div className="lg:col-span-1 flex flex-col h-full">
                                  <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
                                      <Users size={16} />
                                      Squad Members
                                  </h4>
                                  <div className="space-y-3 flex-1 overflow-y-auto pr-2 max-h-96">
                                      {groupMembers.map((member: any) => (
                                          <div key={member.id} className="flex items-center justify-between rounded-2xl bg-white/5 p-4 relative overflow-hidden">
                                              {member.is_ready && <div className="absolute left-0 top-0 h-full w-1 bg-green-500" />}
                                              <div className="flex items-center gap-3">
                                                  <div className="h-8 w-8 rounded-lg bg-silver/10 flex items-center justify-center text-xs font-bold uppercase overflow-hidden">
                                                      {member.profile_picture_url ? <img src={member.profile_picture_url} className="h-full w-full object-cover" alt="" /> : member.username[0]}
                                                  </div>
                                                  <div className="flex flex-col">
                                                      <span className="font-medium text-sm">{member.full_name}</span>
                                                      <span className={`text-[10px] font-bold uppercase tracking-tighter ${member.is_ready ? 'text-green-500' : 'text-text-secondary'}`}>
                                                          {member.is_ready ? '● In Arena' : '○ Standing By'}
                                                      </span>
                                                  </div>
                                                  {member.id === selectedGroup.creator_id && <span className="text-[10px] text-gold uppercase ml-auto">Cmdr</span>}
                                              </div>
                                              
                                              {selectedGroup.creator_id === currentUserId ? (
                                                  member.id !== currentUserId && (
                                                      <button onClick={() => removeMember(member.id)} className="text-text-secondary hover:text-red-500 transition-colors ml-2">
                                                          <UserMinus size={14} />
                                                      </button>
                                                  )
                                              ) : (
                                                  member.id === currentUserId && (
                                                      <button onClick={() => removeMember(member.id)} className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2 py-1 text-[10px] text-red-500 transition-colors hover:bg-red-500/20 ml-2">
                                                          <LogOut size={12} /> Leave
                                                      </button>
                                                  )
                                              )}
                                          </div>
                                      ))}
                                  </div>

                                  <div className="mt-8 border-t border-border-primary pt-6 flex flex-col gap-4">
                                       {activeGameId ? (
                                           <button 
                                             onClick={() => setShowArena(true)}
                                             className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-4 font-bold text-black shadow-lg shadow-gold/20 transition-all hover:scale-[1.02]"
                                           >
                                               <Swords size={20} /> Enter Match Arena
                                           </button>
                                       ) : (
                                           <div className="flex flex-col gap-3">
                                               {/* Individual Readiness Toggle */}
                                               <button 
                                                 onClick={() => setReadyStatus(!currentUserMembership?.is_ready)}
                                                 className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold uppercase transition-all ${currentUserMembership?.is_ready ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500 text-black shadow-lg shadow-green-500/20'}`}
                                               >
                                                   {currentUserMembership?.is_ready ? <><X size={20} /> Leave Arena</> : <><Swords size={20} /> Join Arena</>}
                                               </button>

                                               {/* Commander Start Button */}
                                               {selectedGroup.creator_id === currentUserId && (
                                                   <button 
                                                     onClick={handleStartGame}
                                                     disabled={startingGame || !isFullSquadReady}
                                                     className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold transition-all ${isFullSquadReady ? 'bg-gold text-black shadow-lg shadow-gold/20 hover:scale-[1.02]' : 'bg-white/5 text-text-secondary grayscale opacity-50 cursor-not-allowed'}`}
                                                   >
                                                       {startingGame ? <Loader2 className="animate-spin" /> : <><Swords size={20} /> Start match</>}
                                                   </button>
                                               )}
                                               
                                               {!isFullSquadReady && selectedGroup.creator_id === currentUserId && (
                                                   <p className="text-[10px] text-center text-gold/60 uppercase tracking-widest animate-pulse font-bold">Waiting for full squad deployment...</p>
                                               )}

                                               {groupMembers.length < 4 && groupMembers.length > 0 && isFullSquadReady && (
                                                   <p className="text-[10px] text-center text-text-secondary italic">Full squad present. Ready to engage.</p>
                                               )}
                                           </div>
                                       )}
                                       
                                       {selectedGroup.creator_id === currentUserId && (
                                           <div className="flex gap-4">
                                               <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm font-bold text-text-secondary hover:text-text-primary transition-all">
                                                   <Settings size={16} /> Settings
                                               </button>
                                               <button 
                                                 onClick={deleteGroup}
                                                 className="flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                               >
                                                   <Trash2 size={16} />
                                               </button>
                                           </div>
                                       )}
                                  </div>
                              </div>

                              {/* Right Columns (2-Span): Recruiment */}
                              <div className="lg:col-span-2 space-y-8">
                                  {/* Alliance Beacon (Invite Link) */}
                                  <div className="rounded-3xl bg-gold/5 p-6 border border-gold/10">
                                      <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-gold flex items-center gap-2">
                                          <Swords size={16} />
                                          Alliance Beacon
                                      </h4>
                                      <p className="mb-6 text-sm text-text-secondary leading-relaxed">
                                          Share this secure beacon code or link with other legends. Anyone with the code can join the squad instantly—no friendship chain required.
                                      </p>
                                      
                                      <div className="flex flex-col gap-4">
                                          <div className="flex items-center gap-2 bg-black/20 rounded-xl p-3 border border-gold/20">
                                              <span className="flex-1 font-mono text-lg font-black tracking-widest text-gold uppercase px-2">{selectedGroup.invite_code}</span>
                                              <button 
                                                onClick={copyInviteLink} 
                                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-gold text-black hover:scale-105'}`}
                                              >
                                                  {copied ? 'BEACON COPIED' : 'COPY RECRUIT LINK'}
                                              </button>
                                          </div>
                                          
                                          {selectedGroup.creator_id === currentUserId && (
                                               <button 
                                                 onClick={handleRefreshBeacon}
                                                 className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-secondary hover:text-gold transition-colors w-fit px-2"
                                               >
                                                   <Settings size={12} /> Recalibrate Beacon (New Code)
                                               </button>
                                          )}
                                      </div>
                                  </div>

                                  {/* Manual Recruitment (Friends) */}
                                  {selectedGroup.creator_id === currentUserId && (
                                      <div>
                                          <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2 px-2">
                                              <Plus size={16} />
                                              Direct Recruitment (Allies)
                                          </h4>
                                          <div className="grid gap-3 sm:grid-cols-2">
                                              {friends.filter(f => !groupMembers.some((m: any) => m.id === f.id)).map((friend: any) => (
                                                  <div key={friend.id} className="flex items-center justify-between rounded-2xl border border-border-primary bg-black/5 dark:bg-white/5 p-4 transition-all hover:bg-gray-200 dark:hover:bg-white/10 text-xs">
                                                      <div className="flex flex-col">
                                                          <span className="font-bold text-text-primary">{friend.full_name}</span>
                                                          <span className="opacity-50 font-mono">@{friend.username}</span>
                                                      </div>
                                                      <button 
                                                        onClick={() => addMember(friend.id)}
                                                        className="rounded-lg bg-gold/10 p-2 text-gold hover:bg-gold hover:text-black transition-all border border-gold/10"
                                                      >
                                                          <Plus size={14} />
                                                      </button>
                                                  </div>
                                              ))}
                                              {friends.filter(f => !groupMembers.some((m: any) => m.id === f.id)).length === 0 && <p className="col-span-full text-xs text-text-secondary italic px-2">No direct allies available to recruit.</p>}
                                          </div>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </motion.div>
                  </motion.div>
              )}
          </AnimatePresence>

          {!loading && groups.length === 0 && (
            <div className="mt-20 text-center">
                <p className="text-text-secondary italic">You are not part of any squads yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


export default function GroupsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#050505]">
        <Loader2 className="animate-spin text-gold" size={40} />
      </div>
    }>
      <GroupsContent />
    </Suspense>
  );
}
