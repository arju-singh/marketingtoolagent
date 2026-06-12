import "server-only";

// Server-side Firebase Admin: verify ID tokens, persist runs to Firestore from API routes.
// Configure via FIREBASE_SERVICE_ACCOUNT (one-line JSON) or GOOGLE_APPLICATION_CREDENTIALS.
import { getApps, initializeApp, cert, applicationDefault, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let app: App | null = null;

export function getAdminApp(): App | null {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0];
    return app;
  }
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (raw) {
      app = initializeApp({ credential: cert(JSON.parse(raw)) });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      app = initializeApp({ credential: applicationDefault() });
    } else {
      return null; // not configured — caller should no-op
    }
    return app;
  } catch {
    return null;
  }
}

export function getAdminDb(): Firestore | null {
  const a = getAdminApp();
  return a ? getFirestore(a) : null;
}

export function getAdminAuth(): Auth | null {
  const a = getAdminApp();
  return a ? getAuth(a) : null;
}

/** True when Firebase Admin is configured (service account present). */
export function adminReady(): boolean {
  return getAdminApp() !== null;
}
