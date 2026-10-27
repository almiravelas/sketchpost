// Paste your Firebase web config here.
// Firebase console → Project settings (gear icon) → General → "Your apps" → Web app → SDK setup and configuration → Config.
//
// These values are safe to publish: they only identify your project.
// Who can read and write is decided by firestore.rules, not by hiding this file.
export const firebaseConfig = {
  apiKey: "AIzaSyCN8b_jlS3XHl99yFKMtsqJ_2XPd6JmPlU",
  authDomain: "sketchpost-87a75.firebaseapp.com",
  projectId: "sketchpost-87a75",
  storageBucket: "sketchpost-87a75.firebasestorage.app",
  messagingSenderId: "866877941744",
  appId: "1:866877941744:web:652ead19eaa460eba39f35"
};

// The platform's own name, shown on the landing page and in small print on every tracking page.
export const PLATFORM = { name: 'SketchPost', by: 'sigbinnie' };

// Until the config above is filled in, pages show demo content.
export const isConfigured = !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('PASTE');
