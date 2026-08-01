import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
  Dimensions,
} from 'react-native';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { isPortfolioImageUrl } from '@/lib/portfolioUtils';
import { ZoomableImage } from '@/components/common/ZoomableImage';
import { AuthenticatedImage } from '@/components/common/AuthenticatedImage';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { useTranslation } from '@/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PreviewItem = {
  id: string;
  uri: string;
  isImage: boolean;
};

interface ImagePreviewGridProps {
  urls: string[];
  thumbSize?: number;
}

export function ImagePreviewGrid({ urls, thumbSize = 88 }: ImagePreviewGridProps) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<PreviewItem | null>(null);

  const items = useMemo(() => {
    return urls
      .filter((url) => url?.trim())
      .map((url, index) => {
        const uri = resolveMediaUrl(url);
        return {
          id: `${index}-${uri}`,
          uri,
          isImage: isPortfolioImageUrl(uri),
        };
      });
  }, [urls]);

  if (items.length === 0) return null;

  return (
    <>
      <View style={styles.grid}>
        {items.map((item, index) =>
          item.isImage ? (
            <TouchableOpacity
              key={item.id}
              onPress={() => setPreview(item)}
              activeOpacity={0.85}
            >
              <AuthenticatedImage
                uri={item.uri}
                style={[styles.thumb, { width: thumbSize, height: thumbSize }]}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              key={item.id}
              onPress={() => Linking.openURL(item.uri)}
              style={styles.fileLink}
            >
              <Text style={styles.fileLinkText}>{t('imagePreviewGrid.file', { index: index + 1 })}</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <Modal
        visible={!!preview}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {preview ? (
              <ZoomableImage uri={preview.uri} style={styles.previewImage} />
            ) : null}
            <Text style={styles.zoomHint}>{t('imagePreviewGrid.zoomHint')}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setPreview(null)}>
            <Text style={styles.closeText}>{t('imagePreviewGrid.close')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  thumb: {
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  fileLink: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  fileLinkText: { ...Typography.bodySmall, color: Colors.primary },
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
  zoomHint: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    textAlign: 'center',
    marginTop: Spacing[3],
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
