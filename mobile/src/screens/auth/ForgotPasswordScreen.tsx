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
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import api from '../../services/api';
import FormInput from '../../components/FormInput';
import GoldButton from '../../components/GoldButton';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'> };

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.detail || 'Failed to send reset link.'
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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.back}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.iconBox}>
                <Ionicons name="lock-closed" size={32} color={Colors.gold} />
              </View>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter your email and we'll send you a reset link.
              </Text>
            </View>

            {sent ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                <Text style={styles.successText}>
                  Reset link sent! Check your email inbox.
                </Text>
              </View>
            ) : (
              <View style={styles.form}>
                <FormInput
                  label="Email Address"
                  icon="mail"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="nouman@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <GoldButton onPress={handleSubmit} loading={loading}>
                  Send Reset Link
                </GoldButton>
              </View>
            )}

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.backToLogin}
            >
              <Text style={styles.backToLoginText}>← Back to Login</Text>
            </TouchableOpacity>
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
  back: { position: 'absolute', top: 20, left: 20 },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius['3xl'],
    padding: Spacing['3xl'],
  },
  header: { alignItems: 'center', marginBottom: Spacing['3xl'] },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: Radius['2xl'],
    backgroundColor: Colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography['2xl'],
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  form: { gap: Spacing.xl },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.successLight,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  successText: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.success,
    fontWeight: '600',
  },
  backToLogin: { alignItems: 'center', marginTop: Spacing['2xl'] },
  backToLoginText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
