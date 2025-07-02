import admin from 'firebase-admin';

console.log("[Firebase Admin Init] Starting initialization process...");

// This function ensures the Firebase Admin app is initialized only once.
function getInitializedAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    const existingApp = admin.apps.find((app): app is admin.app.App => app !== null && app !== undefined);
    if (existingApp) {
      console.log("[Firebase Admin Init] Admin SDK already initialized in this process. Using existing app:", existingApp.name);
      return existingApp;
    }
    console.warn("[Firebase Admin Init] admin.apps.length > 0 but no valid app found. Proceeding with new initialization attempt.");
  }

  try {
    const serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
      console.log("[Firebase Admin Init] Initializing with service account credentials.");
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      console.log("[Firebase Admin Init] Attempting to initialize with Application Default Credentials (ADC).");
      return admin.initializeApp({});
    }
  } catch (error) {
    console.error("[Firebase Admin Init] Failed to initialize Admin SDK:", error);
    throw new Error("Failed to initialize Firebase Admin SDK");
  }
}

const adminAppInstance: admin.app.App = getInitializedAdminApp();
const adminDb = adminAppInstance.firestore();

export { adminDb, adminAppInstance };

// verifyIdToken needs adminAuth to be initialized.
export async function verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken | null> {
  if (!adminAppInstance) {
    console.error("[Firebase Admin Verify Token] Admin App instance is not initialized. Cannot verify ID token.");
    return null;
  }
  console.log("[Firebase Admin Verify Token] Attempting to verify ID token with adminAppInstance.auth()...");
  try {
    const decodedToken = await adminAppInstance.auth().verifyIdToken(idToken);
    console.log("[Firebase Admin Verify Token] ID Token verified successfully. UID:", decodedToken.uid);
    return decodedToken;
  } catch (error) {
    console.error("[Firebase Admin Verify Token] Error verifying ID token:", error);
    return null;
  }
}

// Log final state for clarity when this module is imported.
console.log(`[Firebase Admin Init Module Load] Final export state: adminDb is ${adminDb ? `CONFIGURED (App: ${adminAppInstance.name || 'N/A'})` : 'NULL'}`);
