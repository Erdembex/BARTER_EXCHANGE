import React from 'react';
import { Href } from 'expo-router';
import { MessagesInboxView } from '@/components/messaging/MessagesInboxView';

export default function BusinessMessagesInboxScreen() {
  return (
    <MessagesInboxView
      audience="business"
      showMenu={false}
      chatRoute={(applicationId) => `/(business)/messages/${applicationId}` as Href}
    />
  );
}
