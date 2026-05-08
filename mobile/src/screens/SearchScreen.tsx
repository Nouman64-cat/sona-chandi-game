import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { decodeJwtPayload } from '../utils/jwt';
import { Colors, Spacing, Typography, Radius } from '../theme';
import AvatarImage from '../components/AvatarImage';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { performSearch(''); }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const performSearch = async (term: string) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      let url = `/users/search?query=${encodeURIComponent(term)}`;
      if (token) {
        const payload = decodeJwtPayload(token);
        url += `&searcher_id=${payload.sub}`;
      }
      const res = await api.get(url);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async (friendId: number) => {
    setAddingId(friendId);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const payload = decodeJwtPayload(token);
      await api.post(`/friends/${payload.sub}/add/${friendId}`);
      setResults((r) => r.map((u) => (u.id === friendId ? { ...u, is_pending: true } : u)));
    } catch (err) {
      console.error(err);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Find <Text style={{ color: Colors.gold }}>Players</Text>
          </Text>
          <Text style={styles.subtitle}>Search by name or username.</Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search players..."
            placeholderTextColor={Colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {loading && <ActivityIndicator size="small" color={Colors.gold} />}
        </View>

        {/* Label */}
        <View style={styles.labelRow}>
          <Ionicons name={query ? 'search-outline' : 'sparkles-outline'} size={14} color={Colors.textSecondary} />
          <Text style={styles.labelText}>
            {query ? 'Search Results' : 'Suggested Players'}
          </Text>
        </View>

        {/* Results */}
        <View style={styles.list}>
          {results.map((user) => (
            <View key={user.id} style={styles.card}>
              <AvatarImage
                uri={user.profile_picture_url}
                name={user.username}
                size={50}
                borderRadius={14}
              />
              <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.cardName}>{user.full_name}</Text>
                  {user.is_self && (
                    <View style={styles.selfBadge}>
                      <Text style={styles.selfBadgeText}>You</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardUsername}>@{user.username}</Text>
              </View>

              {!user.is_self && (
                <TouchableOpacity
                  onPress={() => !user.is_friend && !user.is_pending && addFriend(user.id)}
                  disabled={addingId === user.id || user.is_friend || user.is_pending}
                  style={[
                    styles.actionBtn,
                    user.is_friend && styles.actionBtnFriend,
                    user.is_pending && styles.actionBtnPending,
                    !user.is_friend && !user.is_pending && styles.actionBtnAdd,
                  ]}
                >
                  {addingId === user.id ? (
                    <ActivityIndicator size="small" color={Colors.gold} />
                  ) : user.is_friend ? (
                    <Ionicons name="checkmark" size={18} color="#22c55e" />
                  ) : user.is_pending ? (
                    <Text style={styles.pendingText}>Sent</Text>
                  ) : (
                    <Ionicons name="person-add-outline" size={18} color={Colors.gold} />
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {!loading && results.length === 0 && query.length > 0 && (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={44} color={Colors.textSecondary} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyTitle}>No players found</Text>
            <Text style={styles.emptyText}>Try a different name or username.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing['2xl'], gap: Spacing['2xl'], paddingBottom: 48 },

  header: {},
  title: { fontSize: Typography['3xl'], fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 6 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: '500',
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -6,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
    color: Colors.textSecondary,
  },

  list: { gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  cardUsername: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },

  selfBadge: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  selfBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.gold, textTransform: 'uppercase', letterSpacing: 1 },

  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnAdd: { backgroundColor: 'rgba(212,175,55,0.1)' },
  actionBtnFriend: { backgroundColor: 'rgba(34,197,94,0.1)' },
  actionBtnPending: { backgroundColor: 'rgba(212,175,55,0.08)', width: 'auto', paddingHorizontal: 12 },
  pendingText: { fontSize: 11, fontWeight: '700', color: Colors.gold },

  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary },
  emptyText: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center' },
});
