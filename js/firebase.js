 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB42HSFoWRH_KfMrcWy3U7kdTjFPJbarJU",
  authDomain: "mes-envies-21527.firebaseapp.com",
  projectId: "mes-envies-21527",
  storageBucket: "mes-envies-21527.firebasestorage.app",
  messagingSenderId: "225833325776",
  appId: "1:225833325776:web:5f80a962f6579618c63ad5"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
