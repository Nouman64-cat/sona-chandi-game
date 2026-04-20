"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, User as UserIcon, Mail, Phone, UserCircle, Loader2, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB] p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-[600px] overflow-hidden rounded-[2.5rem] bg-white p-10 md:p-12 shadow-[0_10px_40px_-10px_rgba(59,130,246,0.15)] border border-blue-50"
      >
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-[2.5rem] font-bold tracking-tight italic text-blue-500">
            SONA CHANDI
          </h1>
          <p className="text-gray-500 font-medium">Join the elite game. Register your legend.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-50 p-4 text-sm text-red-500 flex items-center justify-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-gray-600">Full Name</label>
            <div className="relative">
              <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" name="full_name" required value={formData.full_name} onChange={handleChange}
                placeholder="Nouman Ejaz"
                className="w-full rounded-2xl border border-gray-200 bg-[#F9FAFB] py-3.5 pl-11 pr-4 text-[15px] font-medium text-gray-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-400 placeholder:font-normal"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-gray-600">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" name="username" required value={formData.username} onChange={handleChange}
                placeholder="nouman64"
                className="w-full rounded-2xl border border-gray-200 bg-[#F9FAFB] py-3.5 pl-11 pr-4 text-[15px] font-medium text-gray-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-400 placeholder:font-normal"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-gray-600">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" name="email" required value={formData.email} onChange={handleChange}
                placeholder="nouman@example.com"
                className="w-full rounded-2xl border border-gray-200 bg-[#F9FAFB] py-3.5 pl-11 pr-4 text-[15px] font-medium text-gray-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-400 placeholder:font-normal"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-gray-600">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" name="number" required value={formData.number} onChange={handleChange}
                placeholder="+92 300 0000000"
                className="w-full rounded-2xl border border-gray-200 bg-[#F9FAFB] py-3.5 pl-11 pr-4 text-[15px] font-medium text-gray-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-400 placeholder:font-normal"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-gray-600">Gender</label>
            <div className="relative">
              <select 
                name="gender" value={formData.gender} onChange={handleChange}
                className="w-full appearance-none rounded-2xl border border-gray-200 bg-[#F9FAFB] py-3.5 px-4 text-[15px] font-medium text-gray-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-gray-600">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-gray-200 bg-[#F9FAFB] py-3.5 pl-11 pr-11 text-[15px] font-medium text-gray-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-400"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="md:col-span-2 mt-2 flex w-full items-center justify-center gap-2 rounded-[14px] bg-blue-500 py-4 text-[16px] font-bold text-white transition-all hover:bg-blue-600 active:scale-[0.98] disabled:opacity-50 shadow-md shadow-blue-500/20"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Register Legends'}
          </button>
        </form>

        <div className="mt-8 text-center text-[14px] font-medium text-gray-500">
          Already have an account? <Link href="/auth/login" className="font-bold text-blue-500 hover:text-blue-600">Log In</Link>
        </div>
      </motion.div>
    </div>
  );
}

