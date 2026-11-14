import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LCBackButton } from '@/components/lc/LCBackButton';
import InitialsAvatar from '@/components/profile/InitialsAvatar';
import { Fonts } from '@/constants/Fonts';
import { cardShadow, RADIUS, T } from '@/constants/Theme';
import { useAuth } from '@/contexts/AuthContext';
import { buttonPress, optionSelect } from '@/lib/haptics';
import { useFriendRequestsStore, USERNAME_RE, type Relation, type UserHit } from '@/store/useFriendRequestsStore';
import { useFriendsStore } from '@/store/useFriendsStore';

const APP_URL = 'https://lockin.club';

function ActionButton({ status, onAdd, busy }: { status: Relation; onAdd: () => void; busy: boolean }) {
  if (status === 'friend') {
    return (
      <View style={[styles.btn, styles.btnMuted]}>
        <Ionicons name="checkmark" size={14} color={T.good} />
        <Text style={[styles.btnText, { color: T.good }]}>Friends</Text>
      </View>
    );
  }
  if (status === 'sent') {
    return (
      <View style={[styles.btn, styles.btnMuted]}>
        <Text style={[styles.btnText, { color: T.inkSoft }]}>Requested</Text>
      </View>
    );
  }
  return (
    <Pressable onPress={onAdd} disabled={busy} style={({ pressed }) => [styles.btn, styles.btnOrange, pressed && styles.pressed]} accessibilityRole="button">
      {busy ? (
        <ActivityIndicator size="small" color={T.white} />
      ) : (
        <>
          <Ionicons name={status === 'received' ? 'checkmark' : 'person-add'} size={13} color={T.white} />
          <Text style={styles.btnText}>{status === 'received' ? 'Accept' : 'Add'}</Text>
        </>
      )}
    </Pressable>
  );
}

