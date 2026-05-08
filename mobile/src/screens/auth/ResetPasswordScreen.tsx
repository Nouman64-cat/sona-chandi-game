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
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/types';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import api from '../../services/api';
import FormInput from '../../components/FormInput';
import GoldButton from '../../components/GoldButton';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
  route: RouteProp<AuthStackParamList, 'ResetPassword'>;
};

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { token } = route.params;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password || !confirm) {
      Alert.alert('Error', 'Please fill in both fields.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, new_password: password });
      Alert.alert('Success', 'Password reset successfully!', [
        { text: 'Log In', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.detail || 'Reset failed. The link may have expired.'
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
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>New Password</Text>
              <Text style={styles.subtitle}>
                Set your new Arena password below.
              </Text>
            </View>

            <View style={styles.form}>
              <FormInput
                label="New Password"
                icon="lock-closed"
                value={password}
                onChangeText={setPassword}
                isPassword
                placeholder="••••••••"
              />

              <FormInput
                label="Confirm Password"
                icon="lock-closed"
                value={confirm}
                onChangeText={setConfirm}
                isPassword
                placeholder="••••••••"
              />

              <GoldButton onPress={handleReset} loading={loading}>
                Reset Password
              </GoldButton>
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
  title: {
    fontSize: Typography['2xl'],
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  form: { gap: Spacing.xl },
});
