import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, Radius } from '../theme';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [stats, setStats] = useState({
    friends: '—',
    groups: '—',
    wins: '—',
    matches: '—',
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const [friendsRes, groupsRes, historyRes] = await Promise.all([
        api.get(`/friends/${user!.id}`),
        api.get('/groups/'),
        api.get('/games/history/user').catch(() => ({ data: [] })),
      ]);
      const matches: any[] = historyRes.data;
      const wins = matches.filter((m) => m.my_best_position === 1).length;
      setStats({
        friends: String(friendsRes.data.length),
        groups: String(groupsRes.data.length),
        wins: String(wins),
        matches: String(matches.length),
      });
    } catch {
      // stats stay as '—'
    } finally {
      setLoadingStats(false);
    }
  };

  const statCards = [
    { label: 'Allies', value: stats.friends, icon: 'people' as const, color: Colors.gold },
    { label: 'Squads', value: stats.groups, icon: 'shield' as const, color: '#60a5fa' },
    { label: 'Victories', value: stats.wins, icon: 'trophy' as const, color: '#fbbf24' },
    { label: 'Battles', value: stats.matches, icon: 'flash' as const, color: Colors.silver },
  ];

  const firstName = user?.full_name?.split(' ')[0] || 'Legend';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroGlowA} />
          <View style={styles.heroGlowB} />
          <Text style={styles.eyebrow}>Commander Dashboard</Text>
          <Text style={styles.heroTitle}>
            Welcome back,{'\n'}
            <Text style={styles.heroName}>{firstName}</Text>
          </Text>
          <Text style={styles.heroSub}>
            {user?.is_admin ? 'Commander · Administrator' : 'Elite Player'}
          </Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {statCards.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: `${s.color}18` }]}>
                <Ionicons name={s.icon} size={20} color={s.color} />
              </View>
              {loadingStats ? (
                <ActivityIndicator size="small" color={s.color} style={{ marginVertical: 4 }} />
              ) : (
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              )}
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Enter Arena CTA */}
        <TouchableOpacity
          style={styles.arenaCta}
          onPress={() => navigation.navigate('Groups')}
          activeOpacity={0.85}
        >
          <View style={styles.arenaCtaGlow} />
          <View style={styles.arenaCtaContent}>
            <MaterialCommunityIcons name="sword-cross" size={28} color="#000" />
            <View style={styles.arenaCtaText}>
              <Text style={styles.arenaCtaTitle}>Enter the Arena</Text>
              <Text style={styles.arenaCtaSub}>Open your squads to join a live match</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(0,0,0,0.5)" />
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Groups')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(212,175,55,0.12)' }]}>
                <Ionicons name="shield" size={22} color={Colors.gold} />
              </View>
              <Text style={styles.actionLabel}>Squads</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Search')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(96,165,250,0.12)' }]}>
                <Ionicons name="search" size={22} color="#60a5fa" />
              </View>
              <Text style={styles.actionLabel}>Find Players</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Friends')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
                <Ionicons name="people" size={22} color="#22c55e" />
              </View>
              <Text style={styles.actionLabel}>Alliance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('History')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(192,192,192,0.12)' }]}>
                <Ionicons name="book" size={22} color={Colors.silver} />
              </View>
              <Text style={styles.actionLabel}>Archives</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Admin quick links */}
        {user?.is_admin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Administration</Text>
            <View style={styles.adminRow}>
              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => navigation.navigate('AdminCards')}
                activeOpacity={0.8}
              >
                <Ionicons name="settings" size={18} color={Colors.gold} />
                <Text style={styles.adminCardLabel}>Card Management</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => navigation.navigate('AdminUsers')}
                activeOpacity={0.8}
              >
                <Ionicons name="people" size={18} color={Colors.gold} />
                <Text style={styles.adminCardLabel}>User Oversight</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 40 },

  // Hero
  hero: {
    padding: Spacing['2xl'],
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlowA: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(212,175,55,0.06)',
  },
  heroGlowB: {
    position: 'absolute',
    bottom: -40,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(192,192,192,0.04)',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 5,
    color: Colors.gold,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.textPrimary,
    lineHeight: 38,
  },
  heroName: {
    color: Colors.silver,
  },
  heroSub: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 10,
    fontWeight: '600',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['2xl'],
    gap: 10,
    marginBottom: Spacing['2xl'],
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: Typography.xl,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Arena CTA
  arenaCta: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing['2xl'],
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.gold,
  },
  arenaCtaGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  arenaCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.lg,
  },
  arenaCtaText: { flex: 1 },
  arenaCtaTitle: {
    fontSize: Typography.lg,
    fontWeight: '900',
    color: '#000',
  },
  arenaCtaSub: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.55)',
    marginTop: 2,
    fontWeight: '600',
  },

  // Sections
  section: {
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },

  // Action Grid
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: 10,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Admin
  adminRow: { flexDirection: 'row', gap: 10 },
  adminCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(212,175,55,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
    borderRadius: 14,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  adminCardLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.gold,
  },
});
