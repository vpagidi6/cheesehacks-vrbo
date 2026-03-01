import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

// Keep user logged in when popup is closed and reopened
setPersistence(auth, browserLocalPersistence).catch(() => {});
