// Firebase app + Firestore, loaded straight from Google's CDN (no build step needed).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, addDoc, collection, query, where, orderBy,
  onSnapshot, getDocs, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { doc, getDoc, setDoc, deleteDoc, addDoc, collection, query, where, orderBy, onSnapshot, getDocs, serverTimestamp };
