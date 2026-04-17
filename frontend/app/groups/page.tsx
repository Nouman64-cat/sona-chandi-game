"use client"

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Loader2, Users, X, UserMinus, Settings, Trash2, LogOut } from 'lucide-react';
import api from '@/app/services/apiService';

function GroupsContent() {
  const searchParams = useSearchParams();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(searchParams.get('create') === 'true');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [creating, setCreating] = useState(false);

  
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
      // In a real app we'd have a route like /groups/me or similar
      // For now we'll fetch all and filter or assume user is in them
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
    try {
      const response = await api.get(`/groups/${group.id}/members`);
      setGroupMembers(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addMember = async (userId: number) => {
    try {
      await api.post(`/groups/${selectedGroup.id}/add-member/${userId}?admin_id=${currentUserId}`);
      // Refresh members
      const response = await api.get(`/groups/${selectedGroup.id}/members`);
      setGroupMembers(response.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to add member");
    }
  };

  const removeMember = async (userId: number) => {
    try {
       await api.post(`/groups/${selectedGroup.id}/leave/${userId}?requestor_id=${currentUserId}`);
       setGroupMembers(groupMembers.filter((m: any) => m.id !== userId));
    } catch (err) {
        alert(err.response?.data?.detail || "Failed to remove member");
    }
  };

  const deleteGroup = async () => {
      if (!window.confirm("Are you sure you want to disband this squad?")) return;
      try {
          await api.delete(`/groups/${selectedGroup.id}?admin_id=${currentUserId}`);
          setGroups(groups.filter((g: any) => g.id !== selectedGroup.id));
          setSelectedGroup(null);
      } catch (err) {
          alert(err.response?.data?.detail || "Failed to delete group");
      }
  };

  return (
    <div className="flex bg-background text-text-primary">
      <Navbar />
      
      <main className="min-h-screen flex-1 p-6 pb-24 md:pb-6 md:pl-24 lg:pl-72">
        <div className="mx-auto max-w-4xl pt-8">
          <header className="mb-12 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Your <span className="gold-text">Squads</span></h1>
              <p className="mt-2 text-text-secondary">Form alliances and dominate the leaderboards.</p>
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
                      className="w-full rounded-2xl border border-border-primary bg-card p-4 outline-none focus:border-gold/50"
                    />
                    <textarea 
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      placeholder="Short description..."
                      className="w-full rounded-2xl border border-border-primary bg-card p-4 outline-none focus:border-gold/50"
                    />
                    <div className="flex gap-4">
                        <button type="submit" disabled={creating} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gold py-4 font-bold text-black">
                            {creating ? <Loader2 className="animate-spin" /> : 'Confirm Creation'}
                        </button>
                        <button type="button" onClick={() => setShowCreate(false)} className="rounded-2xl border border-border-primary px-8 font-bold">
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
                    className="glass rounded-3xl p-8 relative overflow-hidden group cursor-pointer transition-all hover:border-gold/30"
                >
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gold/10 blur-2xl transition-all group-hover:bg-gold/20" />
                    <div className="flex items-center justify-between mb-4">
                        <Shield className="text-gold" size={32} />
                        {group.creator_id === currentUserId && (
                             <span className="rounded-lg bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gold border border-gold/20">Admin</span>
                        )}
                    </div>
                    <h3 className="text-xl font-bold">{group.name}</h3>
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
                        className="glass max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] p-8"
                      >
                          <div className="mb-8 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                  <Shield className="text-gold" size={40} />
                                  <div>
                                      <h2 className="text-3xl font-bold">{selectedGroup.name}</h2>
                                      <p className="text-text-secondary">{selectedGroup.description}</p>
                                  </div>
                              </div>
                              <button onClick={() => setSelectedGroup(null)} className="rounded-full bg-white/5 p-2 text-text-secondary hover:text-text-primary">
                                  <X size={24} />
                              </button>
                          </div>

                          <div className="grid gap-8 md:grid-cols-2">
                              <div>
                                  <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
                                      <Users size={16} />
                                      Squad Members
                                  </h4>
                                  <div className="space-y-3">
                                      {groupMembers.map((member: any) => (
                                          <div key={member.id} className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                                              <div className="flex items-center gap-3">
                                                  <div className="h-8 w-8 rounded-lg bg-silver/10 flex items-center justify-center text-xs font-bold">{member.username[0]}</div>
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
                              </div>

                              {selectedGroup.creator_id === currentUserId && (
                                  <div>
                                      <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
                                          <Plus size={16} />
                                          Add Allies
                                      </h4>
                                      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 pb-4">
                                          {friends.map((friend: any) => (
                                              <div key={friend.id} className="flex items-center justify-between rounded-2xl border border-border-primary p-4 transition-all hover:bg-white/5">
                                                  <span className="text-sm">{friend.full_name}</span>
                                                  <button 
                                                    onClick={() => addMember(friend.id)}
                                                    className="rounded-lg bg-gold/10 p-2 text-gold hover:bg-gold hover:text-black transition-all"
                                                  >
                                                      <Plus size={16} />
                                                  </button>
                                              </div>
                                          ))}
                                          {friends.length === 0 && <p className="text-xs text-text-secondary italic">No allies available to add.</p>}
                                      </div>

                                      <div className="mt-8 border-t border-border-primary pt-6 flex gap-4">
                                          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm font-bold text-text-secondary hover:text-text-primary transition-all">
                                              <Settings size={16} /> Edit Squad
                                          </button>
                                          <button 
                                            onClick={deleteGroup}
                                            className="flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                          >
                                              <Trash2 size={16} />
                                          </button>
                                      </div>
                                  </div>
                              )}
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

