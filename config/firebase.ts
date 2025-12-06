import { initializeApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace the following with your app's Firebase configuration
// Get these from the Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
    apiKey: "AIzaSyAyLkTQ6O93bV6YNhfMAAGgPHTQaT_borw",

    authDomain: "crm-sales-app-5ff2a.firebaseapp.com",

    projectId: "crm-sales-app-5ff2a",

    storageBucket: "crm-sales-app-5ff2a.firebasestorage.app",

    messagingSenderId: "38833078142",

    appId: "1:38833078142:web:3e8eb2ae5d92f02665bd2f",

    measurementId: "G-SXS3F9SEYV"

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);
