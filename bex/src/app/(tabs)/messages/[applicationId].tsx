import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { MessageThreadScreen } from '@/components/messaging/MessageThreadScreen';

export default function UserMessageThreadRoute() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  if (!applicationId) return null;
  return <MessageThreadScreen applicationId={applicationId} />;
}
