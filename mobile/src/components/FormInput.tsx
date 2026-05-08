import React, { ReactNode, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '../theme';

interface Props extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: ReactNode;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export default function FormInput({
  label,
  icon,
  rightIcon,
  containerStyle,
  isPassword,
  ...props
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputRow}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={Colors.textSecondary}
            style={styles.iconLeft}
          />
        )}
        <TextInput
          placeholderTextColor={Colors.textSecondary}
          style={[styles.input, icon ? styles.inputWithIcon : null]}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={styles.iconRight}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.borderPrimary,
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
  },
  iconLeft: {
    position: 'absolute',
    left: Spacing.lg,
    zIndex: 1,
  },
  iconRight: {
    position: 'absolute',
    right: Spacing.lg,
    zIndex: 1,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  inputWithIcon: {
    paddingLeft: 48,
  },
});
