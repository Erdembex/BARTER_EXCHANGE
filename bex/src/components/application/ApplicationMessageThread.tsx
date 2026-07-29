import React from 'react';
import { View, StyleSheet } from 'react-native';
import { UserRole } from '@/types';
import { ChatThreadView } from '@/components/messaging/ChatThreadView';
import { Colors, Spacing, Radius } from '@/theme';

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

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
});
