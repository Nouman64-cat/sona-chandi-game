import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { decodeJwtPayload } from '../../utils/jwt';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import AvatarImage from '../../components/AvatarImage';
import LoadingScreen from '../../components/LoadingScreen';

interface UserRecord {
  id: number;
  full_name: string;
  username: string;
  email: string;
  gender: string;
  number: string;
  is_admin: boolean;
}

export default function AdminUsersScreen() {
  const navigation = useNavigation();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { init(); }, []);

  const init = async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      const p = decodeJwtPayload(token);
      setCurrentUserId(Number(p.sub));
    }
    fetchUsers();
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to access the Legend Registry.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurge = (user: UserRecord) => {
    if (user.id === currentUserId) return;
    Alert.alert(
      'Purge Legend',
      `DANGER: Permanently purge ${user.full_name} (@${user.username})? This will dissolve all their squad memberships and friendships.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purge',
          style: 'destructive',
          onPress: async () => {
            setPurging(user.id);
            setError(null);
            try {
              await api.delete(`/admin/users/${user.id}`);
              setUsers((prev) => prev.filter((u) => u.id !== user.id));
              showSuccess(`Legend @${user.username} has been purged.`);
            } catch (err: any) {
              setError(err.response?.data?.detail || 'Purge command failed.');
            } finally {
              setPurging(null);
            }
          },
        },
      ]
    );
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingScreen message="Loading legend registry..." />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Legend Registry</Text>
        <View style={{ width: 38 }} />
      </View>

      {successMsg && (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      )}
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search by name, username, or email..."
          placeholderTextColor={Colors.textSecondary}
          autoCapitalize="none"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.countLabel}>{filtered.length} Legends Registered</Text>

        {filtered.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <AvatarImage name={user.username} size={44} borderRadius={11} />
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{user.full_name}</Text>
                {user.is_admin && (
                  <View style={styles.adminBadge}>
                    <Ionicons name="shield-checkmark" size={10} color={Colors.gold} />
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
              </View>
              <Text style={styles.userUsername}>@{user.username}</Text>
              <View style={styles.userMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="mail" size={11} color={Colors.textSecondary} />
                  <Text style={styles.metaText} numberOfLines={1}>{user.email}</Text>
                </View>
                {user.number ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="call" size={11} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{user.number}</Text>
                  </View>
                ) : null}
                <View style={styles.metaItem}>
                  <Ionicons name="person" size={11} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{user.gender}</Text>
                </View>
                <Text style={styles.userId}>ID:{user.id}</Text>
              </View>
            </View>

            {user.id !== currentUserId && (
              <TouchableOpacity
                style={styles.purgeBtn}
                onPress={() => handlePurge(user)}
                disabled={purging === user.id}
              >
                {purging === user.id ? (
                  <ActivityIndicator size="small" color={Colors.error} />
                ) : (
                  <Ionicons name="trash" size={18} color={Colors.error} />
                )}
              </TouchableOpacity>
            )}
            {user.id === currentUserId && (
              <View style={styles.selfMark}>
                <Text style={styles.selfMarkText}>You</Text>
              </View>
            )}
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="search" size={40} color={Colors.textSecondary} style={{ opacity: 0.2 }} />
            <Text style={styles.emptyText}>No legends found.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderPrimary,
  },
  backBtn: { padding: 8 },
  title: { flex: 1, fontSize: Typography.lg, fontWeight: '900', color: Colors.textPrimary, textAlign: 'center' },
  successBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.successLight,
    padding: Spacing.md,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    borderRadius: Radius.xl,
  },
  successText: { flex: 1, color: Colors.success, fontSize: Typography.sm, fontWeight: '600' },
  errorBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    padding: Spacing.md,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    borderRadius: Radius.xl,
  },
  errorText: { flex: 1, color: Colors.error, fontSize: Typography.sm },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white5,
    borderWidth: 1,
    borderColor: Colors.borderPrimary,
    borderRadius: Radius['2xl'],
    margin: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  scroll: { paddingHorizontal: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing['5xl'] },
  countLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
  },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 },
  userName: { fontSize: Typography.base, fontWeight: '800', color: Colors.textPrimary },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.goldLight,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  adminBadgeText: { fontSize: 9, fontWeight: '900', color: Colors.gold },
  userUsername: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: 8 },
  userMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', maxWidth: 160 },
  userId: { fontSize: 10, color: Colors.borderPrimary, fontFamily: 'monospace' },
  purgeBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  selfMark: {
    backgroundColor: Colors.goldLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 2,
  },
  selfMarkText: { fontSize: 11, fontWeight: '800', color: Colors.gold },
  empty: { alignItems: 'center', paddingVertical: Spacing['5xl'], gap: 12 },
  emptyText: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center' },
});
