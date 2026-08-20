import React from 'react';
import { View } from 'react-native';
import { UserRole } from '@/types';
import { ChatThreadView } from '@/components/messaging/ChatThreadView';
import { Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';

interface ApplicationMessageThreadProps {
  applicationId: string;
  currentUserId: string;
  currentUserRole: UserRole;
  peerLabel?: string;
  taskTitle?: string;
}

export function ApplicationMessageThread({
  peerLabel,
  taskTitle,
  ...props
}: ApplicationMessageThreadProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  return (
    <View style={styles.wrap}>
      <ChatThreadView
        {...props}
        variant="embedded"
        peerLabel={peerLabel}
        taskTitle={taskTitle}
      />
    </View>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  wrap: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
}));
