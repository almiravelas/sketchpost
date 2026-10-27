// Paste your Firebase web config here.
// Firebase console → Project settings (gear icon) → General → "Your apps" → Web app → SDK setup and configuration → Config.
//
// These values are safe to publish: they only identify your project.
// Who can read and write is decided by firestore.rules, not by hiding this file.
export const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "000000000000",
  appId: "PASTE_YOUR_APP_ID"
};

// The platform's own name, shown on the landing page and in small print on every tracking page.
export const PLATFORM = { name: 'Parcel Post', by: 'sigbinnie' };

// Until the config above is filled in, pages show demo content.
export const isConfigured = !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('PASTE');
