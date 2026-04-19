"use client"

import React, { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import api from '@/app/services/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Trophy, ChevronDown, ChevronUp, Sword, Clock, Star, Users } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
    if (!ts) return '—';
    const d = new Date(ts * 1000);
    const now = Date.now();
    const diff = now - ts * 1000;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function positionLabel(pos: number | null): string {
    if (!pos) return '—';
    if (pos === 1) return '🥇 Champion';
    if (pos === 2) return '🥈 Runner Up';
    if (pos === 3) return '🥉 3rd Place';
    return `#${pos} Placed`;
}

function positionColor(pos: number | null): string {
    if (pos === 1) return 'text-gold';
    if (pos === 2) return 'text-silver';
    if (pos === 3) return 'text-orange-400';
    return 'text-text-secondary';
}

function borderColor(pos: number | null): string {
    if (pos === 1) return 'border-l-gold';
    if (pos === 2) return 'border-l-silver';
    if (pos === 3) return 'border-l-orange-400';
    return 'border-l-white/10';
}

// ─── Match Drilldown Table ────────────────────────────────────────────────────

function MatchDrilldown({ match }: { match: any }) {
    // Collect all unique participants across all rounds
    const allParticipants: Map<number, string> = new Map();
    match.rounds.forEach((r: any) => {
        r.all_results.forEach((res: any) => {
            allParticipants.set(res.user_id, res.username || res.full_name);
        });
    });

    // Build per-user totals
    const userTotals: Record<number, number> = {};
    match.rounds.forEach((r: any) => {
        r.all_results.forEach((res: any) => {
            userTotals[res.user_id] = (userTotals[res.user_id] || 0) + res.points;
        });
    });

    const sortedUsers = Array.from(allParticipants.entries()).sort(
        ([aId], [bId]) => (userTotals[bId] || 0) - (userTotals[aId] || 0)
    );

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
        >
            <div className="border-t border-white/10 pt-4 pb-2 px-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">
                    Match Breakdown — All Rounds
                </p>
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-black/40 text-[10px] uppercase font-black tracking-widest text-text-secondary">
                            <tr>
                                <th className="p-3 px-5 font-bold text-white">Legend</th>
                                {match.rounds.map((r: any) => (
                                    <th key={r.round_number} className="p-3 text-center">
                                        R{r.round_number}
                                    </th>
                                ))}
                                <th className="p-3 px-5 text-right font-bold text-gold">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sortedUsers.map(([userId, username]) => (
                                <tr key={userId} className="hover:bg-white/5 transition-colors">
                                    <td className="p-3 px-5 font-bold text-white text-xs">
                                        {username}
                                    </td>
                                    {match.rounds.map((r: any) => {
                                        const perf = r.all_results.find(
                                            (res: any) => res.user_id === userId
                                        );
                                        const isFirst = perf?.position === 1;
                                        return (
                                            <td
                                                key={r.round_number}
                                                className={`p-3 text-center font-bold text-xs ${
                                                    isFirst
                                                        ? 'text-gold drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]'
                                                        : 'text-text-secondary'
                                                }`}
                                            >
                                                {isFirst && <span className="mr-1">🥇</span>}
                                                {perf ? `${perf.points}` : '—'}
                                            </td>
                                        );
                                    })}
                                    <td className="p-3 px-5 text-right font-black text-gold text-xs">
                                        {userTotals[userId] || 0}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Match Card ───────────────────────────────────────────────────────────────

function MatchCard({ match, index }: { match: any; index: number }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden border-l-4 ${borderColor(match.my_best_position)} hover:bg-white/[0.07] transition-colors`}
        >
            {/* Card Header */}
            <div className="flex items-center justify-between p-5 md:p-6 cursor-pointer" onClick={() => setExpanded(e => !e)}>
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                        <Trophy size={18} />
                    </div>
                    {/* Primary Info */}
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-black text-white">{match.group_name}</h3>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/5 border border-white/10 ${positionColor(match.my_best_position)}`}>
                                {positionLabel(match.my_best_position)}
                            </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1 text-[11px] text-text-secondary font-medium">
                                <Sword size={12} />
                                {match.total_rounds} {match.total_rounds === 1 ? 'Round' : 'Rounds'}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-text-secondary font-medium">
                                <Star size={12} />
                                {match.my_total_points} pts total
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-text-secondary font-medium">
                                <Clock size={12} />
                                {formatDate(match.played_at)}
                            </span>
                        </div>
                    </div>
                </div>
                {/* Expand Toggle */}
                <button
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors ml-4 shrink-0"
                    onClick={(e) => { e.stopPropagation(); setExpanded(ex => !ex); }}
                >
                    {expanded ? (
                        <><ChevronUp size={12} /> Hide</>
                    ) : (
                        <><ChevronDown size={12} /> Details</>
                    )}
                </button>
            </div>

            {/* Drilldown Accordion */}
            <AnimatePresence>
                {expanded && <MatchDrilldown match={match} />}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/auth/login';
            return;
        }
        const fetchHistory = async () => {
            try {
                const res = await api.get('/games/history/user');
                setMatches(res.data);
            } catch (err: any) {
                setError(err?.response?.data?.detail || 'Failed to load combat archives.');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="flex bg-background text-text-primary">
            <Navbar />
            <main className="min-h-screen flex-1 p-6 pb-24 md:pb-6 md:pl-24 lg:pl-72">
                <div className="mx-auto max-w-4xl pt-8">
                    {/* Page Header */}
                    <header className="mb-10">
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-sm font-bold uppercase tracking-[0.3em] text-gold"
                        >
                            Combat Archives
                        </motion.p>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl font-bold md:text-5xl"
                        >
                            Match <span className="silver-text">History</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-2 text-sm text-text-secondary"
                        >
                            Every battle fought, every round played — your complete legend.
                        </motion.p>
                    </header>

                    {/* States */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-24 text-text-secondary gap-4">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                            <p className="text-sm font-bold uppercase tracking-widest">Retrieving archives…</p>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {!loading && !error && matches.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 py-24 text-center"
                        >
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gold/10 text-gold">
                                <BookOpen size={28} />
                            </div>
                            <h2 className="text-xl font-black text-white">No battles recorded yet, Commander.</h2>
                            <p className="mt-2 text-sm text-text-secondary max-w-xs">
                                Join a squad, step into the arena, and your legacy will be written here.
                            </p>
                            <a
                                href="/groups"
                                className="mt-6 rounded-xl bg-gold px-6 py-2.5 text-sm font-black text-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-gold/20"
                            >
                                Find a Squad
                            </a>
                        </motion.div>
                    )}

                    {!loading && !error && matches.length > 0 && (
                        <div className="flex flex-col gap-4">
                            {/* Stats Bar */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 flex flex-wrap gap-3"
                            >
                                {[
                                    { label: 'Matches', value: matches.length, icon: Trophy },
                                    { label: 'Total Rounds', value: matches.reduce((s, m) => s + m.total_rounds, 0), icon: Sword },
                                    { label: 'Wins', value: matches.filter(m => m.my_best_position === 1).length, icon: Star },
                                    { label: 'Squads', value: new Set(matches.map(m => m.group_id)).size, icon: Users },
                                ].map(stat => (
                                    <div key={stat.label} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                                        <stat.icon size={14} className="text-gold" />
                                        <span className="text-xs font-black text-white">{stat.value}</span>
                                        <span className="text-[10px] uppercase tracking-widest text-text-secondary font-bold">{stat.label}</span>
                                    </div>
                                ))}
                            </motion.div>

                            {/* Match List */}
                            {matches.map((match, i) => (
                                <MatchCard key={match.series_id || `solo_${match.rounds[0]?.game_id}`} match={match} index={i} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
