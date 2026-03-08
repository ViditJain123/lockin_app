import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const FOCUS_BLUE = '#2563EB';
const PAUSE_ORANGE = '#F97316';
const ACCENT_ORANGE = '#F97316';

const TEXT_SHADOW = {
  textShadowColor: 'rgba(0,0,0,0.75)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}.${m}.${d}`;
}

function formatClock(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

// ── Focus bracket corner ──
function BracketCorner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const size = 14;
  const thickness = 2;
  const color = 'rgba(255,255,255,0.85)';

  const isTop = position[0] === 't';
  const isLeft = position[1] === 'l';

  return (
    <View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        top: isTop ? 0 : undefined,
        bottom: !isTop ? 0 : undefined,
        left: isLeft ? 0 : undefined,
        right: !isLeft ? 0 : undefined,
      }}
    >
      {/* Horizontal bar */}
      <View
        style={{
          position: 'absolute',
          height: thickness,
          width: size,
          backgroundColor: color,
          top: isTop ? 0 : undefined,
          bottom: !isTop ? 0 : undefined,
          left: isLeft ? 0 : undefined,
          right: !isLeft ? 0 : undefined,
        }}
      />
      {/* Vertical bar */}
      <View
        style={{
          position: 'absolute',
          width: thickness,
          height: size,
          backgroundColor: color,
          top: isTop ? 0 : undefined,
          bottom: !isTop ? 0 : undefined,
          left: isLeft ? 0 : undefined,
          right: !isLeft ? 0 : undefined,
        }}
      />
    </View>
  );
}

// ═══════════════════════════════════════
// Main overlay
// ═══════════════════════════════════════

interface DigicamOverlayProps {
  isWorking: boolean;
  elapsedSeconds: number;
}

// Isolated timer component — only this re-renders every second
const TimerDisplay = React.memo(({ elapsedSeconds }: { elapsedSeconds: number }) => (
  <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
));

function DigicamOverlay({ isWorking, elapsedSeconds }: DigicamOverlayProps) {
  // ── Current date/time (updates every 60s) ──
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ── REC dot blink ──
  const recOpacity = useSharedValue(1);

  useEffect(() => {
    if (isWorking) {
      recOpacity.value = withRepeat(
        withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      recOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [isWorking, recOpacity]);

  const recDotAnimStyle = useAnimatedStyle(() => ({
    opacity: recOpacity.value,
  }));

  // ── Focus brackets ──
  const bracketScale = useSharedValue(1);
  const bracketOpacity = useSharedValue(0.7);

  useEffect(() => {
    if (isWorking) {
      // Focus locked — snap-pulse then settle
      bracketOpacity.value = withTiming(1, { duration: 150 });
      bracketScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withTiming(1.0, { duration: 150 }),
      );
    } else {
      // Searching — slow opacity pulse
      bracketScale.value = withTiming(1, { duration: 200 });
      bracketOpacity.value = withRepeat(
        withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }
  }, [isWorking, bracketScale, bracketOpacity]);

  const bracketAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bracketScale.value }],
    opacity: bracketOpacity.value,
  }));

  // ── AF-L flash ──
  const aflOpacity = useSharedValue(0);

  useEffect(() => {
    if (isWorking) {
      aflOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(1, { duration: 1200 }), // hold
        withTiming(0, { duration: 300 }),
      );
    } else {
      aflOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isWorking, aflOpacity]);

  const aflAnimStyle = useAnimatedStyle(() => ({
    opacity: aflOpacity.value,
  }));

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* ── Top row ── */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <Animated.View
            style={[
              styles.recDot,
              { backgroundColor: isWorking ? FOCUS_BLUE : PAUSE_ORANGE },
              recDotAnimStyle,
            ]}
          />
          <Text style={styles.recText}>
            {isWorking ? 'REC' : 'PAUSE'}
          </Text>
          <TimerDisplay elapsedSeconds={elapsedSeconds} />
        </View>

        <View style={styles.topRight}>
          <Text style={styles.resolutionText}>720p</Text>
          <View style={styles.hdBadge}>
            <Text style={styles.hdText}>HD</Text>
          </View>
        </View>
      </View>

      {/* ── AF-L indicator (top center) ── */}
      <Animated.View style={[styles.aflContainer, aflAnimStyle]}>
        <Text style={styles.aflText}>AF-L</Text>
      </Animated.View>

      {/* ── Focus brackets (center) ── */}
      <Animated.View style={[styles.bracketsContainer, bracketAnimStyle]}>
        <BracketCorner position="tl" />
        <BracketCorner position="tr" />
        <BracketCorner position="bl" />
        <BracketCorner position="br" />
      </Animated.View>

      {/* ── Bottom row ── */}
      <View style={styles.bottomRow}>
        <View style={styles.bottomLeft}>
          <Text style={styles.dateText}>{formatDate(now)}</Text>
          <Text style={styles.clockText}>{formatClock(now)}</Text>
        </View>

      </View>

      {/* ── Brand logo (absolute bottom-right) ── */}
      <Image
        source={require('../assets/images/logo-no-bg.png')}
        style={styles.brandLogo}
        resizeMode="contain"
      />
    </View>
  );
}

// Only re-render the full overlay when isWorking changes.
// TimerDisplay handles per-second elapsedSeconds updates independently.
export default React.memo(DigicamOverlay, (prev, next) =>
  prev.isWorking === next.isWorking
);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 12,
  },

  // ── Top ──
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#FFFFFF',
    ...TEXT_SHADOW,
  },
  timerText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#FFFFFF',
    ...TEXT_SHADOW,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resolutionText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: '#FFFFFF',
    ...TEXT_SHADOW,
  },
  hdBadge: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 2,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  hdText: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    color: '#FFFFFF',
    ...TEXT_SHADOW,
  },

  // ── AF-L ──
  aflContainer: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  aflText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: '#4ADE80',
    ...TEXT_SHADOW,
  },

  // ── Focus brackets ──
  bracketsContainer: {
    width: '42%',
    aspectRatio: 1,
    alignSelf: 'center',
  },

  // ── Bottom ──
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bottomLeft: {
    gap: 2,
  },
  dateText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: ACCENT_ORANGE,
    ...TEXT_SHADOW,
  },
  clockText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: ACCENT_ORANGE,
    ...TEXT_SHADOW,
  },
  brandLogo: {
    position: 'absolute',
    bottom: -20,
    right: 0,
    height: 100,
    width: 84,
    opacity: 0.85,
  },
});
