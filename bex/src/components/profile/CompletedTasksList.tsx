import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { CompletedTask } from '@/types';
import { formatShortDate } from '@/lib/dateUtils';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { COMPLETED_TASKS_PREVIEW_LIMIT } from '@/features/portfolio/profileLimits';
import { Colors, Typography, Spacing, Radius } from '@/theme';

function TaskRow({ task }: { task: CompletedTask }) {
  const previewUri = task.previewImageUrl ? resolveMediaUrl(task.previewImageUrl) : null;

  return (
    <View style={styles.row}>
      {previewUri ? (
        <Image source={{ uri: previewUri }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={styles.thumbEmoji}>✓</Text>
        </View>
      )}
      <View style={styles.rowBody}>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {task.taskTitle}
        </Text>
        <Text style={styles.taskMeta}>
          {formatShortDate(task.completedAt)}
          {task.imageCount > 0 ? ` · ${task.imageCount} görsel` : ''}
        </Text>
      </View>
    </View>
  );
}

interface CompletedTasksModalProps {
  visible: boolean;
  onClose: () => void;
  tasks: CompletedTask[];
  totalCount?: number;
}

export function CompletedTasksModal({
  visible,
  onClose,
  tasks,
  totalCount,
}: CompletedTasksModalProps) {
  const total = totalCount ?? tasks.length;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Tamamlanan görevler ({total})</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Kapat</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalScroll}>
          {tasks.length > 0 ? (
            tasks.map((task) => <TaskRow key={task.applicationId} task={task} />)
          ) : (
            <Text style={styles.emptyText}>Henüz tamamlanan görev yok.</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

interface CompletedTasksListProps {
  tasks: CompletedTask[];
  totalCount?: number;
  previewLimit?: number;
  compact?: boolean;
}

export function CompletedTasksList({
  tasks,
  totalCount,
  previewLimit = COMPLETED_TASKS_PREVIEW_LIMIT,
  compact = false,
}: CompletedTasksListProps) {
  const [showAll, setShowAll] = useState(false);
  const total = totalCount ?? tasks.length;
  const preview = useMemo(() => tasks.slice(0, previewLimit), [tasks, previewLimit]);
  const hiddenCount = Math.max(0, total - preview.length);

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>Henüz tamamlanan görev yok.</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.wrap}>
        <Text style={styles.title}>Tamamlanan görevler</Text>
        {!compact ? (
          <Text style={styles.subtitle}>
            Onaylanmış teslimler — son {Math.min(preview.length, previewLimit)} görev gösteriliyor.
          </Text>
        ) : null}
        <View style={styles.list}>
          {preview.map((task) => (
            <TaskRow key={task.applicationId} task={task} />
          ))}
        </View>
        {hiddenCount > 0 ? (
          <TouchableOpacity style={styles.moreBtn} onPress={() => setShowAll(true)}>
            <Text style={styles.moreText}>
              +{hiddenCount} görev daha · Tümünü gör ({total})
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <CompletedTasksModal
        visible={showAll}
        onClose={() => setShowAll(false)}
        tasks={tasks}
        totalCount={total}
      />
    </>
  );
}

interface CompletedTasksStatProps {
  count: number;
  tasks: CompletedTask[];
  totalCount?: number;
}

/** Hero alanındaki "X tamamlanan görev" metni — dokununca tam listeyi açar */
export function CompletedTasksStat({ count, tasks, totalCount }: CompletedTasksStatProps) {
  const [showAll, setShowAll] = useState(false);
  const total = totalCount ?? count;

  if (count <= 0) {
    return <Text style={styles.statMuted}>0 tamamlanan görev</Text>;
  }

  return (
    <>
      <TouchableOpacity onPress={() => setShowAll(true)} activeOpacity={0.7}>
        <Text style={styles.statLink}>{count} tamamlanan görev</Text>
      </TouchableOpacity>

      <CompletedTasksModal
        visible={showAll}
        onClose={() => setShowAll(false)}
        tasks={tasks}
        totalCount={total}
      />
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
  list: { gap: Spacing[2] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.borderLight,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  thumbEmoji: { fontSize: 18 },
  rowBody: { flex: 1, gap: 2 },
  taskTitle: { ...Typography.labelMedium, color: Colors.textPrimary },
  taskMeta: { ...Typography.caption, color: Colors.textMuted },
  moreBtn: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing[1],
  },
  moreText: { ...Typography.labelMedium, color: Colors.primary },
  emptyBox: {
    width: '100%',
    padding: Spacing[4],
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyText: { ...Typography.bodySmall, color: Colors.textMuted, textAlign: 'center' },
  statMuted: { ...Typography.bodySmall, color: Colors.textMuted },
  statLink: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { ...Typography.headingSmall, color: Colors.textPrimary },
  closeText: { ...Typography.labelMedium, color: Colors.primary },
  modalScroll: { padding: Spacing[5], paddingBottom: Spacing[10], gap: Spacing[1] },
});
