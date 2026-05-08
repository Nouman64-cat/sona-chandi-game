import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import FormInput from '../../components/FormInput';
import GoldButton from '../../components/GoldButton';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { refreshGender } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter username and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      await login(res.data.access_token, res.data.gender || 'Other');
      await refreshGender();
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.detail || 'Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Background glows */}
          <View style={styles.glowTop} />
          <View style={styles.glowBottom} />

          {/* Logo / Branding */}
          <View style={styles.brand}>
            <Text style={styles.brandTitle}>SONA CHANDI</Text>
            <View style={styles.brandDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.brandTagline}>Elite Card Game</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Welcome Back</Text>
            <Text style={styles.cardSub}>Sign in to your account</Text>

            <View style={styles.form}>
              <FormInput
                label="Username"
                icon="person-outline"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Enter your username"
              />

              <FormInput
                label="Password"
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                isPassword
                placeholder="••••••••"
              />

              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotRow}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <GoldButton onPress={handleLogin} loading={loading}>
                Sign In
              </GoldButton>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>New to the arena? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: 40,
  },

  glowTop: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(212,175,55,0.05)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(192,192,192,0.04)',
  },

  brand: { alignItems: 'center', marginBottom: 36 },
  brandTitle: {
    fontSize: 36,
    fontWeight: '900',
    fontStyle: 'italic',
    color: Colors.gold,
    letterSpacing: -1,
  },
  brandDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  dividerLine: {
    width: 32,
    height: 1,
    backgroundColor: 'rgba(212,175,55,0.3)',
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },

  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 28,
    padding: Spacing['3xl'],
  },
  cardHeading: {
    fontSize: Typography['2xl'],
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  cardSub: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing['3xl'],
  },

  form: { gap: Spacing.xl },
  forgotRow: { alignItems: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: Typography.sm, color: Colors.textSecondary },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing['3xl'],
  },
  footerText: { fontSize: Typography.sm, color: Colors.textSecondary },
  footerLink: { fontSize: Typography.sm, fontWeight: '800', color: Colors.gold },
});
