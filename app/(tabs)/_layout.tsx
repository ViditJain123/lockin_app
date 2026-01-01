import { useRecordingStore } from '@/store/useRecordingStore';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';

export default function TabLayout() {
  const isRecording = useRecordingStore((s) => s.isRecording);
  const isFinishing = useRecordingStore((s) => s.isFinishing);
  const isPreparing = useRecordingStore((s) => s.isPreparing);
  const isCountingDown = useRecordingStore((s) => s.isCountingDown);

  return (
    <NativeTabs
      tintColor="#fa576a"
      tabBarHidden={isRecording || isFinishing || isPreparing || isCountingDown}
    >
      {/* 
        EXACT TAB ORDER (LEFT → RIGHT)
        1. Settings
        2. Camera (index)
        3. Profile
      */}
      
      <NativeTabs.Trigger name="settings">
        <Icon sf="gear" />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="index">
        <Icon sf="camera.fill" />
        <Label>Camera</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="profile">
        <Icon sf="person.fill" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
