import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { MessageThreadScreen } from '@/components/messaging/MessageThreadScreen';

export default function BusinessMessageThreadRoute() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  if (!applicationId) return null;
  return <MessageThreadScreen applicationId={applicationId} />;
}
