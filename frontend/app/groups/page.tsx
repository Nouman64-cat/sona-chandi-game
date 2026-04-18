"use client"

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Loader2, Users, X, UserMinus, Settings, Trash2, LogOut, Swords } from 'lucide-react';
import api from '@/app/services/apiService';
import GameArena from '@/app/components/GameArena';

function GroupsContent() {
  const searchParams = useSearchParams();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(searchParams.get('create') === 'true');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Game specific state
  const [showArena, setShowArena] = useState(false);
  const [activeGameId, setActiveGameId] = useState<number | null>(null);
  const [startingGame, setStartingGame] = useState(false);

  
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(Number(payload.sub));
    }
    fetchGroups();
    fetchFriends();
  }, []);

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

  const selectGroup = async (group: any) => {
    setSelectedGroup(group);
    setGroupMembers([]);
    setActiveGameId(null);
    try {
      const respMembers = await api.get(`/groups/${group.id}/members`);
      setGroupMembers(respMembers.data);
      
      const respGame = await api.get(`/games/state/${group.id}`);
      if (respGame.data && respGame.data.status === 'active') {
          setActiveGameId(respGame.data.game_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addMember = async (userId: number) => {
    try {
      await api.post(`/groups/${selectedGroup.id}/add-member/${userId}?admin_id=${currentUserId}`);
      const response = await api.get(`/groups/${selectedGroup.id}/members`);
      setGroupMembers(response.data);
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


  return (
    <div className="flex bg-background text-text-primary">
      <Navbar />
      
      {showArena && selectedGroup && (
        <GameArena 
          groupId={selectedGroup.id} 
          currentUserId={currentUserId!} 
          groupMembers={groupMembers} 
          onClose={() => setShowArena(false)}
        />
      )}
      
      <main className="min-h-screen flex-1 p-6 pb-24 md:pb-6 md:pl-24 lg:pl-72">
        <div className="mx-auto max-w-4xl pt-8">
          <header className="mb-12 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Your <span className="gold-text">Squads</span></h1>
              <p className="mt-2 text-text-secondary">Form alliances and dominate the leaderboards.</p>
            </div>
            <button 
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 rounded-2xl bg-gold px-6 py-3 font-bold text-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-gold/20"
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
                className="glass mb-12 rounded-3xl p-8 border border-black/5 dark:border-white/5 shadow-2xl"
              >
                 <h3 className="mb-6 text-xl font-bold text-text-primary">New Group Details</h3>
                 <form onSubmit={handleCreateGroup} className="space-y-4">
                    <input 
                      type="text" 
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Group Name (e.g. Phoenix Elite)"
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
                             <span className="rounded-lg bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gold border border-gold/20">Admin</span>
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-text-primary">{group.name}</h3>
                    <p className="mt-2 text-sm text-text-secondary line-clamp-2">{group.description || "No description provided."}</p>
                    <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-text-secondary">
                            <Users size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest">View Squad</span>
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
                            className="glass max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] p-8 border border-black/10 dark:border-white/10 shadow-3xl"
                          >
                              <div className="mb-8 flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                      <Shield className="text-gold" size={40} />
                                      <div>
                                          <h2 className="text-3xl font-bold text-text-primary">{selectedGroup.name}</h2>
                                          <p className="text-text-secondary">{selectedGroup.description}</p>
                                      </div>
                                  </div>
                                  <button onClick={() => setSelectedGroup(null)} className="rounded-full bg-black/5 dark:bg-white/5 p-2 text-text-secondary hover:text-text-primary transition-colors">
                                      <X size={24} />
                                  </button>
                              </div>

                          <div className="grid gap-8 md:grid-cols-2">
                              {/* Left Column: Member List always visible to everyone */}
                              <div className="flex flex-col h-full">
                                  <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
                                      <Users size={16} />
                                      Squad Members
                                  </h4>
                                  <div className="space-y-3 flex-1 overflow-y-auto pr-2 max-h-64">
                                      {groupMembers.map((member: any) => (
                                          <div key={member.id} className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                                              <div className="flex items-center gap-3">
                                                  <div className="h-8 w-8 rounded-lg bg-silver/10 flex items-center justify-center text-xs font-bold uppercase">{member.username[0]}</div>
                                                  <span className="font-medium text-sm">{member.full_name}</span>
                                                  {member.id === selectedGroup.creator_id && <span className="text-[10px] text-gold uppercase">Admin</span>}
                                              </div>
                                              
                                              {/* Admin can kick, Members can leave */}
                                              {selectedGroup.creator_id === currentUserId ? (
                                                  member.id !== currentUserId && (
                                                      <button onClick={() => removeMember(member.id)} className="text-text-secondary hover:text-red-500 transition-colors">
                                                          <UserMinus size={16} />
                                                      </button>
                                                  )
                                              ) : (
                                                  member.id === currentUserId && (
                                                      <button onClick={() => removeMember(member.id)} className="flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1 text-xs text-red-500 transition-colors hover:bg-red-500/20">
                                                          <LogOut size={14} /> Leave
                                                      </button>
                                                  )
                                              )}
                                          </div>
                                      ))}
                                  </div>

                                  {/* Game Triggers: Outside any admin-only block */}
                                  <div className="mt-8 border-t border-border-primary pt-6 flex flex-col gap-4">
                                       {activeGameId ? (
                                           <button 
                                             onClick={() => setShowArena(true)}
                                             className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-4 font-bold text-black shadow-lg shadow-gold/20 transition-all hover:scale-[1.02]"
                                           >
                                               <Swords size={20} /> Enter Match Arena
                                           </button>
                                       ) : groupMembers.length >= 1 && (
                                           <div className="flex flex-col gap-2">
                                               <button 
                                                 onClick={handleStartGame}
                                                 disabled={startingGame}
                                                 className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-4 font-bold text-black transition-all hover:scale-[1.02]"
                                               >
                                                   {startingGame ? <Loader2 className="animate-spin" /> : <><Swords size={20} /> Start Game</>}
                                               </button>
                                               {groupMembers.length < 4 && (
                                                   <p className="text-[10px] text-center text-text-secondary">Note: Match optimized for 4 players. Current: {groupMembers.length}.</p>
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

                              {/* Right Column: Admin Actions */}
                              <div>
                                  {selectedGroup.creator_id === currentUserId ? (
                                      <>
                                          <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
                                              <Plus size={16} />
                                              Add Allies
                                          </h4>
                                          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 pb-4">
                                              {friends.filter(f => !groupMembers.some((m: any) => m.id === f.id)).map((friend: any) => (
                                                  <div key={friend.id} className="flex items-center justify-between rounded-2xl border border-border-primary bg-black/5 dark:bg-white/5 p-4 transition-all hover:bg-gray-200 dark:hover:bg-white/10">
                                                      <div className="flex flex-col">
                                                          <span className="text-sm font-bold text-text-primary">{friend.full_name}</span>
                                                          <span className="text-[10px] text-text-secondary font-mono">@{friend.username}</span>
                                                      </div>
                                                      <button 
                                                        onClick={() => addMember(friend.id)}
                                                        className="rounded-lg bg-gold/10 p-2 text-gold hover:bg-gold hover:text-black transition-all border border-gold/10"
                                                      >
                                                          <Plus size={16} />
                                                      </button>
                                                  </div>
                                              ))}
                                              {friends.filter(f => !groupMembers.some((m: any) => m.id === f.id)).length === 0 && <p className="text-xs text-text-secondary italic">No allies available to add.</p>}
                                          </div>
                                      </>
                                  ) : (
                                      <div className="flex h-full items-center justify-center rounded-3xl bg-white/5 p-8 text-center">
                                          <div>
                                              <Shield className="mx-auto mb-4 text-text-secondary opacity-30" size={48} />
                                              <p className="text-sm text-text-secondary italic">Only the squad admin can recruit new allies.</p>
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
