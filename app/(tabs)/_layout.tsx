import { useRecordingStore } from '@/store/useRecordingStore';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';

export default function TabLayout() {
  const isSessionActive = useRecordingStore((s) => s.isSessionActive);
  const isFinishing = useRecordingStore((s) => s.isFinishing);
  const isPreparing = useRecordingStore((s) => s.isPreparing);
  const isCountingDown = useRecordingStore((s) => s.isCountingDown);

  return (
    <NativeTabs
      tintColor="#FF3B5C"
      tabBarHidden={isSessionActive || isFinishing || isPreparing || isCountingDown}
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
