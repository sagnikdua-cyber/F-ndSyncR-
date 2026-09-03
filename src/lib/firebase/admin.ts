import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function initializeAdmin() {
  if (getApps().length > 0) {
    return;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    // Missing configuration. Returning early allows build-time rendering to proceed 
    // without crashing if env vars are intentionally omitted during build.
    return;
  }

  try {
    // 1. Strip accidental surrounding quotes often added by copy-pasting in Vercel dashboard
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    } else if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
      privateKey = privateKey.slice(1, -1);
    }

    // 2. Properly restore escaped newline characters
    privateKey = privateKey.replace(/\\n/g, '\n');

    // 3. Validate PEM formatting safely without exposing the secret
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
      throw new Error('FIREBASE_ADMIN_PRIVATE_KEY is malformed (missing PEM headers/footers).');
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error) {
    console.error('Firebase Admin Server-Side Configuration Error:', error instanceof Error ? error.message : 'Unknown error');
    // We throw to prevent the server from silently accepting an invalid credential state at runtime
    throw new Error('Failed to initialize Firebase Admin. The private key or credentials may be invalid.');
  }
}

initializeAdmin();

export const adminAuth = getApps().length ? getAuth() : null;
export const adminDb = getApps().length ? getFirestore() : null;
