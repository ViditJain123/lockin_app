import { cacheDirectory, downloadAsync } from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

/**
 * Share a video using the system share sheet
 */
export async function shareVideo(videoUri: string): Promise<boolean> {
  try {
    // If it's a remote URL, download first
    let localUri = videoUri;
    if (videoUri.startsWith('http')) {
      const filename = `share_${Date.now()}.mp4`;
      const downloadPath = `${cacheDirectory}${filename}`;
      const { uri } = await downloadAsync(videoUri, downloadPath);
      localUri = uri;
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.warn('[MediaUtils] Sharing not available on this device');
      return false;
    }

    await Sharing.shareAsync(localUri, {
      mimeType: 'video/mp4',
      dialogTitle: 'Share your timelapse',
    });
    return true;
  } catch (error) {
    console.error('[MediaUtils] Share failed:', error);
    return false;
  }
}

/**
 * Save a video to the device's photo gallery
 */
export async function saveToGallery(videoUri: string): Promise<string | null> {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Media library permission required');
    }

    // If it's a remote URL, download first
    let localUri = videoUri;
    if (videoUri.startsWith('http')) {
      const filename = `download_${Date.now()}.mp4`;
      const downloadPath = `${cacheDirectory}${filename}`;
      const { uri } = await downloadAsync(videoUri, downloadPath);
      localUri = uri;
    }

    const asset = await MediaLibrary.createAssetAsync(localUri);
    console.log('[MediaUtils] Saved to gallery:', asset.id);
    return asset.id;
  } catch (error) {
    console.error('[MediaUtils] Save to gallery failed:', error);
    throw error;
  }
}
