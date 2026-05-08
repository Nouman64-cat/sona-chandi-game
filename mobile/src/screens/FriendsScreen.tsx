import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { decodeJwtPayload } from '../utils/jwt';
import { Colors, Spacing, Typography, Radius } from '../theme';
import AvatarImage from '../components/AvatarImage';
import LoadingScreen from '../components/LoadingScreen';

export default function FriendsScreen() {
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  useEffect(() => { fetchData(); }, []);

  const getUserId = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return null;
    return decodeJwtPayload(token).sub;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const userId = await getUserId();
      if (!userId) return;
      const [friendsRes, reqRes] = await Promise.all([
        api.get(`/friends/${userId}`),
        api.get(`/friends/${userId}/requests`),
      ]);
      setFriends(friendsRes.data);
      setRequests(reqRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requesterId: number) => {
    setActingId(requesterId);
    try {
      const userId = await getUserId();
      await api.post(`/friends/${userId}/accept/${requesterId}`);
      const accepted = requests.find((r) => r.id === requesterId);
      setRequests((r) => r.filter((x) => x.id !== requesterId));
      if (accepted) setFriends((f) => [...f, accepted]);
    } catch { }
    finally { setActingId(null); }
  };

  const declineRequest = async (requesterId: number) => {
    setActingId(requesterId);
    try {
      const userId = await getUserId();
      await api.post(`/friends/${userId}/decline/${requesterId}`);
      setRequests((r) => r.filter((x) => x.id !== requesterId));
    } catch { }
    finally { setActingId(null); }
  };

  const removeFriend = async (friendId: number) => {
    Alert.alert('Remove Friend', 'Are you sure you want to remove this ally?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setRemovingId(friendId);
          try {
            const userId = await getUserId();
            await api.delete(`/friends/${userId}/remove/${friendId}`);
            setFriends((f) => f.filter((x) => x.id !== friendId));
          } catch { }
          finally { setRemovingId(null); }
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen message="Loading alliance..." />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            The <Text style={{ color: Colors.silver }}>Alliance</Text>
          </Text>
          <Text style={styles.subtitle}>
            Security clearance managed. Consensual connections only.
          </Text>
        </View>

        {/* Incoming Requests */}
        {requests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.sectionLabel}>Incoming Transmissions</Text>
            </View>
            <View style={styles.list}>
              {requests.map((req) => (
                <View key={req.id} style={[styles.card, styles.requestCard]}>
                  <AvatarImage
                    uri={req.profile_picture_url}
                    name={req.username}
                    size={48}
                    borderRadius={12}
                    style={{ backgroundColor: Colors.gold }}
                  />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{req.full_name}</Text>
                    <Text style={styles.cardSub}>Requesting clearance...</Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      onPress={() => acceptRequest(req.id)}
                      disabled={actingId === req.id}
                      style={styles.acceptBtn}
                    >
                      {actingId === req.id ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => declineRequest(req.id)}
                      disabled={actingId === req.id}
                      style={styles.declineBtn}
                    >
                      <Ionicons name="close" size={18} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Active Alliance */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Active Alliance</Text>
          <View style={styles.list}>
            {friends.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="shield" size={40} color={Colors.textSecondary} style={{ opacity: 0.2 }} />
                </View>
                <Text style={styles.emptyText}>
                  The Alliance is currently empty. Start transmissions via search.
                </Text>
              </View>
            ) : (
              friends.map((friend) => (
                <View key={friend.id} style={styles.card}>
                  <AvatarImage
                    uri={friend.profile_picture_url}
                    name={friend.username}
                    size={48}
                    borderRadius={12}
                  />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{friend.full_name}</Text>
                    <Text style={styles.cardSub}>@{friend.username}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeFriend(friend.id)}
                    disabled={removingId === friend.id}
                    style={styles.removeBtn}
                  >
                    {removingId === friend.id ? (
                      <ActivityIndicator size="small" color={Colors.error} />
                    ) : (
                      <Ionicons name="person-remove" size={18} color={Colors.error} />
                    )}
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing['2xl'], gap: Spacing['3xl'], paddingBottom: Spacing['5xl'] },
  header: {},
  title: { fontSize: Typography['3xl'], fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 6 },
  section: { gap: Spacing.md },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4,
    color: Colors.textSecondary,
  },
  list: { gap: Spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
  },
  requestCard: {
    borderColor: 'rgba(212,175,55,0.2)',
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  cardSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  requestActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: {
    paddingHorizontal: Spacing.lg,
    height: 40,
    borderRadius: Radius.xl,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: { fontSize: Typography.sm, fontWeight: '800', color: '#000' },
  declineBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.xl,
    backgroundColor: Colors.white5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.xl,
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingVertical: Spacing['5xl'], gap: 16 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
