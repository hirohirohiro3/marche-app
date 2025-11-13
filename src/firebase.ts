import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

console.log('[Firebase] Starting initialization...');

// Log all VITE env vars for debugging purposes in CI
for (const key in import.meta.env) {
  if (key.startsWith('VITE_')) {
    console.log(`[Firebase] Env Var ${key}=${import.meta.env[key]}`);
  }
}

const projectId = import.meta.env.VITE_PROJECT_ID;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: projectId,
  // Always use the default storage bucket derived from the project ID.
  storageBucket: `${projectId}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
};

let app: FirebaseApp;

try {
  // Validate required environment variables
  const requiredEnv: (keyof typeof firebaseConfig)[] = [
    'apiKey',
    'authDomain',
    'projectId',
    // 'storageBucket' is now derived from projectId
    'messagingSenderId',
    'appId',
  ];

  const missingVars = requiredEnv.filter(key => !firebaseConfig[key]);
  if (missingVars.length > 0) {
    throw new Error(`Firebase configuration error: Missing environment variables for ${missingVars.join(', ')}`);
  }
  console.log('[Firebase] All required environment variables are present.');


  // Initialize Firebase
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('[Firebase] Firebase app initialized successfully.');
  } else {
    app = getApps()[0];
    console.log('[Firebase] Firebase app already initialized.');
  }

  // Initialize App Check
  if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
    console.log('[Firebase] VITE_RECAPTCHA_SITE_KEY found, initializing App Check.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.DEV;
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
    console.log('[Firebase] App Check initialized.');
  } else {
    console.warn('[Firebase] VITE_RECAPTCHA_SITE_KEY is not set. Skipping App Check initialization.');
  }

} catch (error) {
  console.error('[Firebase] Critical error during Firebase initialization:', error);
  // Throw the error to prevent the app from running in a broken state
  throw error;
}


export { app };
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);


// const analytics = getAnalytics(app);
