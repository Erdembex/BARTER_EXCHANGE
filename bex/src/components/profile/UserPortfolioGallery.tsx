import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { PortfolioItem } from '@/types';
import { Colors, Typography, Spacing, Radius } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMB_SIZE = (SCREEN_WIDTH - Spacing[5] * 2 - Spacing[2] * 2) / 3;

interface UserPortfolioGalleryProps {
  items: PortfolioItem[];
  title?: string;
  subtitle?: string;
  emptyText?: string;
  compact?: boolean;
}

export function UserPortfolioGallery({
  items,
  title = 'Onaylı portföy',
  subtitle = 'Admin tarafından onaylanmış teslim görselleri — işletmeler başvuru öncesi görür.',
  emptyText,
  compact = false,
}: UserPortfolioGalleryProps) {
  const [preview, setPreview] = useState<PortfolioItem | null>(null);

  if (items.length === 0) {
    if (emptyText) {
      return (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      );
    }
    return null;
  }

  return (
    <>
      <View style={styles.wrap}>
        <Text style={styles.title}>{title}</Text>
        {!compact && subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.grid}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.thumbWrap}
              onPress={() => setPreview(item)}
              activeOpacity={0.9}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
              {!compact ? (
                <Text style={styles.caption} numberOfLines={1}>
                  {item.taskTitle}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPreview(null)}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            {preview ? (
              <Pressable onPress={(e) => e.stopPropagation()}>
                <Image source={{ uri: preview.imageUrl }} style={styles.previewImage} resizeMode="contain" />
                <Text style={styles.previewTitle}>{preview.taskTitle}</Text>
              </Pressable>
            ) : null}
          </ScrollView>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setPreview(null)}>
            <Text style={styles.closeText}>Kapat</Text>
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[2],
  },
  title: { ...Typography.labelLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textMuted, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  thumbWrap: { width: THUMB_SIZE, gap: 4 },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Radius.md,
    backgroundColor: Colors.borderLight,
  },
  caption: { ...Typography.caption, color: Colors.textSecondary },
  emptyBox: {
    width: '100%',
    padding: Spacing[4],
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyText: { ...Typography.bodySmall, color: Colors.textMuted, textAlign: 'center' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    padding: Spacing[4],
  },
  modalScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  previewImage: {
    width: SCREEN_WIDTH - Spacing[8],
    height: SCREEN_WIDTH - Spacing[8],
    borderRadius: Radius.lg,
  },
  previewTitle: {
    ...Typography.labelMedium,
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginTop: Spacing[3],
  },
  closeBtn: {
    alignSelf: 'center',
    marginTop: Spacing[4],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.background,
    borderRadius: Radius.full,
  },
  closeText: { ...Typography.labelMedium, color: Colors.textPrimary },
});
