// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA4l_FQV_5dIZNBqcE8jc71y7Vq7KFx2qM",
  authDomain: "compliance-reciclar.firebaseapp.com",
  projectId: "compliance-reciclar",
  storageBucket: "compliance-reciclar.firebasestorage.app",
  messagingSenderId: "816163862673",
  appId: "1:816163862673:web:fb9851bd673b566fe3e730"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta o database corretamente
export const db = getDatabase(app);