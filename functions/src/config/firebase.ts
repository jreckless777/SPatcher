import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize the app if it hasn't been initialized already
if (getApps().length === 0) {
  initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'mock-project' });
}

export const db = getFirestore();
