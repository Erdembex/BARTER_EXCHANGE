import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Button, Input } from '@/components/ui';
import { StarRatingInput } from '@/components/profile/StarRating';
import { Colors, Typography, Spacing, Radius } from '@/theme';

interface TaskFeedbackModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (stars: number, comment: string) => Promise<void>;
}

export function TaskFeedbackModal({
  visible,
  title,
  onClose,
  onSubmit,
}: TaskFeedbackModalProps) {
  const [step, setStep] = useState<'stars' | 'comment'>('stars');
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep('stars');
    setStars(0);
    setComment('');
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleContinue = () => {
    if (stars < 1) {
      setError('Önce 1-5 arası yıldız ver.');
      return;
    }
    setError(null);
    setStep('comment');
  };

  const handleSubmit = async () => {
    if (stars < 1) {
      setError('Önce yıldız vermelisin.');
      setStep('stars');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(stars, comment.trim());
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Geri bildirim gönderilemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.close}>Kapat</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {step === 'stars'
              ? 'Önce yıldız ver, ardından isteğe bağlı yorum yaz.'
              : 'Deneyimini kısaca anlatabilirsin (isteğe bağlı).'}
          </Text>

          {step === 'stars' ? (
            <>
              <StarRatingInput value={stars} onChange={setStars} />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button title="Devam Et" onPress={handleContinue} disabled={stars < 1} />
            </>
          ) : (
            <>
              <StarRatingInput value={stars} onChange={setStars} size={24} />
              <Input
                label="Yorum (isteğe bağlı)"
                value={comment}
                onChangeText={setComment}
                placeholder="Deneyimini paylaş..."
                multiline
                numberOfLines={4}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button title="Geri Bildirimi Gönder" onPress={handleSubmit} loading={loading} />
              <Button title="Yıldıza Dön" variant="ghost" onPress={() => setStep('stars')} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], gap: Spacing[4], paddingBottom: Spacing[10] },
  close: { ...Typography.labelMedium, color: Colors.textSecondary },
  title: { ...Typography.headingMedium, color: Colors.textPrimary },
  subtitle: { ...Typography.bodyMedium, color: Colors.textMuted, lineHeight: 22 },
  error: { ...Typography.bodySmall, color: Colors.error },
});
