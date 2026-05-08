import React, { useState } from 'react';
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
import AvatarImage from '../components/AvatarImage';
import LoadingScreen from '../components/LoadingScreen';

export default function ProfileScreen() {
  const { user, refreshUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    Alert.alert('Log Out', 'Are you sure you want to exit?', [
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar hero */}
        <View style={styles.heroSection}>
          <View style={styles.heroBg} />
          <TouchableOpacity
            onPress={handlePickImage}
            disabled={uploading}
            style={styles.avatarTouchable}
            activeOpacity={0.85}
          >
            <AvatarImage
              uri={user.profile_picture_url}
              name={user.full_name}
              size={110}
              borderRadius={55}
              style={styles.avatarImg}
            />
            <View style={styles.avatarEditBadge}>
              {uploading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={14} color="#fff" />
              }
            </View>
          </TouchableOpacity>

          <Text style={styles.displayName}>{user.full_name}</Text>
          <Text style={styles.displayUsername}>@{user.username}</Text>

          <View style={styles.badgeRow}>
            {user.is_admin && (
              <View style={[styles.badge, styles.badgeAdmin]}>
                <Ionicons name="shield-checkmark" size={11} color={Colors.gold} />
                <Text style={[styles.badgeText, { color: Colors.gold }]}>Commander</Text>
              </View>
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{user.gender}</Text>
            </View>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Info card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile Details</Text>
          {infoFields.map((f) => (
            <View key={f.label} style={styles.fieldRow}>
              <View style={styles.fieldIconBox}>
                <Ionicons name={f.icon} size={16} color={Colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <Text style={styles.fieldValue}>{f.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Settings card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Settings</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIconBox}>
                <Ionicons name="lock-closed" size={16} color={Colors.textSecondary} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Private Account</Text>
                <Text style={styles.settingDesc}>Hide from public search</Text>
              </View>
            </View>
            {togglingPrivacy
              ? <ActivityIndicator size="small" color={Colors.gold} />
              : (
                <Switch
                  value={!!user.is_private}
                  onValueChange={handlePrivacyToggle}
                  trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.gold }}
                  thumbColor="#fff"
                  ios_backgroundColor="rgba(255,255,255,0.1)"
                />
              )}
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIconBox}>
                <Ionicons name={theme === 'dark' ? 'moon' : 'sunny'} size={16} color={Colors.textSecondary} />
              </View>
              <View>
                <Text style={styles.settingLabel}>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</Text>
                <Text style={styles.settingDesc}>Toggle display theme</Text>
              </View>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.gold }}
              thumbColor="#fff"
              ios_backgroundColor="rgba(255,255,255,0.1)"
            />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 48 },

  heroSection: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    paddingHorizontal: Spacing['2xl'],
    position: 'relative',
    overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute',
    top: -80,
    left: '50%',
    marginLeft: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(212,175,55,0.06)',
  },
  avatarTouchable: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarImg: {
    borderWidth: 3,
    borderColor: 'rgba(212,175,55,0.4)',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  displayName: {
    fontSize: Typography.xl,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  displayUsername: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeAdmin: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: 12,
    padding: Spacing.md,
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
  errorText: { flex: 1, color: Colors.error, fontSize: Typography.sm },

  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    marginHorizontal: Spacing['2xl'],
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
    color: Colors.textSecondary,
    padding: Spacing.xl,
    paddingBottom: 10,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  fieldIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  fieldValue: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: '600', marginTop: 1 },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: '700' },
  settingDesc: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: 16,
    padding: Spacing.lg,
    marginHorizontal: Spacing['2xl'],
  },
  logoutText: { fontSize: Typography.base, fontWeight: '800', color: Colors.error },
});
