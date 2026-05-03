import { LC } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';
import React, { useEffect } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// ─── Icons (mirror app/(tabs)/index.tsx) ─────────────────────────────────

function RingClockIcon({ size = 54 }: { size?: number }) {
  const cx = size / 2;
  const r = size * 0.39;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx} cy={cx} r={r} stroke={LC.border} strokeWidth={1} fill="none" />
      <Circle
        cx={cx}
        cy={cx}
        r={r}
        stroke={LC.red}
        strokeWidth={2}
        strokeDasharray={2 * Math.PI * r}
        strokeDashoffset={2 * Math.PI * r * 0.62}
        strokeLinecap="round"
        fill="none"
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const r1 = r + 1;
        const r2 = r + 3;
        return (
          <Line
            key={i}
            x1={cx + Math.cos(a) * r1}
            y1={cx + Math.sin(a) * r1}
            x2={cx + Math.cos(a) * r2}
            y2={cx + Math.sin(a) * r2}
            stroke={LC.textDim}
            strokeWidth={1}
          />
        );
      })}
    </Svg>
  );
}

function ChevronRightIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={LC.textDim}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PlayIcon({ size = 30 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={size * 0.45} height={size * 0.45} viewBox="0 0 10 10">
        <Path d="M1 1l8 4-8 4V1z" fill={LC.red} />
      </Svg>
    </View>
  );
}

function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 6l12 12M18 6L6 18"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  taskTitle: string | null;
  onClose: () => void;
  onPick: (mode: 'timelapse' | 'stopwatch') => void;
}

