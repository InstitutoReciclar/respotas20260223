import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA4l_FQV_5dIZNBqcE8jc71y7Vq7KFx2qM",
  authDomain: "compliance-reciclar.firebaseapp.com",
  projectId: "compliance-reciclar",
  storageBucket: "compliance-reciclar.firebasestorage.app",
  messagingSenderId: "816163862673",
  appId: "1:816163862673:web:fb9851bd673b566fe3e730"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
