import { Stack } from 'expo-router';
import React from 'react';

import { LC } from '@/constants/BrandColors';

// Single-dashboard navigation: `index` is the dashboard and every other
// screen in this group is pushed on top of it with a back button.
export default function DashboardLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: LC.bg },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="tasks" />
      <Stack.Screen name="leaderboard" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
