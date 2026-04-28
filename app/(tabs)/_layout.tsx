import { Tabs } from 'expo-router';
import React from 'react';

import { LCTabBar } from '@/components/lc/LCTabBar';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
      tabBar={(props) => <LCTabBar {...props} />}
    >
      {/*
        TAB ORDER (LEFT -> CENTER -> RIGHT)
        1. analytics  — STATS
        2. tasks      — TASKS
        3. index      — LOCK IN (Pick Your Weapon; center elevated button)
        4. leaderboard — RANKS
        5. profile    — ME
        Order here must match TAB_ORDER in components/lc/LCTabBar.tsx.
      */}
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="leaderboard" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