function PersonRow({ u, right }: { u: UserHit; right: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <InitialsAvatar id={u.id} size={44} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.name} numberOfLines={1}>
          {u.name}
        </Text>
        {u.username ? (
          <Text style={styles.handle} numberOfLines={1}>
            @{u.username}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/** Pick or change your @username */
function UsernameSheet({ visible, initial, onClose, onSave }: { visible: boolean; initial: string; onClose: () => void; onSave: (u: string) => Promise<string | null> }) {
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (visible) {
      setValue(initial);
      setError(null);
    }
  }, [visible, initial]);

  const clean = value.trim().replace(/^@/, '').toLowerCase();
  const valid = USERNAME_RE.test(clean);

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    const err = await onSave(clean);
    setSaving(false);
    if (err) setError(err);
    else onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) + 6 }]}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>Your username</Text>
            <Text style={styles.sheetSub}>Friends search this to add you.</Text>
            <View style={[styles.input, { marginTop: 16 }]}>
              <Text style={styles.at}>@</Text>
              <TextInput
                value={value}
                onChangeText={(t) => {
                  setValue(t.toLowerCase());
                  setError(null);
                }}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={21}
                placeholder="yourname"
                placeholderTextColor={T.inkMute}
                style={styles.inputText}
                returnKeyType="done"
                onSubmitEditing={save}
              />
            </View>
            <Text style={[styles.rule, error && { color: '#FF6B5E' }]}>
              {error ?? '3–20 characters: letters, numbers, dots and underscores'}
            </Text>
            <Pressable onPress={save} disabled={!valid || saving} style={[styles.saveBtn, (!valid || saving) && { opacity: 0.4 }]} accessibilityRole="button">
              {saving ? <ActivityIndicator color={T.white} /> : <Text style={styles.saveText}>Save</Text>}
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function AddFriendsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const username = useFriendRequestsStore((s) => s.username);
  const requests = useFriendRequestsStore((s) => s.requests);
  const loadMe = useFriendRequestsStore((s) => s.loadMe);
  const setUsername = useFriendRequestsStore((s) => s.setUsername);
  const search = useFriendRequestsStore((s) => s.search);
  const sendRequest = useFriendRequestsStore((s) => s.sendRequest);
  const accept = useFriendRequestsStore((s) => s.accept);
  const decline = useFriendRequestsStore((s) => s.decline);
  const fetchFriends = useFriendsStore((s) => s.fetchFriends);

  const [q, setQ] = useState('');
  const [results, setResults] = useState<UserHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [editName, setEditName] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    if (userId) loadMe(userId);
  }, [userId, loadMe]);

  // Debounced search
  useEffect(() => {
    const term = q.trim().replace(/^@/, '');
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const my = ++reqId.current;
    const t = setTimeout(async () => {
      const hits = await search(term);
      if (my === reqId.current) {
        setResults(hits);
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, search]);

  const add = async (u: UserHit) => {
    buttonPress();
    setBusy(u.id);
    try {
      const next = await sendRequest(u.id);
      setResults((rs) => rs.map((r) => (r.id === u.id ? { ...r, status: next } : r)));
      if (next === 'friend' && userId) fetchFriends(userId);
    } catch {
      Alert.alert("Couldn't add", 'Check your connection and try again.');
    } finally {
      setBusy(null);
    }
  };

  const onAccept = async (u: UserHit) => {
    optionSelect();
    try {
      await accept(u.id);
      setResults((rs) => rs.map((r) => (r.id === u.id ? { ...r, status: 'friend' } : r)));
      if (userId) fetchFriends(userId);
    } catch {
      Alert.alert("Couldn't accept", 'Check your connection and try again.');
    }
  };

  const share = async () => {
    buttonPress();
    const handle = username ? ` Add me: @${username}` : '';
    try {
      await Share.share({ message: `I'm locking in on Lockin Club. Come lock in with me.${handle}\n${APP_URL}` });
    } catch {}
  };

  const saveUsername = async (u: string) => {
    const r = await setUsername(userId, u);
    if (r === 'ok') return null;
    if (r === 'taken') return 'That username is taken';
    if (r === 'invalid') return '3–20 characters: letters, numbers, dots and underscores';
    return "Couldn't save. Try again.";
  };

  const searchingMode = q.trim().replace(/^@/, '').length >= 2;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <LCBackButton />
        <Text style={styles.title}>Add friends</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.input}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <Ionicons name="search" size={18} color={T.inkSoft} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by username"
            placeholderTextColor={T.inkMute}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={styles.inputText}
            accessibilityLabel="Search by username"
          />
          {q ? (
            <Pressable onPress={() => setQ('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={T.inkMute} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 + insets.bottom }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {searchingMode ? (
          searching && results.length === 0 ? (
            <ActivityIndicator color={T.orange} style={{ marginTop: 30 }} />
          ) : results.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="person-outline" size={22} color={T.inkMute} />
              <Text style={styles.emptyTitle}>No one with that username</Text>
              <Text style={styles.emptySub}>Check the spelling, or share Lockin so they can join.</Text>
            </View>
          ) : (
            <View style={{ marginTop: 6 }}>
              {results.map((u) => (
                <PersonRow key={u.id} u={u} right={<ActionButton status={u.status} busy={busy === u.id} onAdd={() => (u.status === 'received' ? onAccept(u) : add(u))} />} />
              ))}
            </View>
          )
        ) : (
          <>
            {/* Your username */}
            <Pressable
              onPress={() => {
                optionSelect();
                setEditName(true);
              }}
              style={({ pressed }) => [styles.meCard, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={username ? `Your username @${username}. Edit` : 'Pick a username'}
            >
              <InitialsAvatar id={userId || 'you'} size={44} isMe />
              <View style={{ flex: 1 }}>
                <Text style={styles.meLabel}>YOUR USERNAME</Text>
                <Text style={[styles.meName, !username && { color: T.orange }]}>{username ? `@${username}` : 'Pick a username'}</Text>
              </View>
              <Ionicons name={username ? 'pencil' : 'chevron-forward'} size={16} color={T.inkSoft} />
            </Pressable>

            {/* Requests */}
            {requests.length > 0 ? (
              <>
                <Text style={styles.section}>REQUESTS · {requests.length}</Text>
                {requests.map((u) => (
                  <PersonRow
                    key={u.id}
                    u={u}
                    right={
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Pressable
                          onPress={() => {
                            optionSelect();
                            decline(u.id).catch(() => {});
                          }}
                          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                          accessibilityRole="button"
                          accessibilityLabel={`Decline ${u.name}`}
                        >
                          <Ionicons name="close" size={16} color={T.inkSoft} />
                        </Pressable>
                        <ActionButton status="received" busy={false} onAdd={() => onAccept(u)} />
                      </View>
                    }
                  />
                ))}
              </>
            ) : null}

            <View style={styles.hint}>
              <Ionicons name="at" size={18} color={T.orange} />
              <Text style={styles.hintText}>Search your friend's username to send a request. Once they accept, you'll see each other's timelapse stories and rank together.</Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Share Lockin */}
      <View style={[styles.shareWrap, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable onPress={share} style={({ pressed }) => [styles.share, pressed && styles.pressed]} accessibilityRole="button">
          <Ionicons name="share-outline" size={18} color={T.white} />
          <Text style={styles.shareText}>Share Lockin with friends</Text>
        </Pressable>
      </View>

      <UsernameSheet visible={editName} initial={username ?? ''} onClose={() => setEditName(false)} onSave={saveUsername} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.canvas },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  title: { fontFamily: Fonts.bold, fontSize: 20, color: T.ink },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },

  searchWrap: { paddingHorizontal: 16, marginTop: 16, marginBottom: 12 },
  input: {
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  inputText: { flex: 1, fontFamily: Fonts.semiBold, fontSize: 16, color: T.ink, paddingVertical: 0 },
  at: { fontFamily: Fonts.bold, fontSize: 17, color: T.orange },

  meCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: T.card,
    ...cardShadow,
  },
  meLabel: { fontFamily: Fonts.monoMedium, fontSize: 9.5, letterSpacing: 1.4, color: T.inkMute },
  meName: { marginTop: 2, fontFamily: Fonts.bold, fontSize: 17, color: T.ink },

  section: { marginTop: 24, marginBottom: 10, fontFamily: Fonts.monoMedium, fontSize: 10, letterSpacing: 1.6, color: T.inkMute },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.line,
  },
  name: { fontFamily: Fonts.bold, fontSize: 15, color: T.ink },
  handle: { marginTop: 1, fontFamily: Fonts.medium, fontSize: 12.5, color: T.inkMute },

  btn: {
    minWidth: 84,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  btnOrange: { backgroundColor: T.orange },
  btnMuted: { backgroundColor: T.sunk },
  btnText: { fontFamily: Fonts.bold, fontSize: 13, color: T.white },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.sunk,
  },

  hint: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,102,0,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,102,0,0.2)',
  },
  hintText: { flex: 1, fontFamily: Fonts.medium, fontSize: 13, lineHeight: 19, color: T.inkSoft },

  empty: { alignItems: 'center', marginTop: 40, gap: 6, paddingHorizontal: 30 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 16, color: T.ink },
  emptySub: { fontFamily: Fonts.medium, fontSize: 13, color: T.inkMute, textAlign: 'center' },

  shareWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: T.canvas,
  },
  share: {
    height: 54,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: T.orange,
  },
  shareText: { fontFamily: Fonts.bold, fontSize: 16, color: T.white },

  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: T.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: T.line,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  grabber: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: T.lineStrong, marginBottom: 16 },
  sheetTitle: { fontFamily: Fonts.bold, fontSize: 20, color: T.ink },
  sheetSub: { marginTop: 2, fontFamily: Fonts.medium, fontSize: 13, color: T.inkMute },
  rule: { marginTop: 8, fontFamily: Fonts.medium, fontSize: 12, color: T.inkMute },
  saveBtn: {
    marginTop: 18,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.orange,
  },
  saveText: { fontFamily: Fonts.bold, fontSize: 15, color: T.white },
});
