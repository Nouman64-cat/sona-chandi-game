import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Colors, Spacing, Typography, Radius } from '../theme';
import GlassCard from '../components/GlassCard';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const stats = [
  { label: 'Total Friends', value: '—', icon: 'people' as const, color: Colors.gold },
  { label: 'Active Groups', value: '—', icon: 'shield' as const, color: Colors.silver },
  { label: 'Win Rate', value: '—', icon: 'trending-up' as const, color: '#22c55e' },
  { label: 'Rank', value: '—', icon: 'trophy' as const, color: Colors.gold },
];

const activities = [
  'New protocol initialized in Phoenix Squad',
  'Battle completed in Dragon Legion',
  'New alliance member joined your squad',
];

export default function DashboardScreen() {
  const { user } = useAuth();
  const { accentColor } = useTheme();
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: Colors.gold }]}>
            Commander Dashboard
          </Text>
          <Text style={styles.title}>
            Welcome back,{' '}
            <Text style={{ color: Colors.silver }}>
              {user?.full_name?.split(' ')[0] || 'Legend'}
            </Text>
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((s, i) => (
            <GlassCard key={s.label} style={styles.statCard} padding={Spacing.xl}>
              <View style={[styles.statIcon, { backgroundColor: `${s.color}20` }]}>
                <Ionicons name={s.icon} size={22} color={s.color} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Recent Activity */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {activities.map((a, i) => (
              <View key={i} style={styles.activityItem}>
                <View style={styles.activityIconBox}>
                  <Ionicons name="sparkles" size={16} color={Colors.gold} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>
                    {a.includes('Phoenix Squad') ? (
                      <>
                        New protocol initialized in{' '}
                        <Text style={{ color: Colors.gold }}>Phoenix Squad</Text>
                      </>
                    ) : (
                      a
                    )}
                  </Text>
                  <Text style={styles.activityTime}>2 hours ago</Text>
                </View>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionList}>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => navigation.navigate('Main')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="sword-cross" size={20} color="#000" />
              <Text style={styles.primaryActionText}>Enter Live Arena</Text>
              <Ionicons name="sparkles" size={16} color="#000" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryAction} activeOpacity={0.7}>
              <Ionicons name="shield" size={20} color={Colors.textSecondary} />
              <Text style={styles.secondaryActionText}>Create New Group</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryAction} activeOpacity={0.7}>
              <Ionicons name="people" size={20} color={Colors.textSecondary} />
              <Text style={styles.secondaryActionText}>Find More Friends</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Admin quick links */}
        {user?.is_admin && (
          <View style={styles.adminRow}>
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => navigation.navigate('AdminCards')}
            >
              <Ionicons name="settings" size={18} color={Colors.gold} />
              <Text style={styles.adminButtonText}>Intelligence Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => navigation.navigate('AdminUsers')}
            >
              <Ionicons name="people" size={18} color={Colors.gold} />
              <Text style={styles.adminButtonText}>User Oversight</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing['2xl'], paddingBottom: Spacing['5xl'], gap: Spacing['2xl'] },
  header: { paddingTop: Spacing.md },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 6,
    marginBottom: 8,
  },
  title: {
    fontSize: Typography['3xl'],
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: Typography['2xl'],
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: { gap: 0 },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  activityList: { gap: Spacing.md },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white5,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.white5,
  },
  activityIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: Colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: { flex: 1 },
  activityText: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: '600' },
  activityTime: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  actionList: { gap: Spacing.md },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.gold,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  primaryActionText: { fontSize: Typography.base, fontWeight: '900', color: '#000' },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderPrimary,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
  },
  secondaryActionText: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  adminRow: { flexDirection: 'row', gap: Spacing.md },
  adminButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.goldLight,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  adminButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
