"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import api from '@/app/services/apiService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-text-primary">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-gold/5 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-silver/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative w-full max-w-md rounded-3xl p-8 shadow-2xl"
      >
        <div className="mb-10 text-center">
          <h1 className="gold-text mb-2 text-4xl font-bold tracking-tighter italic">SONA CHANDI</h1>
          <p className="text-text-secondary">Reset your password</p>
        </div>

        {submitted ? (
          <div className="space-y-6 text-center">
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-5 text-sm text-green-400">
              If this email is registered, a reset link has been sent. Check your inbox.
            </div>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-gold transition-colors"
            >
              <ArrowLeft size={16} /> Back to login
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your registered email"
                    className="w-full rounded-2xl border border-border-primary bg-bg-secondary py-4 pl-12 pr-4 outline-none transition-all focus:border-gold/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gold py-4 font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-text-secondary">
              <Link href="/auth/login" className="inline-flex items-center gap-1 hover:text-gold transition-colors">
                <ArrowLeft size={14} /> Back to login
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
