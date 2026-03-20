import React from 'react';
import { StyleSheet, View } from 'react-native';

import { MAX_CONTENT_WIDTH, isTablet } from '../lib/responsive';

interface TabletContainerProps {
  children: React.ReactNode;
  backgroundColor?: string;
}

export default function TabletContainer({
  children,
  backgroundColor = '#000',
}: TabletContainerProps) {
  if (!isTablet()) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.outer, { backgroundColor }]}>
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
});
