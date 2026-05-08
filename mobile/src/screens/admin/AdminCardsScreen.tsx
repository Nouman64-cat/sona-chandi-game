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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import GoldButton from '../../components/GoldButton';
import LoadingScreen from '../../components/LoadingScreen';

interface CardTemplate {
  id: number;
  card_type: string;
  name: string;
  value: number;
  color: string;
  icon: string;
}

const ICON_OPTIONS = [
  'Gem', 'Crown', 'Coins', 'CircleDollarSign', 'Award', 'Star',
  'Component', 'Trophy', 'Zap', 'Flame', 'Sparkles', 'Swords', 'Shield',
];

const ICON_MAP: Record<string, any> = {
  Gem: 'diamond',
  Crown: 'crown',
  Coins: 'cash-multiple',
  CircleDollarSign: 'currency-usd-circle',
  Award: 'medal',
  Star: 'star',
  Component: 'puzzle',
  Trophy: 'trophy',
  Zap: 'lightning-bolt',
  Flame: 'fire',
  Sparkles: 'star-four-points',
  Swords: 'sword-cross',
  Shield: 'shield',
};

const PRESET_COLORS = [
  '#D4AF37', '#C0C0C0', '#3b82f6', '#ec4899',
  '#22c55e', '#f97316', '#ef4444', '#8b5cf6',
];

function MCIcon({ name, size = 20, color = '#fff' }: { name: string; size?: number; color?: string }) {
  const mciName = ICON_MAP[name] || 'shield';
  return <MaterialCommunityIcons name={mciName} size={size} color={color} />;
}

