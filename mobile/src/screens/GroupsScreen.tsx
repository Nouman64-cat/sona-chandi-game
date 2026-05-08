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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../services/api';
import { decodeJwtPayload } from '../utils/jwt';
import { Colors, Spacing, Typography, Radius } from '../theme';
import { RootStackParamList } from '../navigation/types';
import AvatarImage from '../components/AvatarImage';
import GlassCard from '../components/GlassCard';
import GoldButton from '../components/GoldButton';
import LoadingScreen from '../components/LoadingScreen';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function GroupsScreen() {
  const navigation = useNavigation<Nav>();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Join by code
  const [showJoin, setShowJoin] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  // Selected group modal
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [activeGameId, setActiveGameId] = useState<number | null>(null);
  const [startingGame, setStartingGame] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ignoredGameIdRef = useRef<number | null>(null);

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
      setGroups(res.data);
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
      if (gameRes.data?.status === 'active') {
        if (gameRes.data.game_id !== ignoredGameIdRef.current) {
          setActiveGameId(gameRes.data.game_id);
        }
      } else {
        setActiveGameId(null);
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
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to start match.');
    } finally {
      setStartingGame(false);
    }
  };

  const handleEnterArena = () => {
    if (!selectedGroup || !currentUserId) return;
    navigation.navigate('GameArena', {
      groupId: selectedGroup.id,
      currentUserId,
      groupMembers,
    });
    setSelectedGroup(null);
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroup || !currentUserId) return;
    Alert.alert('Leave Group', `Are you sure you want to leave ${selectedGroup.name}?`, [
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
    Alert.alert('Delete Group', `Permanently delete ${selectedGroup.name}?`, [
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
    Alert.alert(
      'Recalibrate Beacon',
      'This will invalidate all existing invite links. Proceed?',
      [
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
      ]
    );
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Squad <Text style={{ color: Colors.gold }}>Management</Text>
          </Text>
          <Text style={styles.subtitle}>Manage your squads and launch matches.</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowCreate(true)}>
            <Ionicons name="add" size={20} color={Colors.gold} />
            <Text style={styles.actionBtnText}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowJoin(true)}>
            <Ionicons name="enter" size={20} color={Colors.gold} />
            <Text style={styles.actionBtnText}>Join by Code</Text>
          </TouchableOpacity>
        </View>

        {/* Groups list */}
        {groups.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="shield" size={48} color={Colors.textSecondary} style={{ opacity: 0.2 }} />
            <Text style={styles.emptyText}>No squads yet. Create or join one!</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {groups.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={styles.groupCard}
                onPress={() => selectGroup(g)}
                activeOpacity={0.8}
              >
                <View style={styles.groupIconBox}>
                  <Ionicons name="shield" size={24} color={Colors.gold} />
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{g.name}</Text>
                  {g.description ? (
                    <Text style={styles.groupDesc} numberOfLines={1}>{g.description}</Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Group Modal */}
      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Squad</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TextInput
                style={styles.modalInput}
                value={newGroupName}
                onChangeText={setNewGroupName}
                placeholder="Squad name..."
                placeholderTextColor={Colors.textSecondary}
              />
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
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
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join by Invite Code</Text>
              <TouchableOpacity onPress={() => setShowJoin(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TextInput
                style={styles.modalInput}
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="Enter invite code..."
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
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
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, styles.groupDetailModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedGroup?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedGroup(null)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Invite code */}
              <View style={styles.inviteRow}>
                <View style={styles.inviteCodeBox}>
                  <Text style={styles.inviteCodeLabel}>Invite Code</Text>
                  <Text style={styles.inviteCode}>{selectedGroup?.invite_code}</Text>
                </View>
                <TouchableOpacity style={styles.copyBtn} onPress={copyInviteCode}>
                  <Ionicons name={copied ? 'checkmark' : 'copy'} size={20} color={Colors.gold} />
                </TouchableOpacity>
                {isOwner && (
                  <TouchableOpacity style={styles.copyBtn} onPress={handleRefreshBeacon}>
                    <Ionicons name="refresh" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Members */}
              <Text style={styles.memberTitle}>Members</Text>
              <View style={styles.memberList}>
                {groupMembers.map((m: any) => {
                  const isOnline = m.is_ready !== undefined ? true : false;
                  return (
                    <View key={m.id} style={styles.memberRow}>
                      <AvatarImage uri={m.profile_picture_url} name={m.username} size={40} borderRadius={10} />
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{m.full_name}</Text>
                        <Text style={styles.memberUsername}>@{m.username}</Text>
                      </View>
                      {m.is_ready && (
                        <View style={styles.readyBadge}>
                          <Text style={styles.readyBadgeText}>Ready</Text>
                        </View>
                      )}
                      {Number(m.id) === Number(selectedGroup?.creator_id) && (
                        <Ionicons name="star" size={16} color={Colors.gold} />
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Add Friends */}
              {isOwner && addableFriends.length > 0 && (
                <>
                  <Text style={styles.memberTitle}>Add Friends</Text>
                  <View style={styles.memberList}>
                    {addableFriends.map((f) => (
                      <View key={f.id} style={styles.memberRow}>
                        <AvatarImage uri={f.profile_picture_url} name={f.username} size={40} borderRadius={10} />
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{f.full_name}</Text>
                          <Text style={styles.memberUsername}>@{f.username}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.addMemberBtn}
                          onPress={() => handleAddFriend(f.id)}
                        >
                          <Ionicons name="person-add" size={18} color={Colors.gold} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Arena Actions */}
              <View style={styles.arenaActions}>
                {activeGameId ? (
                  <GoldButton onPress={handleEnterArena}>
                    <MaterialCommunityIcons name="sword-cross" size={18} color="#000" />
                    {'  '}Enter Arena
                  </GoldButton>
                ) : isOwner ? (
                  <GoldButton onPress={handleStartGame} loading={startingGame}>
                    <MaterialCommunityIcons name="sword-cross" size={18} color="#000" />
                    {'  '}Start Match
                  </GoldButton>
                ) : (
                  <View style={styles.readyActions}>
                    <GoldButton onPress={() => setReadyStatus(true)} style={{ flex: 1 }}>
                      Mark Ready
                    </GoldButton>
                  </View>
                )}
              </View>

              {/* Group management */}
              <View style={styles.groupActions}>
                {isOwner ? (
                  <TouchableOpacity style={styles.dangerBtn} onPress={handleDeleteGroup}>
                    <Ionicons name="trash" size={18} color={Colors.error} />
                    <Text style={styles.dangerBtnText}>Delete Group</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.dangerBtn} onPress={handleLeaveGroup}>
                    <Ionicons name="log-out" size={18} color={Colors.error} />
                    <Text style={styles.dangerBtnText}>Leave Group</Text>
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
  scroll: { padding: Spacing['2xl'], gap: Spacing['2xl'], paddingBottom: Spacing['5xl'] },
  header: {},
  title: { fontSize: Typography['3xl'], fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 6 },
  actionRow: { flexDirection: 'row', gap: Spacing.md },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.goldLight,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
    borderRadius: Radius['2xl'],
    paddingVertical: Spacing.lg,
  },
  actionBtnText: { fontSize: Typography.base, fontWeight: '700', color: Colors.gold },
  list: { gap: Spacing.md },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
  },
  groupIconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: { flex: 1 },
  groupName: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  groupDesc: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: Spacing['5xl'], gap: 12 },
  emptyText: { fontSize: Typography.base, color: Colors.textSecondary, fontStyle: 'italic' },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.black80,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.backgroundSecondary,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    borderWidth: 1,
    borderColor: Colors.borderPrimary,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['2xl'],
    paddingBottom: 48,
  },
  groupDetailModal: { maxHeight: '90%' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  modalTitle: { fontSize: Typography.xl, fontWeight: '900', color: Colors.textPrimary },
  modalBody: { gap: Spacing.lg },
  modalInput: {
    backgroundColor: Colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: Colors.borderPrimary,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    color: Colors.textPrimary,
    fontSize: Typography.base,
  },
  modalTextArea: { height: 80, textAlignVertical: 'top' },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white5,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  inviteCodeBox: { flex: 1 },
  inviteCodeLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  inviteCode: { fontSize: Typography.lg, fontWeight: '900', color: Colors.gold, letterSpacing: 2 },
  copyBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberTitle: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
  },
  memberList: { gap: 8, marginBottom: Spacing.xl },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white5,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  memberUsername: { fontSize: 11, color: Colors.textSecondary },
  readyBadge: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  readyBadgeText: { fontSize: 10, fontWeight: '800', color: '#22c55e' },
  addMemberBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arenaActions: { marginBottom: Spacing.xl },
  readyActions: { flexDirection: 'row', gap: 12 },
  groupActions: { marginTop: Spacing.md },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
  },
  dangerBtnText: { fontSize: Typography.base, fontWeight: '700', color: Colors.error },
});
