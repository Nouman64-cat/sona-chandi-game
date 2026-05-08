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
import FormInput from '../../components/FormInput';
import GoldButton from '../../components/GoldButton';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'> };

const GENDERS = ['Other', 'Male', 'Female'];

export default function RegisterScreen({ navigation }: Props) {
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    gender: 'Other',
    number: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleRegister = async () => {
    const { full_name, username, email, number, password } = form;
    if (!full_name || !username || !email || !password) {
      Alert.alert('Error', 'Please fill all required fields.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      Alert.alert('Success', 'Account created! Please log in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      Alert.alert(
        'Registration Failed',
        err.response?.data?.detail || 'Please try again.'
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
              <Text style={styles.title}>SONA CHANDI</Text>
              <Text style={styles.subtitle}>
                Join the elite game. Register your legend.
              </Text>
            </View>

            <View style={styles.form}>
              <FormInput
                label="Full Name"
                icon="person-circle"
                value={form.full_name}
                onChangeText={(v) => update('full_name', v)}
                placeholder="Nouman Ejaz"
                autoCapitalize="words"
              />

              <FormInput
                label="Username"
                icon="person"
                value={form.username}
                onChangeText={(v) => update('username', v)}
                placeholder="nouman64"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <FormInput
                label="Email Address"
                icon="mail"
                value={form.email}
                onChangeText={(v) => update('email', v)}
                placeholder="nouman@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <FormInput
                label="Phone Number"
                icon="call"
                value={form.number}
                onChangeText={(v) => update('number', v)}
                placeholder="+92 300 0000000"
                keyboardType="phone-pad"
              />

              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>Gender</Text>
                <View style={styles.pickerContainer}>
                  {GENDERS.map((g) => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => update('gender', g)}
                      style={[
                        styles.genderOption,
                        form.gender === g && styles.genderOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.genderOptionText,
                          form.gender === g && styles.genderOptionTextActive,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <FormInput
                label="Password"
                icon="lock-closed"
                value={form.password}
                onChangeText={(v) => update('password', v)}
                isPassword
                placeholder="••••••••"
              />

              <GoldButton onPress={handleRegister} loading={loading}>
                Create Account
              </GoldButton>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already a legend? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Log In</Text>
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
    paddingVertical: Spacing['4xl'],
  },
  card: {
    width: '100%',
    maxWidth: 500,
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
  pickerWrapper: { gap: 6 },
  pickerLabel: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: Radius.xl,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.borderPrimary,
  },
  genderOptionActive: {
    backgroundColor: Colors.goldLight,
    borderColor: Colors.gold,
  },
  genderOptionText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  genderOptionTextActive: { color: Colors.gold },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing['3xl'],
  },
  footerText: { fontSize: Typography.sm, color: Colors.textSecondary },
  footerLink: { fontSize: Typography.sm, fontWeight: '800', color: Colors.gold },
});
