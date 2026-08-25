import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { saveAs } from 'file-saver';

export async function downloadAndShareBuffer(fileName: string, buffer: ArrayBuffer, mimeType: string) {
  try {
    if (Capacitor.isNativePlatform()) {
      // Convert buffer to base64
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = btoa(binary);

      const writeResult = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: fileName,
        url: writeResult.uri,
      });
    } else {
      const blob = new Blob([buffer], { type: mimeType });
      saveAs(blob, fileName);
    }
  } catch (error) {
    console.error('Download/Share error:', error);
    throw error;
  }
}

export async function downloadAndShareBase64(fileName: string, base64Data: string, mimeType: string) {
  try {
    if (Capacitor.isNativePlatform()) {
      const writeResult = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: fileName,
        url: writeResult.uri,
      });
    } else {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      saveAs(blob, fileName);
    }
  } catch (error) {
    console.error('Download/Share error:', error);
    throw error;
  }
}
