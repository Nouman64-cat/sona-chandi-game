"use client"

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Loader2, User as UserIcon, Mail, Phone } from 'lucide-react';
import api from '@/app/services/apiService';
import Navbar from '@/app/components/Navbar';

interface User {
  id: number;
  full_name: string;
  username: string;
  email: string;
  gender: string;
  number: string;
  is_private?: boolean;
  profile_picture_url?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [togglingPrivacy, setTogglingPrivacy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (err) {
      setError('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Need to use multipart/form-data specifically for this endpoint
      const response = await api.post('/users/me/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUser(response.data);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload profile picture.');
    } finally {
      setUploading(false);
    }
  };

  const handlePrivacyToggle = async () => {
    if (!user) return;
    setTogglingPrivacy(true);
    try {
      const response = await api.post(`/users/me/privacy?is_private=${!user.is_private}`);
      setUser(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update privacy settings.');
    } finally {
      setTogglingPrivacy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-gold/5 blur-[120px]" />
        <div className="absolute top-1/2 left-3/4 h-1/2 w-1/2 rounded-full bg-silver/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto mt-24 max-w-3xl px-6 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8 shadow-2xl"
        >
          <div className="mb-10 text-center">
            <h1 className="gold-text mb-2 text-4xl font-bold tracking-tighter italic">LEGEND PROFILE</h1>
            <p className="text-text-secondary">View and customize your Arena identity.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div 
                className="relative h-40 w-40 rounded-full border-4 border-gold/30 bg-bg-secondary p-1 overflow-hidden group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {user?.profile_picture_url ? (
                  <img 
                    src={user.profile_picture_url} 
                    alt="Profile" 
                    className="h-full w-full rounded-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full rounded-full bg-bg-primary flex items-center justify-center text-text-secondary">
                    <UserIcon size={64} />
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 transition-opacity flex flex-col items-center justify-center group-hover:opacity-100">
                   {uploading ? (
                     <Loader2 className="animate-spin text-white" size={32} />
                   ) : (
                     <>
                        <Camera className="text-white mb-2" size={32} />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Change Photo</span>
                     </>
                   )}
                </div>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <button 
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-bold text-gold hover:text-white transition-colors"
              >
                {uploading ? 'UPLOADING...' : 'UPDATE AVATAR'}
              </button>
            </div>

            {/* User Details */}
            <div className="flex-1 space-y-6 w-full">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Full Name</label>
                <div className="flex items-center gap-3 rounded-2xl bg-bg-secondary p-4 border border-border-primary">
                  <UserIcon className="text-gold flex-shrink-0" size={20} />
                  <span className="font-medium text-lg">{user?.full_name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Tagname</label>
                <div className="flex items-center gap-3 rounded-2xl bg-bg-secondary p-4 border border-border-primary">
                  <span className="text-gold font-bold text-xl">@</span>
                  <span className="font-medium text-lg">{user?.username}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Email</label>
                  <div className="flex items-center gap-3 rounded-2xl bg-bg-secondary p-4 border border-border-primary">
                    <Mail className="text-gold flex-shrink-0" size={20} />
                    <span className="truncate">{user?.email}</span>
                  </div>
                </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Phone</label>
                    <div className="flex items-center gap-3 rounded-2xl bg-bg-secondary p-4 border border-border-primary">
                      <Phone className="text-gold flex-shrink-0" size={20} />
                      <span className="truncate">{user?.number}</span>
                    </div>
                  </div>
                </div>

                {/* Privacy Setting Integration */}
                <div className="mt-8 pt-6 border-t border-border-primary">
                  <div className="flex items-center justify-between">
                     <div>
                       <h3 className="font-bold text-lg">Private Legend Account</h3>
                       <p className="text-xs text-text-secondary mt-1 max-w-sm">If enabled, your profile is hidden from the public Search Network, but you can still launch matches via Alliance Beacons.</p>
                     </div>
                     <button
                       onClick={handlePrivacyToggle}
                       disabled={togglingPrivacy}
                       className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ml-4 ${user?.is_private ? 'bg-gold' : 'bg-gray-600'}`}
                     >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${user?.is_private ? 'translate-x-6' : 'translate-x-1'}`} />
                     </button>
                  </div>
                </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
