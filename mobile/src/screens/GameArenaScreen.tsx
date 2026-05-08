import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../services/api';
import { Colors, Spacing, Typography, Radius } from '../theme';
import { RootStackParamList } from '../navigation/types';
import AvatarImage from '../components/AvatarImage';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'GameArena'>;
  route: RouteProp<RootStackParamList, 'GameArena'>;
};

const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CARD_ICONS: Record<string, any> = {
  Shield: 'shield',
  Swords: 'sword-cross',
  Crown: 'crown',
  Zap: 'lightning-bolt',
  Flame: 'fire',
  Trophy: 'trophy',
  Target: 'target',
  Gem: 'diamond',
  Anchor: 'anchor',
  Sparkles: 'star-four-points',
  Coins: 'cash-multiple',
  CircleDollarSign: 'currency-usd-circle',
  Award: 'medal',
  Star: 'star',
  Component: 'puzzle',
};

function CardIcon({ name, size = 16, color = '#fff' }: { name: string; size?: number; color?: string }) {
  const iconName = CARD_ICONS[name];
  if (!iconName) return <MaterialCommunityIcons name="shield" size={size} color={color} />;
  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
}

export default function GameArenaScreen({ navigation, route }: Props) {
  const { groupId, currentUserId, groupMembers } = route.params;

  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [playingCard, setPlayingCard] = useState<number | null>(null);
  const [markingReady, setMarkingReady] = useState(false);
  const [isInactive, setIsInactive] = useState(false);

  const lastActivityRef = useRef(Date.now());
  const lastResultsCountRef = useRef(0);
  const lastGameIdRef = useRef<number | null>(null);
  const initializedRef = useRef(false);
  const seenGameIdsRef = useRef(new Set<number>());
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hbIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Roulette state
  const [showRoulette, setShowRoulette] = useState(false);
  const [rouletteHighlight, setRouletteHighlight] = useState(0);
  const [rouletteWinner, setRouletteWinner] = useState<any>(null);

  // Winner flash
  const [newWinner, setNewWinner] = useState<any>(null);
  const winnerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchGameState();
    startPolling();

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        lastActivityRef.current = Date.now();
        if (isInactive) {
          setIsInactive(false);
          fetchGameState();
        }
      }
    });

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (hbIntervalRef.current) clearInterval(hbIntervalRef.current);
      appStateSub.remove();
    };
  }, []);

  const startPolling = () => {
    pollIntervalRef.current = setInterval(() => {
      if (Date.now() - lastActivityRef.current > INACTIVITY_TIMEOUT) {
        setIsInactive(true);
        return;
      }
      fetchGameState();
    }, 2000);

    hbIntervalRef.current = setInterval(() => {
      if (Date.now() - lastActivityRef.current > INACTIVITY_TIMEOUT) return;
      sendHeartbeat();
    }, 3000);

    sendHeartbeat();
  };

  const sendHeartbeat = async () => {
    try {
      await api.post(`/groups/${groupId}/heartbeat`);
    } catch {}
  };

  const fetchGameState = useCallback(async () => {
    try {
      const res = await api.get(`/games/state/${groupId}`);
      const newState = res.data;
      const newResults = newState.results || [];
      const gameId = newState.game_id;

      if (gameId && lastGameIdRef.current !== null && gameId !== lastGameIdRef.current) {
        lastResultsCountRef.current = 0;
      }
      lastGameIdRef.current = gameId;

      if (!initializedRef.current) {
        lastResultsCountRef.current = newResults.length;
        initializedRef.current = true;
      } else if (newResults.length > lastResultsCountRef.current) {
        const newest = [...newResults].sort((a: any, b: any) => b.created_at - a.created_at)[0];
        if (newest) {
          const member = groupMembers.find((m) => Number(m.id) === Number(newest.user_id));
          showWinnerFlash({ ...newest, name: member?.full_name || 'A Legend' });
        }
        lastResultsCountRef.current = newResults.length;
      }

      setGameState(newState);

      // Roulette for fresh games
      const now = Math.floor(Date.now() / 1000);
      const isFresh = newState.created_at && (now - newState.created_at) < 20;
      if (isFresh && gameId && !seenGameIdsRef.current.has(gameId) && newState.status === 'active') {
        seenGameIdsRef.current.add(gameId);
        triggerRoulette(newState.current_turn_user_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [groupId, groupMembers]);

  const showWinnerFlash = (winner: any) => {
    setNewWinner(winner);
    Animated.sequence([
      Animated.timing(winnerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(3500),
      Animated.timing(winnerOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => setNewWinner(null));
  };

  const triggerRoulette = (firstUserId: number) => {
    const winnerIdx = groupMembers.findIndex((m) => Number(m.id) === Number(firstUserId));
    if (winnerIdx === -1 || groupMembers.length === 0) return;

    setShowRoulette(true);
    setRouletteWinner(null);

    const schedule: number[] = [];
    let elapsed = 0;
    let step = 80;
    while (elapsed < 1200) { schedule.push(step); elapsed += step; }
    for (const s of [120, 160, 200, 260, 320, 400, 500]) {
      schedule.push(s);
      elapsed += s;
      if (elapsed >= 3200) break;
    }

    let currentIdx = 0;
    let i = 0;

    const runStep = () => {
      if (i < schedule.length - 1) {
        currentIdx = (currentIdx + 1) % groupMembers.length;
        setRouletteHighlight(currentIdx);
        i++;
        setTimeout(runStep, schedule[i]);
      } else {
        setRouletteHighlight(winnerIdx);
        setRouletteWinner(groupMembers[winnerIdx]);
        setTimeout(() => setShowRoulette(false), 2500);
      }
    };
    setTimeout(runStep, schedule[0]);
  };

  const handlePlayCard = async () => {
    if (!selectedCardId || !gameState || Number(gameState.current_turn_user_id) !== Number(currentUserId)) return;
    const cardId = selectedCardId;
    setPlayingCard(cardId);
    try {
      await api.post(`/games/${gameState.game_id}/play?card_id=${cardId}&requestor_id=${currentUserId}`);
      setSelectedCardId(null);
      await fetchGameState();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Move failed.');
    } finally {
      setPlayingCard(null);
    }
  };

  const handleEndMatch = () => {
    Alert.alert('End Match', 'Are you sure you want to end the match for everyone?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Match',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/games/${gameState.game_id}/end?requestor_id=${currentUserId}`);
            navigation.goBack();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.detail || 'Termination failed.');
          }
        },
      },
    ]);
  };

  const handleNextRound = () => {
    Alert.alert('Next Round', 'Advance to the next round?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Next Round',
        onPress: async () => {
          try {
            await api.post(`/games/start/${groupId}?requestor_id=${currentUserId}&action=next_round`);
            await fetchGameState();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.detail || 'Failed to start next round.');
          }
        },
      },
    ]);
  };

  const findRecipient = () => {
    if (!gameState) return 'Ally';
    const finishedIds = new Set((gameState.results || []).map((r: any) => Number(r.user_id)));
    let memberIds: number[];
    if (gameState.turn_order) {
      memberIds = gameState.turn_order.split(',').map(Number);
    } else {
      memberIds = groupMembers.map((m: any) => Number(m.id)).sort((a: number, b: number) => a - b);
    }
    const currentIdx = memberIds.indexOf(Number(currentUserId));
    if (currentIdx === -1) return 'Ally';
    let nextIdx = (currentIdx + 1) % memberIds.length;
    while (finishedIds.has(memberIds[nextIdx]) && nextIdx !== currentIdx) {
      nextIdx = (nextIdx + 1) % memberIds.length;
    }
    return groupMembers.find((m: any) => Number(m.id) === memberIds[nextIdx])?.full_name || 'Ally';
  };

  const reEngageArena = () => {
    lastActivityRef.current = Date.now();
    setIsInactive(false);
    fetchGameState();
    sendHeartbeat();
  };

  if (loading && !gameState) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  if (!gameState || gameState.status === 'inactive') {
    return (
      <View style={styles.inactiveCenter}>
        <Ionicons name="shield" size={64} color={Colors.backgroundTertiary} />
        <Text style={styles.inactiveTitle}>No Active Match</Text>
        <Text style={styles.inactiveSub}>Start a game from the squad management menu.</Text>
        <TouchableOpacity style={styles.returnBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.returnBtnText}>Return to HQ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const results = gameState.results || [];
  const isMyTurn = gameState.current_turn_user_id && Number(gameState.current_turn_user_id) === Number(currentUserId);
  const iHaveFinished = results.some((r: any) => Number(r.user_id) === Number(currentUserId));
  const iHaveWon = results.some((r: any) => Number(r.user_id) === Number(currentUserId));

  const playerGroups = groupMembers.map((member, idx) => ({
    ...member,
    cards: (gameState.cards || []).filter((c: any) => Number(c.user_id) === Number(member.id)),
    isCurrentTurn: gameState.current_turn_user_id && Number(gameState.current_turn_user_id) === Number(member.id),
  }));

  // Finished screen
  if (gameState.status === 'finished') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.finishedScroll}>
          <View style={styles.finishedHeader}>
            <View style={styles.trophyBox}>
              <Ionicons name="trophy" size={44} color={Colors.gold} />
            </View>
            <Text style={styles.finishedTitle}>ARENA LEADERBOARD</Text>
            <Text style={styles.finishedSubtitle}>Official Match Standings</Text>
          </View>

          {[...(gameState.results || [])].sort((a: any, b: any) => a.position - b.position).map((res: any, idx: number) => {
            const member = groupMembers.find((m) => Number(m.id) === Number(res.user_id));
            const isChampion = res.position === 1;
            return (
              <View
                key={res.user_id}
                style={[styles.resultCard, isChampion && styles.resultCardChampion]}
              >
                <View style={[styles.resultAvatar, isChampion && styles.resultAvatarChampion]}>
                  <AvatarImage uri={member?.profile_picture_url} name={member?.username} size={48} borderRadius={12} />
                  <View style={[styles.positionBadge, isChampion && styles.positionBadgeChampion]}>
                    <Text style={[styles.positionBadgeText, isChampion && { color: '#000' }]}>#{res.position}</Text>
                  </View>
                </View>
                <View style={styles.resultInfo}>
                  <Text style={[styles.resultName, isChampion && { color: Colors.gold }]}>
                    {member?.full_name || 'Unknown Legend'}
                  </Text>
                  <Text style={styles.resultUsername}>@{member?.username || 'unknown'}</Text>
                </View>
                <View>
                  <Text style={styles.resultPtsLabel}>Scored</Text>
                  <Text style={[styles.resultPts, isChampion && { color: Colors.gold }]}>
                    {res.points} <Text style={{ fontSize: 11, opacity: 0.5 }}>PTS</Text>
                  </Text>
                  {gameState.series_results?.[res.user_id] && (
                    <Text style={styles.seriesTotal}>
                      Total: {gameState.series_results[res.user_id].points} PTS
                    </Text>
                  )}
                </View>
              </View>
            );
          })}

          <View style={styles.finishedActions}>
            <TouchableOpacity style={styles.nextRoundBtn} onPress={handleNextRound}>
              <Ionicons name="refresh" size={18} color={Colors.gold} />
              <Text style={styles.nextRoundBtnText}>Next Round</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.endMatchBtn} onPress={handleEndMatch}>
              <Text style={styles.endMatchBtnText}>End Match</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Winner Flash Banner */}
      {newWinner && (
        <Animated.View style={[styles.winnerBanner, { opacity: winnerOpacity }]}>
          <View style={styles.winnerBannerIcon}>
            <Ionicons name="trophy" size={20} color={Colors.gold} />
          </View>
          <View>
            <Text style={styles.winnerBannerLabel}>Victory Claimed!</Text>
            <Text style={styles.winnerBannerText}>
              {newWinner.name} SECURED{' '}
              {newWinner.position === 1
                ? 'CHAMPION'
                : `#${newWinner.position} POSITION`}!
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.arenaHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.arenaHeaderCenter}>
          <Text style={styles.arenaTitle}>LIVE ARENA</Text>
          <Text style={styles.arenaGameId}>G:{gameState.game_id}</Text>
        </View>
        <TouchableOpacity onPress={handleEndMatch} style={styles.endBtn}>
          <Text style={styles.endBtnText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Player cards */}
      <ScrollView contentContainerStyle={styles.arenaScroll} showsVerticalScrollIndicator={false}>
        {playerGroups.map((player: any) => {
          const playerResult = results.find((r: any) => Number(r.user_id) === Number(player.id));
          const isMe = Number(player.id) === Number(currentUserId);
          const isRevealed = isMe || iHaveFinished;
          const isOnline = gameState.player_presence
            ? gameState.player_presence[String(player.id)] || gameState.player_presence[player.id]
            : true;

          return (
            <View
              key={player.id}
              style={[
                styles.playerSection,
                player.isCurrentTurn && styles.playerSectionActive,
              ]}
            >
              {/* Player header */}
              <View style={styles.playerHeader}>
                <View style={[styles.playerAvatar, player.isCurrentTurn && styles.playerAvatarActive]}>
                  <AvatarImage uri={player.profile_picture_url} name={player.username} size={40} borderRadius={10} />
                  {playerResult && (
                    <View style={styles.playerResultBadge}>
                      <Text style={styles.playerResultBadgeText}>#{playerResult.position}</Text>
                    </View>
                  )}
                  {player.isCurrentTurn && <View style={styles.turnIndicator} />}
                </View>
                <View style={styles.playerInfo}>
                  <Text style={[styles.playerName, player.isCurrentTurn && { color: Colors.gold }]}>
                    {player.full_name}
                  </Text>
                  <View style={styles.playerBadgeRow}>
                    <Text style={[styles.playerRole, isMe && { color: Colors.gold }]}>
                      {isMe ? (iHaveFinished ? 'SPECTATING' : 'YOU') : 'ALLY'}
                    </Text>
                    {player.isCurrentTurn && (
                      <View style={styles.currentTurnBadge}>
                        <Ionicons name="sparkles" size={8} color={Colors.gold} />
                        <Text style={styles.currentTurnText}>CURRENT TURN</Text>
                      </View>
                    )}
                    {iHaveFinished && (
                      <View style={styles.visibleBadge}>
                        <Text style={styles.visibleBadgeText}>👁 VISIBLE</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.cardCount}>{player.cards.length} cards</Text>
              </View>

              {/* Cards */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsRow}>
                {!isOnline && !isMe && (
                  <View style={styles.syncOverlay}>
                    <ActivityIndicator size="small" color={Colors.gold} />
                    <Text style={styles.syncText}>Syncing...</Text>
                  </View>
                )}
                {player.cards.map((card: any) => {
                  const dbColor = card.color;
                  const isValidHex = dbColor && /^#([0-9A-Fa-f]{3,6})$/.test(dbColor);
                  const baseColor = isValidHex ? dbColor : Colors.gold;
                  const isSelected = selectedCardId !== null && Number(selectedCardId) === Number(card.id);
                  const canSelect = isMe && isMyTurn;

                  return (
                    <TouchableOpacity
                      key={card.id}
                      onPress={() => {
                        if (!canSelect) return;
                        setSelectedCardId((prev) =>
                          prev !== null && Number(prev) === Number(card.id) ? null : Number(card.id)
                        );
                      }}
                      activeOpacity={canSelect ? 0.85 : 1}
                      disabled={!!playingCard}
                      style={[
                        styles.card,
                        isRevealed && { backgroundColor: baseColor, borderColor: baseColor },
                        !isRevealed && styles.cardHidden,
                        isSelected && { transform: [{ translateY: -8 }] },
                        playingCard === card.id && { opacity: 0.5 },
                      ]}
                    >
                      {isSelected && (
                        <View style={[styles.cardSelectedGlow, { shadowColor: baseColor }]} />
                      )}
                      {isRevealed ? (
                        <View style={styles.cardContent}>
                          <View style={styles.cardIconWrapper}>
                            <CardIcon name={card.icon} size={20} color="#fff" />
                          </View>
                          <Text style={styles.cardType}>{(card.card_type || '').toUpperCase()}</Text>
                          <Text style={styles.cardValue}>{card.value}</Text>
                        </View>
                      ) : (
                        <View style={styles.cardHiddenContent}>
                          <MaterialCommunityIcons name="shield" size={24} color="rgba(255,255,255,0.15)" />
                        </View>
                      )}
                      {/* Shimmer overlay */}
                      <View style={styles.cardShimmer} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Action Bar */}
      {isMyTurn && (
        <View style={styles.actionBar}>
          {!selectedCardId ? (
            <Text style={styles.actionBarHint}>
              {playerGroups.find((p: any) => Number(p.id) === Number(currentUserId))?.cards.length === 4
                ? 'INITIATE BATTLE... PASS A CARD'
                : 'YOU HOLD INFLUENCE... SELECT TO PASS'}
            </Text>
          ) : (
            <View style={styles.playRow}>
              <View>
                <Text style={styles.playLabel}>Recipient</Text>
                <Text style={styles.playRecipient}>{findRecipient()}</Text>
              </View>
              <TouchableOpacity
                style={[styles.confirmBtn, !!playingCard && { opacity: 0.5 }]}
                onPress={handlePlayCard}
                disabled={!!playingCard}
              >
                {playingCard ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Ionicons name="shield" size={16} color="#000" />
                    <Text style={styles.confirmBtnText}>CONFIRM PASS</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {!isMyTurn && gameState.status === 'active' && (
        <View style={styles.waitingBar}>
          {iHaveWon ? (
            <>
              <Ionicons name="trophy" size={14} color={Colors.gold} />
              <Text style={[styles.waitingText, { color: Colors.gold }]}>
                Status: Victorious (Waiting for Runner Up...)
              </Text>
            </>
          ) : (
            <>
              <ActivityIndicator size="small" color={Colors.textSecondary} />
              <Text style={styles.waitingText}>
                Waiting for{' '}
                {playerGroups.find((p: any) => p.isCurrentTurn)?.full_name?.split(' ')[0] || 'Legend'}...
              </Text>
            </>
          )}
        </View>
      )}

      {/* Inactivity overlay */}
      {isInactive && (
        <View style={styles.inactiveOverlay}>
          <Ionicons name="shield" size={80} color={Colors.gold} />
          <Text style={styles.inactiveOverlayTitle}>Tactical Standby</Text>
          <Text style={styles.inactiveOverlaySub}>
            Sync suspended to preserve resources.{'\n'}All sensors in standby.
          </Text>
          <TouchableOpacity style={styles.reEngageBtn} onPress={reEngageArena}>
            <Ionicons name="refresh" size={18} color="#000" />
            <Text style={styles.reEngageBtnText}>RE-ENGAGE ARENA</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Roulette overlay */}
      {showRoulette && (
        <View style={styles.rouletteOverlay}>
          <View style={styles.rouletteHeader}>
            <Text style={styles.rouletteEyebrow}>System Selecting</Text>
            <Text style={styles.rouletteTitle}>First Legend</Text>
          </View>
          <View style={styles.rouletteList}>
            {groupMembers.map((member: any, idx: number) => {
              const isHighlighted = idx === rouletteHighlight;
              const isWinner = rouletteWinner && Number(member.id) === Number(rouletteWinner.id);
              return (
                <View
                  key={member.id}
                  style={[
                    styles.rouletteItem,
                    isHighlighted && styles.rouletteItemHighlighted,
                    isWinner && styles.rouletteItemWinner,
                  ]}
                >
                  <AvatarImage
                    uri={member.profile_picture_url}
                    name={member.username}
                    size={36}
                    borderRadius={9}
                    style={isWinner ? { backgroundColor: Colors.gold } : undefined}
                  />
                  <Text style={[styles.rouletteName, isHighlighted && { color: '#fff', opacity: 1 }]}>
                    {member.full_name}
                  </Text>
                  {isWinner && (
                    <View style={styles.firstMoveBadge}>
                      <Text style={styles.firstMoveBadgeText}>FIRST MOVE</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          {rouletteWinner && (
            <View style={styles.rouletteAnnouncement}>
              <Text style={styles.rouletteAnnouncementLabel}>Chosen by System</Text>
              <Text style={styles.rouletteAnnouncementName}>
                {rouletteWinner.full_name} goes first!
              </Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loadingCenter: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  inactiveCenter: {
    flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
    padding: Spacing['3xl'],
  },
  inactiveTitle: { fontSize: Typography['2xl'], fontWeight: '900', color: Colors.textPrimary, marginTop: 20 },
  inactiveSub: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
  returnBtn: {
    marginTop: Spacing['3xl'],
    backgroundColor: Colors.gold,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['3xl'],
    borderRadius: Radius['2xl'],
  },
  returnBtnText: { fontSize: Typography.base, fontWeight: '900', color: '#000' },

  // Winner banner
  winnerBanner: {
    position: 'absolute',
    top: 80,
    left: Spacing.xl,
    right: Spacing.xl,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.gold,
    borderRadius: Radius['2xl'],
    padding: Spacing.md,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  winnerBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerBannerLabel: { fontSize: 9, fontWeight: '900', color: 'rgba(0,0,0,0.6)', textTransform: 'uppercase', letterSpacing: 2 },
  winnerBannerText: { fontSize: 12, fontWeight: '900', color: '#000' },

  // Arena header
  arenaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderPrimary,
  },
  backBtn: { padding: 8 },
  arenaHeaderCenter: { flex: 1, alignItems: 'center' },
  arenaTitle: { fontSize: 11, fontWeight: '900', color: Colors.gold, textTransform: 'uppercase', letterSpacing: 4 },
  arenaGameId: { fontSize: 9, color: Colors.textSecondary, marginTop: 2 },
  endBtn: {
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  endBtnText: { fontSize: Typography.sm, fontWeight: '800', color: Colors.error },

  arenaScroll: { padding: Spacing.xl, gap: Spacing.xl, paddingBottom: 120 },

  // Player section
  playerSection: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
  },
  playerSectionActive: {
    borderColor: 'rgba(212,175,55,0.3)',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  playerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.lg },
  playerAvatar: { position: 'relative' },
  playerAvatarActive: {},
  playerResultBadge: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.background,
    zIndex: 10,
  },
  playerResultBadgeText: { fontSize: 8, fontWeight: '900', color: Colors.gold },
  turnIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.gold,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  playerInfo: { flex: 1 },
  playerName: { fontSize: Typography.base, fontWeight: '900', color: Colors.textPrimary },
  playerBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  playerRole: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, color: Colors.textSecondary },
  currentTurnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.goldLight,
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  currentTurnText: { fontSize: 8, fontWeight: '900', color: Colors.gold, textTransform: 'uppercase', letterSpacing: 1 },
  visibleBadge: {
    backgroundColor: 'rgba(168,85,247,0.1)',
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.2)',
  },
  visibleBadgeText: { fontSize: 8, fontWeight: '900', color: '#a855f7' },
  cardCount: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },

  cardsRow: { marginTop: 4 },
  syncOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.xl,
  },
  syncText: { fontSize: 10, fontWeight: '900', color: Colors.textPrimary },

  // Card
  card: {
    width: 70,
    height: 105,
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  cardHidden: {
    backgroundColor: Colors.white5,
    borderColor: Colors.borderSecondary,
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 4,
  },
  cardIconWrapper: { marginBottom: 4 },
  cardType: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  cardValue: {
    position: 'absolute',
    bottom: 8,
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  cardHiddenContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  cardSelectedGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
  },

  // Action bar
  actionBar: {
    position: 'absolute',
    bottom: 24,
    left: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.92)',
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderPrimary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  actionBarHint: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '900',
    color: Colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  playRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  playLabel: { fontSize: 9, fontWeight: '900', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  playRecipient: { fontSize: Typography.lg, fontWeight: '900', color: Colors.textPrimary },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.gold,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.xl,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  confirmBtnText: { fontSize: 11, fontWeight: '900', color: '#000', letterSpacing: 1 },

  // Waiting bar
  waitingBar: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 99,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.borderPrimary,
  },
  waitingText: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Inactivity overlay
  inactiveOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['3xl'],
  },
  inactiveOverlayTitle: {
    fontSize: Typography['2xl'],
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: 8,
  },
  inactiveOverlaySub: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing['4xl'],
  },
  reEngageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.gold,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['3xl'],
    borderRadius: 99,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
  },
  reEngageBtnText: { fontSize: 12, fontWeight: '900', color: '#000', letterSpacing: 2 },

  // Roulette overlay
  rouletteOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 110,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  rouletteHeader: { alignItems: 'center', marginBottom: Spacing['3xl'] },
  rouletteEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4,
    color: 'rgba(212,175,55,0.6)',
    marginBottom: 8,
  },
  rouletteTitle: {
    fontSize: Typography['2xl'],
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: Colors.textPrimary,
  },
  rouletteList: { width: '100%', gap: 8 },
  rouletteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: Radius['2xl'],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    opacity: 0.25,
  },
  rouletteItemHighlighted: {
    opacity: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  rouletteItemWinner: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderColor: 'rgba(212,175,55,0.5)',
  },
  rouletteName: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
  },
  firstMoveBadge: {
    backgroundColor: Colors.gold,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  firstMoveBadgeText: { fontSize: 9, fontWeight: '900', color: '#000', textTransform: 'uppercase', letterSpacing: 1 },
  rouletteAnnouncement: { alignItems: 'center', marginTop: Spacing['2xl'] },
  rouletteAnnouncementLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
    color: 'rgba(212,175,55,0.6)',
  },
  rouletteAnnouncementName: {
    fontSize: Typography.xl,
    fontWeight: '900',
    color: Colors.gold,
    marginTop: 6,
  },

  // Finished screen
  finishedScroll: { padding: Spacing['2xl'], paddingBottom: Spacing['5xl'], gap: Spacing.xl },
  finishedHeader: { alignItems: 'center', marginBottom: Spacing.xl },
  trophyBox: {
    width: 88,
    height: 88,
    borderRadius: Radius['2xl'],
    backgroundColor: Colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  finishedTitle: {
    fontSize: Typography['2xl'],
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  finishedSubtitle: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Colors.white5,
    borderWidth: 1,
    borderColor: Colors.borderPrimary,
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
  },
  resultCardChampion: {
    backgroundColor: Colors.goldLight,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  resultAvatar: { position: 'relative' },
  resultAvatarChampion: {},
  positionBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.white10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.background,
    zIndex: 10,
  },
  positionBadgeChampion: { backgroundColor: Colors.gold },
  positionBadgeText: { fontSize: 9, fontWeight: '900', color: Colors.textPrimary },
  resultInfo: { flex: 1 },
  resultName: { fontSize: Typography.lg, fontWeight: '900', color: Colors.textPrimary },
  resultUsername: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  resultPtsLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color: Colors.textSecondary },
  resultPts: { fontSize: Typography.xl, fontWeight: '900', color: Colors.textPrimary },
  seriesTotal: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  finishedActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  nextRoundBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: Colors.goldLight,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
  },
  nextRoundBtnText: { fontSize: Typography.base, fontWeight: '800', color: Colors.gold },
  endMatchBtn: {
    flex: 1,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endMatchBtnText: { fontSize: Typography.base, fontWeight: '800', color: Colors.error },
});
