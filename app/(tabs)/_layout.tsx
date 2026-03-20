import { isTablet } from '@/lib/responsive';
import { useRecordingStore } from '@/store/useRecordingStore';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';

export default function TabLayout() {
  const isSessionActive = useRecordingStore((s) => s.isSessionActive);
  const isFinishing = useRecordingStore((s) => s.isFinishing);
  const isPreparing = useRecordingStore((s) => s.isPreparing);
  const isCountingDown = useRecordingStore((s) => s.isCountingDown);

  const hideTabBar = isSessionActive || isFinishing || isPreparing || isCountingDown;

  if (isTablet()) {
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#FF3B5C',
          tabBarInactiveTintColor: '#888',
          tabBarStyle: {
            backgroundColor: '#000',
            display: hideTabBar ? 'none' : 'flex',
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="analytics-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="checkbox-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: 'Camera',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="camera" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    );
  }

  return (
    <NativeTabs
      tintColor="#FF3B5C"
      tabBarHidden={hideTabBar}
      backgroundColor="#000000"
      minimizeBehavior="onScrollDown"
    >
      {/*
        TAB ORDER (LEFT -> RIGHT)
        1. Analytics
        2. Tasks
        3. Profile
        --- separated circular button ---
        4. Camera (index) -- role="search" makes it a standalone circle on iOS 26
      */}

      <NativeTabs.Trigger name="analytics">
        <Icon sf="target" />
        <Label>Analytics</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="tasks">
        <Icon sf="checklist" />
        <Label>Tasks</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Icon sf="person.fill" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="index" role="search">
        <Icon sf="camera.fill" />
        <Label>Camera</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
