import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';
import { Colors, Spacing, Typography, Radius } from '../theme';
import LoadingScreen from '../components/LoadingScreen';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function formatDate(ts: number): string {
  if (!ts) return '—';
  const diff = Date.now() - ts * 1000;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function positionLabel(pos: number | null): string {
  if (!pos) return '—';
  if (pos === 1) return '🥇 Champion';
  if (pos === 2) return '🥈 Runner Up';
  if (pos === 3) return '🥉 3rd Place';
  return `#${pos} Placed`;
}

function positionColor(pos: number | null): string {
  if (pos === 1) return Colors.gold;
  if (pos === 2) return Colors.silver;
  if (pos === 3) return '#fb923c';
  return Colors.textSecondary;
}

function borderLeftColor(pos: number | null): string {
  if (pos === 1) return Colors.gold;
  if (pos === 2) return Colors.silver;
  if (pos === 3) return '#fb923c';
  return Colors.borderPrimary;
}

function MatchDrilldown({ match }: { match: any }) {
  const allParticipants = new Map<number, string>();
  match.rounds.forEach((r: any) =>
    r.all_results.forEach((res: any) =>
      allParticipants.set(res.user_id, res.username || res.full_name)
    )
  );

  const userTotals: Record<number, number> = {};
  match.rounds.forEach((r: any) =>
    r.all_results.forEach((res: any) => {
      userTotals[res.user_id] = (userTotals[res.user_id] || 0) + res.points;
    })
  );

  const sorted = Array.from(allParticipants.entries()).sort(
    ([aId], [bId]) => (userTotals[bId] || 0) - (userTotals[aId] || 0)
  );

  return (
    <View style={styles.drilldown}>
      <Text style={styles.drilldownTitle}>Match Breakdown — All Rounds</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.tableCellHeader, { width: 120 }]}>Legend</Text>
            {match.rounds.map((r: any) => (
              <Text key={r.round_number} style={[styles.tableCell, styles.tableCellHeader, styles.tableCellCenter]}>
                R{r.round_number}
              </Text>
            ))}
            <Text style={[styles.tableCell, styles.tableCellHeader, styles.tableCellRight, { color: Colors.gold }]}>
              Total
            </Text>
          </View>
          {/* Rows */}
          {sorted.map(([userId, username]) => (
            <View key={userId} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: 120, color: Colors.textPrimary, fontWeight: '700' }]}>
                {username}
              </Text>
              {match.rounds.map((r: any) => {
                const perf = r.all_results.find((res: any) => res.user_id === userId);
                const isFirst = perf?.position === 1;
                return (
                  <Text
                    key={r.round_number}
                    style={[
                      styles.tableCell,
                      styles.tableCellCenter,
                      { color: isFirst ? Colors.gold : Colors.textSecondary, fontWeight: '700' },
                    ]}
                  >
                    {isFirst ? '🥇' : ''}{perf ? perf.points : '—'}
                  </Text>
                );
              })}
              <Text style={[styles.tableCell, styles.tableCellRight, { color: Colors.gold, fontWeight: '900' }]}>
                {userTotals[userId] || 0}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function MatchCard({ match, index }: { match: any; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <View style={[styles.matchCard, { borderLeftColor: borderLeftColor(match.my_best_position) }]}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.8} style={styles.matchHeader}>
        <View style={styles.matchIconBox}>
          <Ionicons name="trophy" size={18} color={Colors.gold} />
        </View>
        <View style={styles.matchInfo}>
          <View style={styles.matchNameRow}>
            <Text style={styles.matchGroupName}>{match.group_name}</Text>
            <View style={[styles.positionBadge, { borderColor: positionColor(match.my_best_position) + '40' }]}>
              <Text style={[styles.positionBadgeText, { color: positionColor(match.my_best_position) }]}>
                {positionLabel(match.my_best_position)}
              </Text>
            </View>
          </View>
          <View style={styles.matchMeta}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="sword" size={12} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{match.total_rounds} Rounds</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={12} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{match.my_total_points} pts</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time" size={12} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{formatDate(match.played_at)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.expandBtn}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {expanded && <MatchDrilldown match={match} />}
    </View>
  );
}

export default function HistoryScreen() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/games/history/user');
        setMatches(res.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load match history.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingScreen message="Loading archives..." />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            Battle <Text style={{ color: Colors.gold }}>Archives</Text>
          </Text>
          <Text style={styles.subtitle}>
            Your complete match history and performance ledger.
          </Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {matches.length === 0 && !error ? (
          <View style={styles.empty}>
            <Ionicons name="book" size={48} color={Colors.textSecondary} style={{ opacity: 0.2 }} />
            <Text style={styles.emptyText}>No battles recorded yet. Enter the Arena!</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {matches.map((match, i) => (
              <MatchCard key={match.game_id || i} match={match} index={i} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing['2xl'], gap: Spacing['2xl'], paddingBottom: Spacing['5xl'] },
  header: {},
  title: { fontSize: Typography['3xl'], fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 6 },
  errorBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  errorText: { flex: 1, color: Colors.error, fontSize: Typography.sm },
  list: { gap: Spacing.md },
  matchCard: {
    backgroundColor: Colors.white5,
    borderWidth: 1,
    borderColor: Colors.borderPrimary,
    borderLeftWidth: 4,
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  matchIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: Colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  matchInfo: { flex: 1 },
  matchNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  matchGroupName: { fontSize: Typography.base, fontWeight: '900', color: Colors.textPrimary },
  positionBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: Colors.white5,
  },
  positionBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  matchMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.borderPrimary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.white5,
    marginTop: 4,
  },
  drilldown: {
    borderTopWidth: 1,
    borderTopColor: Colors.white10,
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  drilldownTitle: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.black30,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.white5,
  },
  tableCell: { minWidth: 50, paddingHorizontal: 8, fontSize: 12, color: Colors.textSecondary },
  tableCellHeader: { fontWeight: '900', textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 },
  tableCellCenter: { textAlign: 'center' },
  tableCellRight: { textAlign: 'right', minWidth: 60 },
  empty: { alignItems: 'center', paddingVertical: Spacing['5xl'], gap: 12 },
  emptyText: { fontSize: Typography.base, color: Colors.textSecondary, fontStyle: 'italic', textAlign: 'center' },
});
