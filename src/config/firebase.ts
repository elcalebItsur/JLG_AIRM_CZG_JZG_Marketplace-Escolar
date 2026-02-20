import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDy2MM71NejRmX59FbeLjdUCKjIkiws09c",
    authDomain: "marketplace-escolar.firebaseapp.com",
    projectId: "marketplace-escolar",
    storageBucket: "marketplace-escolar.firebasestorage.app",
    messagingSenderId: "348495555820",
    appId: "1:348495555820:web:6338d218abc5999e0209c9",
    measurementId: "G-JLZ43F16SL"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
