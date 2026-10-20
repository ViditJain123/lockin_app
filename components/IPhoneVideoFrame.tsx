import { ResizeMode, Video } from 'expo-av';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface Props {
  source: number;
  height: number;
  style?: ViewStyle;
}

const SCREEN_ASPECT = 19.5 / 9;

export default function IPhoneVideoFrame({ source, height, style }: Props) {
  const bezel = Math.max(7, Math.round(height * 0.018));
  const screenHeight = height - bezel * 2;
  const screenWidth = screenHeight / SCREEN_ASPECT;
  const width = screenWidth + bezel * 2;
  const outerRadius = Math.round(width * 0.16);
  const innerRadius = Math.max(outerRadius - bezel, 22);

  const islandWidth = screenWidth * 0.32;
  const islandHeight = islandWidth * 0.32;
  const islandTop = islandHeight * 0.25;

  const indicatorWidth = screenWidth * 0.34;

  const buttonWidth = 2.5;
  const volumeBtnHeight = height * 0.05;
  const powerBtnHeight = height * 0.09;

  return (
    <View style={[styles.shadow, { width, height, borderRadius: outerRadius }, style]}>
      {/* Outer titanium body */}
      <View style={[styles.body, { width, height, borderRadius: outerRadius }]}>
        {/* Inner screen */}
        <View
          style={[
            styles.screen,
            {
              width: screenWidth,
              height: screenHeight,
              borderRadius: innerRadius,
            },
          ]}
        >
          <Video
            source={source}
            style={StyleSheet.absoluteFill}
            isMuted
            isLooping
            shouldPlay
            resizeMode={ResizeMode.COVER}
          />

          {/* Dynamic Island */}
          <View
            pointerEvents="none"
            style={[
              styles.dynamicIsland,
              {
                width: islandWidth,
                height: islandHeight,
                borderRadius: islandHeight / 2,
                top: islandTop,
              },
            ]}
          />

          {/* Home indicator */}
          <View
            pointerEvents="none"
            style={[
              styles.homeIndicator,
              {
                width: indicatorWidth,
                bottom: bezel + 4,
                marginLeft: -indicatorWidth / 2,
              },
            ]}
          />
        </View>
      </View>

      {/* Side buttons */}
      <View
        style={[
          styles.sideButton,
          {
            left: -buttonWidth + 0.5,
            top: height * 0.18,
            width: buttonWidth,
            height: height * 0.035,
          },
        ]}
      />
      <View
        style={[
          styles.sideButton,
          {
            left: -buttonWidth + 0.5,
            top: height * 0.26,
            width: buttonWidth,
            height: volumeBtnHeight,
          },
        ]}
      />
      <View
        style={[
          styles.sideButton,
          {
            left: -buttonWidth + 0.5,
            top: height * 0.34,
            width: buttonWidth,
            height: volumeBtnHeight,
          },
        ]}
      />
      <View
        style={[
          styles.sideButton,
          {
            right: -buttonWidth + 0.5,
            top: height * 0.24,
            width: buttonWidth,
            height: powerBtnHeight,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#0E0E0E',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 30,
    elevation: 20,
  },
  body: {
    backgroundColor: '#1a1a1c',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#333333',
  },
  screen: {
    overflow: 'hidden',
    backgroundColor: '#0E0E0E',
  },
  dynamicIsland: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#0E0E0E',
    zIndex: 2,
  },
  homeIndicator: {
    position: 'absolute',
    left: '50%',
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.85)',
    zIndex: 2,
  },
  sideButton: {
    position: 'absolute',
    backgroundColor: '#2c2c2e',
    borderRadius: 1.5,
  },
});
