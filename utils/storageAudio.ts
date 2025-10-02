// utils/storageAudio.ts
import { getDownloadURL, listAll, ref } from 'firebase/storage';
import { storage } from './firebaseConfig';

export type StoredTrack = { name: string; url: string };

export async function listTracksByMood(mood: string): Promise<StoredTrack[]> {
  const clean = mood.trim().toLowerCase();   // "Sad" -> "sad"
  const folderRef = ref(storage, `${clean}/`); // ✅ root: "sad/"

  try {
    const res = await listAll(folderRef);
    const items = res.items || [];
    const urls = await Promise.all(items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return { name: itemRef.name, url };
    }));
    return urls;
  } catch (e: any) {
    console.warn(`listTracksByMood(${clean}) failed`, e?.code || e?.message || e);
    // Bubble up so UI shows a real error if rules/permissions block
    throw e;
  }
}
