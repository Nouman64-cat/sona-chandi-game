import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius } from '../theme';

interface Props {
  uri?: string | null;
  name?: string;
  size?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function AvatarImage({ uri, name, size = 48, borderRadius, style }: Props) {
  const br = borderRadius ?? size / 4;
  const fontSize = size * 0.35;

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: br, backgroundColor: Colors.goldLight },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: br }}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.initial, { fontSize }]}>
          {name ? name[0].toUpperCase() : 'U'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initial: {
    color: Colors.gold,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
