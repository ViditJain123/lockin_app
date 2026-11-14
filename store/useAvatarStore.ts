import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Your own profile picture. Kept on device for now: a copied photo, or a
// chosen mascot colour (null = the default colour derived from your id).
interface AvatarState {
  photoUri: string | null;
  variant: number | null;
  setPhoto: (pickedUri: string) => Promise<void>;
  setVariant: (variant: number) => Promise<void>;
  removePhoto: () => Promise<void>;
}

async function deleteQuietly(uri: string | null) {
  if (!uri) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {}
}

export const useAvatarStore = create<AvatarState>()(
  persist(
    (set, get) => ({
      photoUri: null,
      variant: null,

      // The picker's file lives in a cache dir, so copy it somewhere permanent
      setPhoto: async (pickedUri) => {
        const dest = `${FileSystem.documentDirectory}avatar-${Date.now()}.jpg`;
        await FileSystem.copyAsync({ from: pickedUri, to: dest });
        const old = get().photoUri;
        set({ photoUri: dest });
        await deleteQuietly(old);
      },

      setVariant: async (variant) => {
        const old = get().photoUri;
        set({ variant, photoUri: null });
        await deleteQuietly(old);
      },

      removePhoto: async () => {
        const old = get().photoUri;
        set({ photoUri: null });
        await deleteQuietly(old);
      },
    }),
    {
      name: 'avatar-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