export default function AdminCardsScreen() {
  const navigation = useNavigation();
  const [cards, setCards] = useState<CardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const res = await api.get('/admin/cards');
      setCards(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load card templates.');
    } finally {
      setLoading(false);
    }
  };

  const updateLocalCard = (field: string, value: any) => {
    setCards((prev) => prev.map((c, i) => i === currentIndex ? { ...c, [field]: value } : c));
  };

  const handleSave = async () => {
    const card = cards[currentIndex];
    if (!card) return;
    setSaving(true);
    setError(null);
    try {
      await api.put(`/admin/cards/${card.id}`, {
        card_type: card.card_type,
        name: card.name,
        value: Number(card.value),
        color: card.color,
        icon: card.icon,
      });
      showSuccess(`Intelligence updated for ${card.card_type}!`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await api.post('/admin/cards', {
        name: 'New Legend',
        value: 100,
        color: '#FFD700',
        icon: 'Shield',
      });
      setCards((prev) => {
        const updated = [...prev, res.data];
        setCurrentIndex(updated.length - 1);
        return updated;
      });
      showSuccess(`Card type '${res.data.card_type}' created!`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create card type.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = () => {
    const card = cards[currentIndex];
    if (!card) return;
    Alert.alert(
      'Delete Card Type',
      `Permanently delete "${card.card_type}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/admin/cards/${card.id}`);
              setCards((prev) => {
                const updated = prev.filter((_, i) => i !== currentIndex);
                setCurrentIndex(Math.max(0, currentIndex - 1));
                return updated;
              });
              showSuccess('Card type deleted.');
            } catch (err: any) {
              setError(err.response?.data?.detail || 'Delete failed.');
            } finally {
              setDeleting(false);
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

  if (loading) return <LoadingScreen message="Loading intelligence..." />;

  const currentCard = cards[currentIndex];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Intelligence Dashboard</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleCreate} disabled={creating}>
          {creating ? <ActivityIndicator size="small" color={Colors.gold} /> : (
            <Ionicons name="add" size={22} color={Colors.gold} />
          )}
        </TouchableOpacity>
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

      {cards.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No card types found. Create one!</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Navigator */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
            >
              <Ionicons name="chevron-back" size={20} color={currentIndex === 0 ? Colors.borderPrimary : Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.navCount}>
              {currentIndex + 1} / {cards.length}
            </Text>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => setCurrentIndex((i) => Math.min(cards.length - 1, i + 1))}
              disabled={currentIndex === cards.length - 1}
            >
              <Ionicons name="chevron-forward" size={20} color={currentIndex === cards.length - 1 ? Colors.borderPrimary : Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {currentCard && (
            <View style={styles.editorCard}>
              {/* Card Preview */}
              <View style={styles.previewRow}>
                <View style={[styles.cardPreview, { backgroundColor: currentCard.color }]}>
                  <MCIcon name={currentCard.icon} size={28} color="#fff" />
                  <Text style={styles.previewType}>{(currentCard.card_type || '').toUpperCase()}</Text>
                  <Text style={styles.previewValue}>{currentCard.value}</Text>
                </View>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewLabel}>Type</Text>
                  <Text style={styles.previewCardType}>{currentCard.card_type}</Text>
                  <Text style={[styles.previewLabel, { marginTop: 12 }]}>Name</Text>
                  <Text style={styles.previewCardType}>{currentCard.name}</Text>
                </View>
              </View>

              {/* Fields */}
              <View style={styles.fields}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Name</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={currentCard.name}
                    onChangeText={(v) => updateLocalCard('name', v)}
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Value</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={String(currentCard.value)}
                    onChangeText={(v) => updateLocalCard('value', v)}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Color</Text>
                  <View style={styles.colorRow}>
                    {PRESET_COLORS.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.colorDot,
                          { backgroundColor: c },
                          currentCard.color === c && styles.colorDotSelected,
                        ]}
                        onPress={() => updateLocalCard('color', c)}
                      />
                    ))}
                  </View>
                  <TextInput
                    style={[styles.fieldInput, { marginTop: 8 }]}
                    value={currentCard.color}
                    onChangeText={(v) => updateLocalCard('color', v)}
                    placeholder="#D4AF37"
                    placeholderTextColor={Colors.textSecondary}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Icon</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.iconRow}>
                      {ICON_OPTIONS.map((icon) => (
                        <TouchableOpacity
                          key={icon}
                          style={[
                            styles.iconOption,
                            currentCard.icon === icon && styles.iconOptionSelected,
                          ]}
                          onPress={() => updateLocalCard('icon', icon)}
                        >
                          <MCIcon name={icon} size={22} color={currentCard.icon === icon ? Colors.gold : Colors.textSecondary} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.cardActions}>
                <GoldButton onPress={handleSave} loading={saving} style={{ flex: 1 }}>
                  Save Changes
                </GoldButton>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color={Colors.error} />
                  ) : (
                    <Ionicons name="trash" size={20} color={Colors.error} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}
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
  addBtn: { padding: 8 },
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
  scroll: { padding: Spacing['2xl'], gap: Spacing.xl, paddingBottom: Spacing['5xl'] },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.white5,
    borderWidth: 1,
    borderColor: Colors.borderPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCount: { fontSize: Typography.base, fontWeight: '700', color: Colors.textSecondary },
  editorCard: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius['3xl'],
    padding: Spacing['2xl'],
    gap: Spacing.xl,
  },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  cardPreview: {
    width: 80,
    height: 120,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  previewType: { fontSize: 8, fontWeight: '900', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  previewValue: { fontSize: 11, fontWeight: '900', color: '#fff', position: 'absolute', bottom: 8 },
  previewInfo: { flex: 1 },
  previewLabel: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  previewCardType: { fontSize: Typography.lg, fontWeight: '900', color: Colors.textPrimary },
  fields: { gap: Spacing.lg },
  field: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  fieldInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.borderPrimary,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: Colors.textPrimary,
    transform: [{ scale: 1.2 }],
  },
  iconRow: { flexDirection: 'row', gap: 8 },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.white5,
    borderWidth: 1,
    borderColor: Colors.borderPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionSelected: {
    backgroundColor: Colors.goldLight,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  cardActions: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  deleteBtn: {
    width: 52,
    height: 52,
    borderRadius: Radius.xl,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['4xl'] },
  emptyText: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center' },
});
