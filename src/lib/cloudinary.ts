import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase';

export interface CloudinaryResult {
  url: string;
  publicId: string;
}

export function cloudinaryConfigured(): boolean {
  return true; // Firebase Storage uses existing Firebase config
}

export async function uploadToCloudinary(file: File): Promise<CloudinaryResult> {
  const storage = getStorage(app);
  const path = `gallery/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, publicId: path };
}
