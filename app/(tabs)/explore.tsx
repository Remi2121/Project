import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import Explore from '../explore/explore';

export default function ExploreTab() {
  const params = useLocalSearchParams();
  return <Explore routeParams={params} />;
}
