import { initializeApp } from "firebase/app";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAWxhTlb4ixSu9Ww4RfJMhB4gZeGmbxDno",
  authDomain: "ai-carbon-tracker-488821.firebaseapp.com",
  projectId: "ai-carbon-tracker-488821",
  storageBucket: "ai-carbon-tracker-488821.firebasestorage.app",
  messagingSenderId: "316882873742",
  appId: "1:316882873742:web:2019ea7307657d23cc08df",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence).catch(() => {});

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  serverTimestamp,
};

export type { User };
