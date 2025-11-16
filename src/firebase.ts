import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const projectId = import.meta.env.VITE_PROJECT_ID;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: projectId,
  // NOTE: 環境変数 VITE_STORAGE_BUCKET が意図せず設定されている可能性があるため、
  // projectId から動的に生成したデフォルト値を強制的に使用する。
  storageBucket: `${import.meta.env.VITE_PROJECT_ID}.appspot.com`,
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


  // Initialize Firebase
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Initialize App Check
  if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.DEV;
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
  }

} catch (error) {
  console.error('[Firebase] Critical error during Firebase initialization:', error);
  // Throw the error to prevent the app from running in a broken state
  throw error;
}


export { app };
export const auth = getAuth(app);
export const db = getFirestore(app);

// NOTE: SDKの内部的な挙動によりstorageBucketが無視されるケースに対応するため、
// バケットのURLを第2引数で明示的に指定して強制する。
const storageBucketUrl = `gs://${firebaseConfig.projectId}.appspot.com`;
export const storage = getStorage(app, storageBucketUrl);
export const functions = getFunctions(app, 'asia-northeast1');


// const analytics = getAnalytics(app);
