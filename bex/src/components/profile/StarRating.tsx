import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme';

interface StarRatingInputProps {
  value: number;
  onChange: (stars: number) => void;
  size?: number;
}

export function StarRatingInput({ value, onChange, size = 32 }: StarRatingInputProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)} hitSlop={6}>
          <Text style={[styles.star, { fontSize: size, opacity: star <= value ? 1 : 0.25 }]}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function StarRatingDisplay({ value, size = 16 }: { value: number; size?: number }) {
  const rounded = Math.round(value * 10) / 10;
  return (
    <Text style={[styles.display, { fontSize: size }]}>
      {'★'.repeat(Math.round(value))}
      {'☆'.repeat(Math.max(0, 5 - Math.round(value)))} {rounded > 0 ? rounded.toFixed(1) : '—'}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing[2], justifyContent: 'center' },
  star: { color: Colors.warning ?? '#F5A623' },
  display: { color: Colors.warning ?? '#F5A623', fontWeight: '700' },
});
