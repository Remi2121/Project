// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDD04Gtt2FAnv8GXXQ8SwPijZSaDJKJ44w",
  authDomain: "moodify-90d4d.firebaseapp.com",
  projectId: "moodify-90d4d",
  storageBucket: "moodify-90d4d.firebasestorage.app",
  messagingSenderId: "1020654886415",
  appId: "1:1020654886415:web:a3998c4bb6a3a7477acd7a",
  measurementId: "G-L9Q5KJ6M3G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Exports
export { auth, db, storage };

