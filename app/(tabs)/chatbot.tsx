import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import Chatbot from '../chatbot/chatbot';


export default function ChatbotTap() {
  const params = useLocalSearchParams();
  return <Chatbot routeParams={params} />;
}
