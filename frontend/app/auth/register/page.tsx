"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, User as UserIcon, Mail, Phone, UserCircle, Loader2 } from 'lucide-react';
import api from '@/app/services/apiService';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    gender: 'Other',
    number: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/auth/register', formData);
      router.push('/auth/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-text-primary">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-gold/5 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-silver/5 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass relative w-full max-w-lg rounded-3xl p-8 shadow-2xl"
      >
        <div className="mb-8 text-center">
          <h1 className="gold-text mb-2 text-4xl font-bold tracking-tighter italic">SONA CHANDI</h1>
          <p className="text-text-secondary">Join the elite game. Register your legend.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Full Name</label>
            <div className="relative">
              <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input 
                type="text" name="full_name" required value={formData.full_name} onChange={handleChange}
                placeholder="Nouman Ejaz"
                className="w-full rounded-xl border border-border-primary bg-bg-secondary py-3 pl-11 pr-4 outline-none transition-all focus:border-gold/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input 
                type="text" name="username" required value={formData.username} onChange={handleChange}
                placeholder="nouman64"
                className="w-full rounded-xl border border-border-primary bg-bg-secondary py-3 pl-11 pr-4 outline-none transition-all focus:border-gold/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input 
                type="email" name="email" required value={formData.email} onChange={handleChange}
                placeholder="nouman@example.com"
                className="w-full rounded-xl border border-border-primary bg-bg-secondary py-3 pl-11 pr-4 outline-none transition-all focus:border-gold/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input 
                type="text" name="number" required value={formData.number} onChange={handleChange}
                placeholder="+92 300 0000000"
                className="w-full rounded-xl border border-border-primary bg-bg-secondary py-3 pl-11 pr-4 outline-none transition-all focus:border-gold/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Gender</label>
            <select 
              name="gender" value={formData.gender} onChange={handleChange}
              className="w-full rounded-xl border border-border-primary bg-bg-secondary py-3 px-4 outline-none transition-all focus:border-gold/50 text-text-primary"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input 
                type="password" name="password" required value={formData.password} onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border-primary bg-bg-secondary py-3 pl-11 pr-4 outline-none transition-all focus:border-gold/50"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="md:col-span-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gold py-4 font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Register Legends'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-text-secondary">
          Already have an account? <Link href="/auth/register" className="font-bold text-gold hover:underline">Log In</Link>
        </div>
      </motion.div>
    </div>
  );
}

