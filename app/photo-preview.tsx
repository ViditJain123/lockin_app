import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { shareAsync } from 'expo-sharing';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PhotoCardRenderer from '@/components/PhotoCardRenderer';
import { LC } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';
import * as Haptics from '@/lib/haptics';
import { posthog } from '@/lib/posthog';
import { useTaskStore } from '@/store/useTaskStore';
import {
  flushGallery,
  resolveUri,
  useVideoGalleryStore,
} from '@/store/useVideoGalleryStore';

const MONTH_ABBR = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

function formatDate(d: Date): string {
  return `${d.getDate()} ${MONTH_ABBR[d.getMonth()]}, ${d.getFullYear()}`;
}

export default function PhotoPreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    photoUri?: string;
    lockedInSeconds?: string;
    sessionId?: string;
    activeTaskId?: string;
  }>();

  const cardRef = useRef<View>(null);
  const cardUriRef = useRef<string | null>(null);
  const stablePhotoUriRef = useRef<string | null>(null);

  const [isWorking, setIsWorking] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [readyPhotoUri, setReadyPhotoUri] = useState<string | null>(null);

  const lockedInSeconds = Number(params.lockedInSeconds ?? '0') || 0;
  const sessionId = params.sessionId ?? '';
  const activeTaskId = params.activeTaskId ?? null;

  const taskName = useTaskStore((s) => {
    if (!activeTaskId) return null;
    return s.tasks.find((t) => t.id === activeTaskId)?.title ?? null;
  });

  // The expo-camera cache directory can be evicted by iOS when the app is
  // backgrounded. Copy the raw photo into Documents on mount so retake/share
  // and the card capture below all reference a stable absolute path.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const src = params.photoUri;
      if (!src) {
        Alert.alert('Missing photo', 'No photo was provided.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }
      try {
        const photosDir = FileSystem.documentDirectory + 'photos/';
        await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
        const dest = photosDir + (sessionId || `tmp_${Date.now()}`) + '.jpg';
        // Always overwrite. On retake we land here with a fresh raw photo; a
        // stale file at this path from a previous visit would otherwise be
        // shown forever because the src photo URI changes but the dest path
        // is keyed on sessionId.
        try { await FileSystem.deleteAsync(dest, { idempotent: true }); } catch {}
        await FileSystem.copyAsync({ from: src, to: dest });
        if (cancelled) return;
        stablePhotoUriRef.current = dest;
        setReadyPhotoUri(dest);
      } catch (err: any) {
        console.warn('[PhotoPreview] Failed to stage raw photo:', err);
        posthog.capture('photo_preview_stage_failed', {
          error: err?.message ?? String(err),
        });
        if (cancelled) return;
        // Fall back to the cache uri — better to display something than nothing
        stablePhotoUriRef.current = src;
        setReadyPhotoUri(src);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.photoUri, sessionId, router]);

  const ensureCaptured = useCallback(async (): Promise<string | null> => {
    if (cardUriRef.current) return cardUriRef.current;
    if (!cardRef.current) return null;
    try {
      const tmpUri = await captureRef(cardRef, {
        format: 'jpg',
        quality: 0.92,
        result: 'tmpfile',
      });
      const cardsDir = FileSystem.documentDirectory + 'photo-cards/';
      await FileSystem.makeDirectoryAsync(cardsDir, { intermediates: true });
      const dest = cardsDir + (sessionId || `tmp_${Date.now()}`) + '.jpg';
      // Overwrite if it exists from a previous attempt
      try { await FileSystem.deleteAsync(dest, { idempotent: true }); } catch {}
      await FileSystem.copyAsync({ from: tmpUri, to: dest });
      cardUriRef.current = dest;
      return dest;
    } catch (err: any) {
      console.warn('[PhotoPreview] captureRef failed:', err);
      posthog.capture('photo_card_render_failed', {
        error: err?.message ?? String(err),
      });
      return null;
    }
  }, [sessionId]);

  const handleSave = useCallback(async () => {
    if (isWorking) return;
    setIsWorking(true);
    try {
      const card = await ensureCaptured();
      if (!card) {
        Alert.alert('Render failed', "Couldn't render your card. Try again.");
        return;
      }
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to save photos.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(card);
      posthog.capture('photo_card_saved');
      Haptics.animationReveal();
      Alert.alert('Saved', 'Photo card saved to your gallery.');
    } catch (err: any) {
      console.warn('[PhotoPreview] Save failed:', err);
      Alert.alert('Save failed', "Couldn't save the photo card.");
    } finally {
      setIsWorking(false);
    }
  }, [ensureCaptured, isWorking]);

  const handleShare = useCallback(async () => {
    if (isWorking) return;
    setIsWorking(true);
    try {
      const card = await ensureCaptured();
      if (!card) {
        Alert.alert('Render failed', "Couldn't render your card. Try again.");
        return;
      }
      await shareAsync(card, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share grind',
      });
      posthog.capture('photo_card_shared');
    } catch (err: any) {
      console.warn('[PhotoPreview] Share failed:', err);
    } finally {
      setIsWorking(false);
    }
  }, [ensureCaptured, isWorking]);

  const handleRetake = useCallback(() => {
    if (isContinuing) return;
    posthog.capture('photo_retake');
    // Drop the cached card so the next visit re-captures
    cardUriRef.current = null;
    router.back();
  }, [isContinuing, router]);

  const handleContinue = useCallback(async () => {
    if (isContinuing) return;
    setIsContinuing(true);
    try {
      const card = await ensureCaptured();
      const stablePhoto = stablePhotoUriRef.current;
      const id = sessionId || `photo_${Date.now()}`;

      if (!card) {
        // Soft fail — let the user continue without a gallery entry. Their
        // session is already saved in the stopwatch handler.
        Alert.alert(
          "Couldn't render your card",
          'Your grind is still saved. Continue without the card?',
          [
            { text: 'Retake', style: 'cancel', onPress: () => setIsContinuing(false) },
            {
              text: 'Continue',
              onPress: () => {
                // Clear photo-capture + photo-preview from the stack so
                // grind-complete sits directly on tabs and "Done" goes home.
                router.dismissAll();
                router.push({
                  pathname: '/grind-complete',
                  params: {
                    grindDurationSeconds: String(lockedInSeconds),
                    lockedInSeconds: String(lockedInSeconds),
                    ...(activeTaskId ? { activeTaskId } : {}),
                  },
                } as any);
              },
            },
          ],
        );
        return;
      }

      // Convert absolute paths back to relative (same convention as timelapse).
      const docDir = FileSystem.documentDirectory ?? '';
      const cardRel = card.startsWith(docDir) ? card.slice(docDir.length) : card;
      const photoRel = stablePhoto && stablePhoto.startsWith(docDir)
        ? stablePhoto.slice(docDir.length)
        : (stablePhoto ?? cardRel);

      try {
        useVideoGalleryStore.getState().addRecording({
          id,
          type: 'photo',
          photoUri: photoRel,
          cardUri: cardRel,
          thumbnailUri: cardRel,
          sessionDurationSeconds: lockedInSeconds,
          createdAt: new Date().toISOString(),
        });
        await flushGallery();
        posthog.capture('photo_continue', { sessionId: id });
      } catch (err: any) {
        console.warn('[PhotoPreview] addRecording failed:', err);
        posthog.capture('photo_continue_failed', {
          error: err?.message ?? String(err),
        });
      }

      // Clear photo-capture + photo-preview so grind-complete sits directly on
      // tabs. Without this, "Done" on grind-complete pops to photo-capture
      // instead of returning the user home.
      router.dismissAll();
      router.push({
        pathname: '/grind-complete',
        params: {
          grindDurationSeconds: String(lockedInSeconds),
          lockedInSeconds: String(lockedInSeconds),
          ...(activeTaskId ? { activeTaskId } : {}),
        },
      } as any);
    } catch (err: any) {
      console.warn('[PhotoPreview] Continue failed:', err);
      setIsContinuing(false);
    }
  }, [
    ensureCaptured,
    isContinuing,
    lockedInSeconds,
    sessionId,
    activeTaskId,
    router,
  ]);

  const dateText = formatDate(new Date());

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Top chrome */}
      <View style={[styles.topRow, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={handleRetake}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          hitSlop={12}
          accessibilityLabel="Retake"
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>YOUR GRIND</Text>
        <View style={styles.iconBtnSpacer} />
      </View>

      {/* Card preview */}
      <View style={styles.cardWrap}>
        <View style={styles.cardSlot}>
          {readyPhotoUri ? (
            <PhotoCardRenderer
              ref={cardRef}
              photoUri={readyPhotoUri}
              taskName={taskName}
              durationSeconds={lockedInSeconds}
              dateText={dateText}
            />
          ) : (
            <View style={styles.cardPlaceholder}>
              <ActivityIndicator color={LC.text} />
            </View>
          )}
        </View>
      </View>

      {/* Action row */}
      <View style={[styles.actionsWrap, { paddingBottom: Math.max(insets.bottom + 18, 24) }]}>
        <View style={styles.secondaryRow}>
          <Pressable
            onPress={handleSave}
            disabled={isWorking || !readyPhotoUri}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.pressed,
              (isWorking || !readyPhotoUri) && styles.disabled,
            ]}
          >
            <Ionicons name="download-outline" size={18} color="#fff" />
            <Text style={styles.secondaryLabel}>SAVE</Text>
          </Pressable>
          <Pressable
            onPress={handleShare}
            disabled={isWorking || !readyPhotoUri}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.pressed,
              (isWorking || !readyPhotoUri) && styles.disabled,
            ]}
          >
            <Ionicons name="share-outline" size={18} color="#fff" />
            <Text style={styles.secondaryLabel}>SHARE</Text>
          </Pressable>
          <Pressable
            onPress={handleRetake}
            disabled={isContinuing}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.pressed,
              isContinuing && styles.disabled,
            ]}
          >
            <Ionicons name="camera-reverse-outline" size={18} color="#fff" />
            <Text style={styles.secondaryLabel}>RETAKE</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleContinue}
          disabled={isContinuing || !readyPhotoUri}
          style={({ pressed }) => [
            styles.continueBtn,
            pressed && styles.pressed,
            (isContinuing || !readyPhotoUri) && styles.continueBtnDisabled,
          ]}
        >
          {isContinuing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueLabel}>CONTINUE</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LC.bg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnSpacer: {
    width: 36,
    height: 36,
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.4,
  },
  headerTitle: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 11,
    color: LC.text,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  cardWrap: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 9:16 vertical card. Height-anchored so a tall TikTok-format card scales to
  // fit the available space rather than overflowing on small phones.
  cardSlot: {
    height: '100%',
    aspectRatio: 9 / 16,
    maxWidth: '100%',
  },
  cardPlaceholder: {
    aspectRatio: 9 / 16,
    width: '100%',
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsWrap: {
    paddingHorizontal: 24,
    paddingTop: 14,
    gap: 14,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
  },
  secondaryLabel: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 11,
    color: '#fff',
    letterSpacing: 1.5,
  },
  continueBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: LC.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: LC.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  continueBtnDisabled: {
    backgroundColor: LC.redDeep,
    shadowOpacity: 0,
  },
  continueLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: '#fff',
    letterSpacing: 2.5,
  },
});
