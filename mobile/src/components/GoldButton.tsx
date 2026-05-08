import React, { ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme';

interface Props {
  onPress: () => void;
  children: ReactNode;
  leftIcon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'gold' | 'outline' | 'danger';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function GoldButton({
  onPress,
  children,
  leftIcon,
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
        <View style={styles.row}>
          {leftIcon ? <View style={styles.iconWrap}>{leftIcon}</View> : null}
          {typeof children === 'string' ? (
            <Text style={labelStyle}>{children}</Text>
          ) : (
            children
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
    borderRadius: Radius['2xl'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gold: {
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
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