export default function GrindModePicker({ visible, taskTitle, onClose, onPick }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(40);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
      translateY.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });
    } else {
      opacity.value = 0;
      translateY.value = 40;
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View style={[styles.card, cardStyle]} pointerEvents="box-none">
          {/* Close button */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close picker"
          >
            <CloseIcon size={14} />
          </Pressable>

          {/* Header */}
          <Text style={styles.bannerEyebrow}>◆ PICK YOUR WEAPON</Text>
          {taskTitle ? (
            <Text style={styles.taskSubtitle} numberOfLines={1}>
              FOR: <Text style={styles.taskSubtitleAccent}>{taskTitle.toUpperCase()}</Text>
            </Text>
          ) : null}

          {/* Timelapse hero */}
          <Pressable
            onPress={() => onPick('timelapse')}
            style={({ pressed }) => [styles.heroWrap, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Timelapse grind"
          >
            <View style={styles.heroCard}>
              <View style={styles.heroGlow1} pointerEvents="none" />
              <View style={styles.heroGlow2} pointerEvents="none" />

              {[0.33, 0.66].map((p) => (
                <View
                  key={`h${p}`}
                  pointerEvents="none"
                  style={[styles.ruleH, { top: `${p * 100}%` }]}
                />
              ))}
              {[0.33, 0.66].map((p) => (
                <View
                  key={`v${p}`}
                  pointerEvents="none"
                  style={[styles.ruleV, { left: `${p * 100}%` }]}
                />
              ))}

              <View style={styles.recommendedFlag}>
                <Text style={styles.recommendedText}>★ RECOMMENDED</Text>
              </View>

              <View style={styles.adaptiveBadge}>
                <View style={styles.adaptiveDot} />
                <Text style={styles.adaptiveText}>ADAPTIVE</Text>
              </View>

              <View style={styles.heroContent}>
                <Text style={styles.heroWatermark}>01</Text>
                <Text style={styles.heroEyebrow}>MODE 01</Text>
                <Text style={styles.heroTitle}>
                  TIMELAPSE{'\n'}
                  <Text style={styles.heroTitleAccent}>GRIND</Text>
                </Text>
                <Text style={styles.heroDesc}>
                  Camera rolls. Share-ready timelapses you can flex on the leaderboard.
                </Text>
                <View style={styles.heroCta}>
                  <Text style={styles.heroCtaLabel}>START RECORDING</Text>
                  <PlayIcon size={28} />
                </View>
              </View>
            </View>
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>OR KEEP IT LOWKEY</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Stopwatch secondary */}
          <Pressable
            onPress={() => onPick('stopwatch')}
            style={({ pressed }) => [styles.secondaryWrap, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Stopwatch grind"
          >
            <View style={styles.secondaryCard}>
              <View style={styles.secondaryIconWrap}>
                <RingClockIcon size={48} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.secondaryEyebrowRow}>
                  <Text style={styles.secondaryEyebrow}>MODE 02</Text>
                  <View style={styles.secondaryEyebrowDot} />
                  <Text style={styles.secondaryEyebrow}>NO CAMERA</Text>
                </View>
                <Text style={styles.secondaryTitle}>STOPWATCH GRIND</Text>
                <Text style={styles.secondaryDesc}>
                  Just a timer. Same 1:1 reward. No video.
                </Text>
              </View>
              <ChevronRightIcon size={18} />
            </View>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: SCREEN_HEIGHT * 0.9,
    backgroundColor: LC.bg,
    borderWidth: 1,
    borderColor: LC.border,
    borderRadius: 24,
    paddingTop: 22,
    paddingBottom: 18,
    paddingHorizontal: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pressed: {
    opacity: 0.75,
  },
  bannerEyebrow: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 10,
    letterSpacing: 3,
    color: LC.red,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  taskSubtitle: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.5,
    color: LC.textMute,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  taskSubtitleAccent: {
    color: LC.text,
  },
  // Hero card
  heroWrap: {},
  heroCard: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,59,92,0.35)',
    backgroundColor: '#1a1210',
    shadowColor: LC.red,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 8,
  },
  heroGlow1: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(180,110,60,0.25)',
  },
  heroGlow2: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,59,92,0.12)',
  },
  ruleH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  ruleV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  recommendedFlag: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: LC.red,
    zIndex: 2,
  },
  recommendedText: {
    fontFamily: Fonts.monoBold,
    fontSize: 9,
    color: '#fff',
    letterSpacing: 1.5,
  },
  adaptiveBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,92,0.4)',
    zIndex: 2,
  },
  adaptiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: LC.red,
    shadowColor: LC.red,
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  adaptiveText: {
    fontFamily: Fonts.monoBold,
    fontSize: 9,
    color: LC.red,
    letterSpacing: 1.5,
  },
  heroContent: {
    position: 'relative',
    paddingTop: 46,
    paddingBottom: 16,
    paddingHorizontal: 18,
  },
  heroWatermark: {
    position: 'absolute',
    right: 10,
    top: 20,
    fontFamily: Fonts.display,
    fontSize: 110,
    lineHeight: 100,
    color: 'rgba(255,59,92,0.08)',
    letterSpacing: -3,
  },
  heroEyebrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: Fonts.display,
    fontSize: 36,
    lineHeight: 42,
    color: LC.text,
    letterSpacing: 0.5,
    marginTop: 4,
    includeFontPadding: false,
  },
  heroTitleAccent: {
    color: LC.red,
  },
  heroDesc: {
    fontFamily: Fonts.interRegular,
    fontSize: 12,
    color: LC.textDim,
    marginTop: 8,
    lineHeight: 17,
    maxWidth: 260,
  },
  heroCta: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: LC.red,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: LC.red,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
  heroCtaLabel: {
    fontFamily: Fonts.display,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 2,
    color: '#fff',
    includeFontPadding: false,
  },
  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: LC.border,
  },
  dividerLabel: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 9,
    color: LC.textMute,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  // Secondary card
  secondaryWrap: {},
  secondaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
  },
  secondaryIconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secondaryEyebrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.5,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
  secondaryEyebrowDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: LC.textMute,
  },
  secondaryTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    lineHeight: 28,
    color: LC.text,
    letterSpacing: 0.5,
    marginTop: 2,
    includeFontPadding: false,
  },
  secondaryDesc: {
    fontFamily: Fonts.interRegular,
    fontSize: 12,
    color: LC.textDim,
    marginTop: 4,
    lineHeight: 16,
  },
});
