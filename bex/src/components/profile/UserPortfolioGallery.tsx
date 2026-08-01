import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { PortfolioItem } from '@/types';
import { ZoomableImage } from '@/components/common/ZoomableImage';
import { AuthenticatedImage } from '@/components/common/AuthenticatedImage';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { useTranslation } from '@/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMB_SIZE = (SCREEN_WIDTH - Spacing[5] * 2 - Spacing[2] * 2) / 3;

interface UserPortfolioGalleryProps {
  items: PortfolioItem[];
  title?: string;
  subtitle?: string;
  emptyText?: string;
  compact?: boolean;
  maxItems?: number;
}

export function UserPortfolioGallery({
  items,
  title,
  subtitle,
  emptyText,
  compact = false,
  maxItems,
}: UserPortfolioGalleryProps) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('userPortfolioGallery.title');
  const resolvedSubtitle = subtitle ?? t('userPortfolioGallery.subtitle');
  const [preview, setPreview] = useState<PortfolioItem | null>(null);
  const visibleItems = maxItems && maxItems > 0 ? items.slice(0, maxItems) : items;
  const hiddenCount = items.length - visibleItems.length;

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
        <Text style={styles.title}>{resolvedTitle}</Text>
        {!compact && resolvedSubtitle ? (
          <Text style={styles.subtitle}>
            {hiddenCount > 0
              ? t('userPortfolioGallery.subtitleWithCount', { shown: visibleItems.length, total: items.length })
              : resolvedSubtitle}
          </Text>
        ) : null}
        <View style={styles.grid}>
          {visibleItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.thumbWrap}
              onPress={() => setPreview(item)}
              activeOpacity={0.9}
            >
              <AuthenticatedImage uri={item.imageUrl} style={styles.thumb} />
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
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {preview ? (
              <>
                <ZoomableImage uri={preview.imageUrl} style={styles.previewImage} />
                <Text style={styles.previewTitle}>{preview.taskTitle}</Text>
                <Text style={styles.zoomHint}>{t('userPortfolioGallery.zoomHint')}</Text>
              </>
            ) : null}
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setPreview(null)}>
            <Text style={styles.closeText}>{t('userPortfolioGallery.close')}</Text>
          </TouchableOpacity>
        </View>
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
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  zoomHint: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginTop: Spacing[2],
    opacity: 0.85,
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
