import GlassBottomTabBar from '@/components/GlassBottomTabBar';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false, // Ensure headers are hidden as per "No additional tabs, overflow menus..." implicitly suggesting full screen focus or custom headers if needed.
        // Actually prompt says "This navigation contains ONLY THREE TABS... No additional tabs, overflow menus, or hidden actions are allowed."
        // And "Camera is the primary experience". Usually camera apps have their own overlay headers.
      }}
    >
      {/* 
        EXACT TAB ORDER (LEFT → RIGHT)
        1. Settings
        2. Camera (index)
        3. Profile
      */}
      
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Camera',
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
