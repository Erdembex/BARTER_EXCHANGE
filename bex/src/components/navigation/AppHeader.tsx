import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing } from '@/theme';

interface AppHeaderProps {
  title?: string;
  showMenu?: boolean;
}

export function AppHeader({ title, showMenu = true }: AppHeaderProps) {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {showMenu ? (
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.menuBtn}
          accessibilityRole="button"
          accessibilityLabel="Menüyü aç"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={styles.menuIcon}>
            <View style={styles.bar} />
            <View style={styles.bar} />
            <View style={styles.bar} />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.menuPlaceholder} />
      )}
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[2],
    gap: Spacing[3],
    backgroundColor: Colors.background,
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  menuPlaceholder: { width: 40 },
  menuIcon: { gap: 4, width: 18 },
  bar: {
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  title: {
    ...Typography.headingMedium,
    color: Colors.textPrimary,
    flex: 1,
  },
});
