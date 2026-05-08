import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { decodeJwtPayload } from '../utils/jwt';
import { Colors, Spacing, Typography, Radius } from '../theme';
import AvatarImage from '../components/AvatarImage';
import GoldButton from '../components/GoldButton';
import LoadingScreen from '../components/LoadingScreen';

export default function GroupsScreen() {
  const navigation = useNavigation<any>();
  const [groups, setGroups] = useState<any[]>([]);
  const [liveGroupIds, setLiveGroupIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const [showJoin, setShowJoin] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [activeGameId, setActiveGameId] = useState<number | null>(null);
  const [startingGame, setStartingGame] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    init();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      pollRef.current = setInterval(() => refreshGroupData(selectedGroup.id), 3000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedGroup]);

  const init = async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      const p = decodeJwtPayload(token);
      setCurrentUserId(Number(p.sub));
    }
    await Promise.all([fetchGroups(), fetchFriends()]);
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups/');
      const fetched: any[] = res.data;
      setGroups(fetched);
      // Check which groups have live games
      const liveChecks = await Promise.allSettled(
        fetched.map((g) => api.get(`/games/state/${g.id}`))
      );
      const liveIds = new Set<number>();
      liveChecks.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value.data?.status === 'active') {
          liveIds.add(fetched[idx].id);
        }
      });
      setLiveGroupIds(liveIds);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const p = decodeJwtPayload(token);
      const res = await api.get(`/friends/${p.sub}`);
      setFriends(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshGroupData = async (groupId: number) => {
    try {
      const ts = Date.now();
      const [membersRes, gameRes] = await Promise.all([
        api.get(`/groups/${groupId}/members?t=${ts}`),
        api.get(`/games/state/${groupId}?t=${ts}`),
      ]);
      setGroupMembers(membersRes.data);
      const isActive = gameRes.data?.status === 'active';
      if (isActive) {
        const gid = gameRes.data.game_id;
        setActiveGameId(gid);
        setLiveGroupIds((prev) => new Set([...prev, groupId]));
      } else {
        setActiveGameId(null);
        setLiveGroupIds((prev) => {
          const next = new Set(prev);
          next.delete(groupId);
          return next;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectGroup = async (group: any) => {
    setSelectedGroup(group);
    setGroupMembers([]);
    setActiveGameId(null);
    try {
      const [membersRes, gameRes] = await Promise.all([
        api.get(`/groups/${group.id}/members`),
        api.get(`/games/state/${group.id}`),
      ]);
      setGroupMembers(membersRes.data);
      if (gameRes.data?.status === 'active') {
        setActiveGameId(gameRes.data.game_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post(`/groups/?creator_id=${currentUserId}`, {
        name: newGroupName,
        description: newGroupDesc,
      });
      setGroups((g) => [...g, res.data]);
      setShowCreate(false);
      setNewGroupName('');
      setNewGroupDesc('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to create group.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) return;
    setJoining(true);
    try {
      const res = await api.post(`/groups/join/${inviteCode}`);
      Alert.alert('Joined!', res.data.message || 'You joined the squad.');
      setShowJoin(false);
      setInviteCode('');
      fetchGroups();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to join squad.');
    } finally {
      setJoining(false);
    }
  };

  const handleStartGame = async () => {
    if (!selectedGroup || !currentUserId) return;
    setStartingGame(true);
    try {
      await api.post(`/games/start/${selectedGroup.id}?requestor_id=${currentUserId}`);
      await refreshGroupData(selectedGroup.id);
      // Auto-enter the arena after starting
      setTimeout(() => {
        setSelectedGroup(null);
        navigation.navigate('GameArena', {
          groupId: selectedGroup.id,
          currentUserId,
          groupMembers,
        });
      }, 400);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to start match.');
    } finally {
      setStartingGame(false);
    }
  };

  const handleEnterArena = () => {
    if (!selectedGroup || !currentUserId) return;
    const gid = selectedGroup.id;
    const uid = currentUserId;
    const members = groupMembers;
    setSelectedGroup(null);
    // Small delay to let modal close before navigating
    setTimeout(() => {
      navigation.navigate('GameArena', {
        groupId: gid,
        currentUserId: uid,
        groupMembers: members,
      });
    }, 200);
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroup || !currentUserId) return;
    Alert.alert('Leave Squad', `Leave ${selectedGroup.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/groups/${selectedGroup.id}/leave/${currentUserId}`);
            setGroups((g) => g.filter((x) => x.id !== selectedGroup.id));
            setSelectedGroup(null);
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.detail || 'Failed to leave group.');
          }
        },
      },
    ]);
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    Alert.alert('Delete Squad', `Permanently delete ${selectedGroup.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/groups/${selectedGroup.id}`);
            setGroups((g) => g.filter((x) => x.id !== selectedGroup.id));
            setSelectedGroup(null);
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.detail || 'Failed to delete group.');
          }
        },
      },
    ]);
  };

  const handleAddFriend = async (friendId: number) => {
    try {
      await api.post(`/groups/${selectedGroup.id}/add-member/${friendId}`);
      await refreshGroupData(selectedGroup.id);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to add member.');
    }
  };

  const handleRefreshBeacon = async () => {
    Alert.alert('Recalibrate Beacon', 'Invalidate all existing invite links?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Recalibrate',
        onPress: async () => {
          try {
            const res = await api.post(`/groups/${selectedGroup.id}/beacon/refresh`);
            setSelectedGroup((g: any) => ({ ...g, invite_code: res.data.invite_code }));
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.detail || 'Failed to refresh beacon.');
          }
        },
      },
    ]);
  };

  const copyInviteCode = () => {
    Clipboard.setString(selectedGroup.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setReadyStatus = async (isReady: boolean) => {
    try {
      await api.post(`/groups/${selectedGroup.id}/ready?is_ready=${isReady}`);
      await refreshGroupData(selectedGroup.id);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to update readiness.');
    }
  };

  const isOwner = selectedGroup && currentUserId && Number(selectedGroup.creator_id) === Number(currentUserId);
  const memberIds = new Set(groupMembers.map((m: any) => m.id));
  const addableFriends = friends.filter((f) => !memberIds.has(f.id));

  if (loading) return <LoadingScreen message="Loading squads..." />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Your <Text style={{ color: Colors.gold }}>Squads</Text>
          </Text>
          <Text style={styles.subtitle}>Manage teams and enter live matches.</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowCreate(true)} activeOpacity={0.8}>
            <Ionicons name="add-circle" size={20} color={Colors.gold} />
            <Text style={styles.actionBtnText}>New Squad</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnOutline} onPress={() => setShowJoin(true)} activeOpacity={0.8}>
            <Ionicons name="enter-outline" size={20} color={Colors.textPrimary} />
            <Text style={styles.actionBtnOutlineText}>Join by Code</Text>
          </TouchableOpacity>
        </View>

        {/* Live game banner */}
        {liveGroupIds.size > 0 && (
          <View style={styles.liveBanner}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBannerText}>
              {liveGroupIds.size === 1 ? '1 squad' : `${liveGroupIds.size} squads`} with a live match — tap to join!
            </Text>
          </View>
        )}

        {/* Groups list */}
        {groups.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="shield-outline" size={40} color={Colors.textSecondary} style={{ opacity: 0.3 }} />
            </View>
            <Text style={styles.emptyTitle}>No squads yet</Text>
            <Text style={styles.emptyText}>Create a squad or join one with an invite code.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {groups.map((g) => {
              const isLive = liveGroupIds.has(g.id);
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.groupCard, isLive && styles.groupCardLive]}
                  onPress={() => selectGroup(g)}
                  activeOpacity={0.8}
                >
                  {isLive && <View style={styles.cardGlow} />}
                  <View style={[styles.groupIconBox, isLive && styles.groupIconBoxLive]}>
                    {isLive
                      ? <MaterialCommunityIcons name="sword-cross" size={22} color="#000" />
                      : <Ionicons name="shield" size={22} color={Colors.gold} />
                    }
                  </View>
                  <View style={styles.groupInfo}>
                    <View style={styles.groupNameRow}>
                      <Text style={styles.groupName}>{g.name}</Text>
                      {isLive && (
                        <View style={styles.livePill}>
                          <View style={styles.livePillDot} />
                          <Text style={styles.livePillText}>LIVE</Text>
                        </View>
                      )}
                    </View>
                    {g.description ? (
                      <Text style={styles.groupDesc} numberOfLines={1}>{g.description}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Create Group Modal */}
      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Create Squad</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.sheetBody}>
              <TextInput
                style={styles.input}
                value={newGroupName}
                onChangeText={setNewGroupName}
                placeholder="Squad name..."
                placeholderTextColor={Colors.textSecondary}
              />
              <TextInput
                style={[styles.input, styles.inputArea]}
                value={newGroupDesc}
                onChangeText={setNewGroupDesc}
                placeholder="Description (optional)..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
              />
              <GoldButton onPress={handleCreateGroup} loading={creating}>
                Create Squad
              </GoldButton>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join by Code Modal */}
      <Modal visible={showJoin} transparent animationType="slide" onRequestClose={() => setShowJoin(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Join by Invite Code</Text>
              <TouchableOpacity onPress={() => setShowJoin(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.sheetBody}>
              <TextInput
                style={styles.input}
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="Enter invite code..."
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <GoldButton onPress={handleJoinByCode} loading={joining}>
                Join Squad
              </GoldButton>
            </View>
          </View>
        </View>
      </Modal>

      {/* Group Detail Modal */}
      <Modal
        visible={!!selectedGroup}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedGroup(null)}
      >
        <View style={styles.overlay}>
          <View style={[styles.sheet, styles.sheetTall]}>
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <Text style={styles.sheetTitle}>{selectedGroup?.name}</Text>
                {activeGameId && (
                  <View style={styles.livePill}>
                    <View style={styles.livePillDot} />
                    <Text style={styles.livePillText}>LIVE</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => setSelectedGroup(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

              {/* Enter Arena CTA — most prominent when live */}
              {activeGameId ? (
                <TouchableOpacity style={styles.enterArenaBanner} onPress={handleEnterArena} activeOpacity={0.85}>
                  <View style={styles.enterArenaBannerGlow} />
                  <MaterialCommunityIcons name="sword-cross" size={26} color="#000" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.enterArenaTitle}>Match is Live!</Text>
                    <Text style={styles.enterArenaSub}>Tap to enter the arena now</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(0,0,0,0.5)" />
                </TouchableOpacity>
              ) : null}

              {/* Invite code */}
              <View style={styles.inviteRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inviteLabel}>Invite Code</Text>
                  <Text style={styles.inviteCode}>{selectedGroup?.invite_code}</Text>
                </View>
                <TouchableOpacity style={styles.iconBtn} onPress={copyInviteCode}>
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={copied ? Colors.success : Colors.gold} />
                </TouchableOpacity>
                {isOwner && (
                  <TouchableOpacity style={styles.iconBtn} onPress={handleRefreshBeacon}>
                    <Ionicons name="refresh-outline" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Members */}
              <Text style={styles.sectionLabel}>Members</Text>
              <View style={styles.memberList}>
                {groupMembers.length === 0 ? (
                  <ActivityIndicator color={Colors.gold} style={{ padding: 20 }} />
                ) : (
                  groupMembers.map((m: any) => (
                    <View key={m.id} style={styles.memberRow}>
                      <AvatarImage uri={m.profile_picture_url} name={m.username} size={44} borderRadius={12} />
                      <View style={{ flex: 1 }}>
                        <View style={styles.memberNameRow}>
                          <Text style={styles.memberName}>{m.full_name}</Text>
                          {Number(m.id) === Number(selectedGroup?.creator_id) && (
                            <Ionicons name="star" size={13} color={Colors.gold} />
                          )}
                        </View>
                        <Text style={styles.memberUsername}>@{m.username}</Text>
                      </View>
                      {m.is_ready && (
                        <View style={styles.readyBadge}>
                          <Text style={styles.readyBadgeText}>Ready</Text>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </View>

              {/* Add Friends */}
              {isOwner && addableFriends.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>Add Friends</Text>
                  <View style={styles.memberList}>
                    {addableFriends.map((f) => (
                      <View key={f.id} style={styles.memberRow}>
                        <AvatarImage uri={f.profile_picture_url} name={f.username} size={44} borderRadius={12} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.memberName}>{f.full_name}</Text>
                          <Text style={styles.memberUsername}>@{f.username}</Text>
                        </View>
                        <TouchableOpacity style={styles.addBtn} onPress={() => handleAddFriend(f.id)}>
                          <Ionicons name="person-add" size={16} color={Colors.gold} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Arena Actions */}
              {!activeGameId && (
                <View style={styles.arenaActions}>
                  {isOwner ? (
                    <GoldButton
                      onPress={handleStartGame}
                      loading={startingGame}
                      leftIcon={<MaterialCommunityIcons name="sword-cross" size={18} color="#000" />}
                    >
                      Start Match
                    </GoldButton>
                  ) : (
                    <GoldButton
                      onPress={() => setReadyStatus(true)}
                      variant="outline"
                      leftIcon={<Ionicons name="checkmark-circle" size={18} color={Colors.textPrimary} />}
                    >
                      Mark Ready
                    </GoldButton>
                  )}
                </View>
              )}

              {/* Danger zone */}
              <View style={styles.dangerZone}>
                {isOwner ? (
                  <TouchableOpacity style={styles.dangerBtn} onPress={handleDeleteGroup}>
                    <Ionicons name="trash-outline" size={16} color={Colors.error} />
                    <Text style={styles.dangerBtnText}>Delete Squad</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.dangerBtn} onPress={handleLeaveGroup}>
                    <Ionicons name="log-out-outline" size={16} color={Colors.error} />
                    <Text style={styles.dangerBtnText}>Leave Squad</Text>
                  </TouchableOpacity>
                )}
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing['2xl'], gap: Spacing['2xl'], paddingBottom: 48 },

  header: {},
  title: { fontSize: Typography['3xl'], fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 6 },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.gold,
    borderRadius: 16,
    paddingVertical: Spacing.lg,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  actionBtnText: { fontSize: Typography.base, fontWeight: '800', color: '#000' },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: Spacing.lg,
  },
  actionBtnOutlineText: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },

  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
  },
  liveBannerText: { fontSize: Typography.sm, color: Colors.gold, fontWeight: '700' },

  list: { gap: 10 },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: Spacing.xl,
    overflow: 'hidden',
  },
  groupCardLive: {
    borderColor: 'rgba(212,175,55,0.35)',
    backgroundColor: 'rgba(212,175,55,0.05)',
  },
  cardGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  groupIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupIconBoxLive: {
    backgroundColor: Colors.gold,
  },
  groupInfo: { flex: 1 },
  groupNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupName: { fontSize: Typography.base, fontWeight: '800', color: Colors.textPrimary },
  groupDesc: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 3 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  livePillDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.gold },
  livePillText: { fontSize: 9, fontWeight: '900', color: Colors.gold, letterSpacing: 1 },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary },
  emptyText: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center' },

  // Modals / Sheets
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0e0e0e',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 12,
    paddingBottom: 48,
  },
  sheetTall: { maxHeight: '92%' },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sheetTitle: { fontSize: Typography.xl, fontWeight: '900', color: Colors.textPrimary },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: { gap: Spacing.lg },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: Spacing.lg,
    color: Colors.textPrimary,
    fontSize: Typography.base,
  },
  inputArea: { height: 80, textAlignVertical: 'top' },

  // Enter Arena Banner
  enterArenaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.gold,
    borderRadius: 18,
    padding: Spacing['2xl'],
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  enterArenaBannerGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  enterArenaTitle: { fontSize: Typography.lg, fontWeight: '900', color: '#000' },
  enterArenaSub: { fontSize: 11, color: 'rgba(0,0,0,0.55)', marginTop: 2, fontWeight: '600' },

  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  inviteLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  inviteCode: { fontSize: Typography.xl, fontWeight: '900', color: Colors.gold, letterSpacing: 3 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  memberList: { gap: 8, marginBottom: Spacing.xl },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 12,
  },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberName: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  memberUsername: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  readyBadge: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  readyBadgeText: { fontSize: 10, fontWeight: '800', color: '#22c55e' },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(212,175,55,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  arenaActions: { marginBottom: Spacing.xl },

  dangerZone: { marginTop: Spacing.md, marginBottom: Spacing.xl },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: 14,
    padding: Spacing.lg,
  },
  dangerBtnText: { fontSize: Typography.base, fontWeight: '700', color: Colors.error },
});
