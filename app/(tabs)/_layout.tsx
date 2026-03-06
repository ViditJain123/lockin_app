import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';

export default function TabLayout() {
  return (
    <NativeTabs
      tintColor="#FF3B5C"
      backgroundColor="#000000"
      minimizeBehavior="onScrollDown"
    >
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
