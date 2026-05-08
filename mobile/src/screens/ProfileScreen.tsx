import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Colors, Spacing, Typography, Radius } from '../theme';
import GlassCard from '../components/GlassCard';
import AvatarImage from '../components/AvatarImage';
import LoadingScreen from '../components/LoadingScreen';

export default function ProfileScreen() {
  const { user, refreshUser, logout } = useAuth();
  const { theme, toggleTheme, accentColor } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [togglingPrivacy, setTogglingPrivacy] = useState(false);
  const [error, setError] = useState('');

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need photo library access to update your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    setUploading(true);
    setError('');
    try {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      } as any);

      await api.post('/users/me/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshUser();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload profile picture.');
    } finally {
      setUploading(false);
    }
  };

  const handlePrivacyToggle = async () => {
    if (!user) return;
    setTogglingPrivacy(true);
    try {
      await api.post(`/users/me/privacy?is_private=${!user.is_private}`);
      await refreshUser();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update privacy settings.');
    } finally {
      setTogglingPrivacy(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to exit the Arena?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) return <LoadingScreen message="Loading profile..." />;

  const infoFields = [
    { icon: 'person' as const, label: 'Full Name', value: user.full_name },
    { icon: 'at' as const, label: 'Username', value: `@${user.username}` },
    { icon: 'mail' as const, label: 'Email', value: user.email },
    { icon: 'call' as const, label: 'Phone', value: user.number || '—' },
    { icon: 'transgender' as const, label: 'Gender', value: user.gender },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard>
          {/* Avatar + Header */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={uploading}
              style={styles.avatarWrapper}
            >
              <AvatarImage
                uri={user.profile_picture_url}
                name={user.full_name}
                size={140}
                borderRadius={70}
                style={styles.avatar}
              />
              <View style={styles.avatarOverlay}>
                {uploading ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="camera" size={28} color="#fff" />
                    <Text style={styles.avatarOverlayText}>Change Photo</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            {user.is_admin && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.gold} />
                <Text style={styles.adminBadgeText}>Commander</Text>
              </View>
            )}
          </View>

          <View style={styles.nameBlock}>
            <Text style={styles.displayName}>{user.full_name}</Text>
            <Text style={styles.displayUsername}>@{user.username}</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </GlassCard>

        {/* Info Fields */}
        <GlassCard>
          <Text style={styles.sectionTitle}>Legend Profile</Text>
          <View style={styles.fieldList}>
            {infoFields.map((f) => (
              <View key={f.label} style={styles.fieldRow}>
                <View style={styles.fieldIconBox}>
                  <Ionicons name={f.icon} size={18} color={Colors.textSecondary} />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <Text style={styles.fieldValue}>{f.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Settings */}
        <GlassCard>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsList}>
            {/* Privacy toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconBox}>
                  <Ionicons name="lock-closed" size={18} color={Colors.textSecondary} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Private Account</Text>
                  <Text style={styles.settingDesc}>Hide your profile from public search</Text>
                </View>
              </View>
              {togglingPrivacy ? (
                <ActivityIndicator size="small" color={Colors.gold} />
              ) : (
                <Switch
                  value={!!user.is_private}
                  onValueChange={handlePrivacyToggle}
                  trackColor={{ false: Colors.borderPrimary, true: Colors.gold }}
                  thumbColor="#fff"
                />
              )}
            </View>

            {/* Theme toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconBox}>
                  <Ionicons
                    name={theme === 'dark' ? 'sunny' : 'moon'}
                    size={18}
                    color={Colors.textSecondary}
                  />
                </View>
                <View>
                  <Text style={styles.settingLabel}>
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </Text>
                  <Text style={styles.settingDesc}>Toggle display theme</Text>
                </View>
              </View>
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: Colors.borderPrimary, true: Colors.gold }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </GlassCard>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing['2xl'], gap: Spacing.xl, paddingBottom: Spacing['5xl'] },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatarWrapper: { position: 'relative' },
  avatar: { borderWidth: 3, borderColor: 'rgba(212,175,55,0.3)' },
  avatarOverlay: {
    position: 'absolute',
    inset: 0,
    borderRadius: 70,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  avatarOverlayText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.goldLight,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 12,
  },
  adminBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.gold },
  nameBlock: { alignItems: 'center', marginBottom: Spacing.md },
  displayName: { fontSize: Typography.xl, fontWeight: '900', color: Colors.textPrimary },
  displayUsername: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4 },
  errorBox: {
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: Typography.sm },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  fieldList: { gap: Spacing.md },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white5,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  fieldIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.white10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  fieldValue: { fontSize: Typography.base, color: Colors.textPrimary, fontWeight: '600', marginTop: 2 },
  settingsList: { gap: Spacing.md },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white5,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.white10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: { fontSize: Typography.base, color: Colors.textPrimary, fontWeight: '700' },
  settingDesc: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
  },
  logoutText: { fontSize: Typography.base, fontWeight: '800', color: Colors.error },
});
