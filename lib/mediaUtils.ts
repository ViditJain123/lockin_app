import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

export async function shareVideo(videoUri: string): Promise<boolean> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.warn('[MediaUtils] Sharing not available on this device');
      return false;
    }

    await Sharing.shareAsync(videoUri, {
      mimeType: 'video/mp4',
      dialogTitle: 'Share your timelapse',
    });
    return true;
  } catch (error) {
    console.error('[MediaUtils] Share failed:', error);
    return false;
  }
}

export async function saveToGallery(videoUri: string): Promise<string | null> {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Media library permission required');
    }

    const asset = await MediaLibrary.createAssetAsync(videoUri);
    return asset.id;
  } catch (error) {
    console.error('[MediaUtils] Save to gallery failed:', error);
    throw error;
  }
}
