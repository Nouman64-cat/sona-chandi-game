import React, { ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme';

interface Props {
  onPress: () => void;
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'gold' | 'outline' | 'danger';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function GoldButton({
  onPress,
  children,
  loading,
  disabled,
  variant = 'gold',
  style,
  textStyle,
}: Props) {
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    variant === 'gold' && styles.gold,
    variant === 'outline' && styles.outline,
    variant === 'danger' && styles.danger,
    isDisabled && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.label,
    variant === 'gold' && styles.labelGold,
    variant === 'outline' && styles.labelOutline,
    variant === 'danger' && styles.labelDanger,
    textStyle,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={containerStyle}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'gold' ? '#000' : Colors.gold}
          size="small"
        />
      ) : (
        <Text style={labelStyle}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
    borderRadius: Radius['2xl'],
    gap: 8,
  },
  gold: {
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.borderPrimary,
  },
  danger: {
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
  },
  disabled: { opacity: 0.5 },
  label: {
    fontSize: Typography.base,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  labelGold: { color: '#000' },
  labelOutline: { color: Colors.textPrimary },
  labelDanger: { color: Colors.error },
});
