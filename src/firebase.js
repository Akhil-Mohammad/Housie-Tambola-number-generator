// import { initializeApp, getApps } from "firebase/app";
// import { getDatabase } from "firebase/database";

// // Add these values to your project's .env file (see .env.example).
// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID,
// };

// const requiredConfig = [
//   "apiKey", "authDomain", "databaseURL", "projectId", "appId",
// ];
// const missingConfig = requiredConfig.filter((key) => !firebaseConfig[key]);

// if (missingConfig.length) {
//   console.warn(
//     `Firebase configuration is incomplete. Missing: ${missingConfig.join(", ")}. ` +
//     "Configure the VITE_FIREBASE_* variables in .env before using multiplayer."
//   );
// }

// const isFirebaseConfigured = missingConfig.length === 0;
// const app = isFirebaseConfigured
//   ? (getApps().length ? getApps()[0] : initializeApp(firebaseConfig))
//   : null;
// export const db = app ? getDatabase(app) : null;


import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,

  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,

  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,

  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,

  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,

  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,

  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);

export default app;