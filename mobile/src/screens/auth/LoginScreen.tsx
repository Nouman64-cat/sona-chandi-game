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
      Alert.alert(
        'Login Failed',
        err.response?.data?.detail || 'Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Ambient glows */}
          <View style={styles.glowTopLeft} />
          <View style={styles.glowBottomRight} />

          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>SONA CHANDI</Text>
              <Text style={styles.subtitle}>Welcome back, legend. Log in to your account.</Text>
            </View>

            <View style={styles.form}>
              <FormInput
                label="Username"
                icon="person"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Enter your username"
              />

              <FormInput
                label="Password"
                icon="lock-closed"
                value={password}
                onChangeText={setPassword}
                isPassword
                placeholder="••••••••"
              />

              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotRow}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <GoldButton onPress={handleLogin} loading={loading}>
                Log In
              </GoldButton>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerLink}>Register Now</Text>
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
    padding: Spacing['2xl'],
  },
  glowTopLeft: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(212,175,55,0.04)',
  },
  glowBottomRight: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(192,192,192,0.04)',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius['3xl'],
    padding: Spacing['3xl'],
  },
  header: { alignItems: 'center', marginBottom: Spacing['4xl'] },
  title: {
    fontSize: Typography['3xl'],
    fontWeight: '900',
    fontStyle: 'italic',
    color: Colors.gold,
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  form: { gap: Spacing.xl },
  forgotRow: { alignItems: 'flex-end' },
  forgotText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing['3xl'],
  },
  footerText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: Typography.sm,
    fontWeight: '800',
    color: Colors.gold,
  },
});
