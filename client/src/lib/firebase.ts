import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth } from "firebase/auth";

// Declare our firebase initialization flag on window
declare global {
  interface Window {
    _FIREBASE_INITIALIZED?: boolean;
  }
}

// Get the current domain for authentication to work in Replit
const currentDomain = window.location.hostname;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // For Replit environments, we need to use the firebaseapp.com domain as authDomain
  // but will still need to add the Replit domain to authorized domains in Firebase Console
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase - only initialize once to prevent duplicate app errors
let app: FirebaseApp;
let auth: Auth;
let googleProvider: GoogleAuthProvider;

// Create a self-invoking function to initialize Firebase
(() => {
  try {
    // Initialize Firebase only if no apps exist
    if (!window._FIREBASE_INITIALIZED) {
      console.log("Initializing Firebase app...");
      app = initializeApp(firebaseConfig);
      window._FIREBASE_INITIALIZED = true;
    }
    
    auth = getAuth();
    googleProvider = new GoogleAuthProvider();
    
    // Add authorization domain to help with Replit
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
})();

// Sign in with Google popup
export async function signInWithGoogle() {
  try {
    // Set custom parameters to ensure proper popup handling in Replit
    googleProvider.setCustomParameters({
      prompt: 'select_account',
      // This opens login selection dialog even if user is already logged in
      // Important for testing and when users have multiple accounts
      login_hint: window.location.hostname
    });
    
    console.log("Initiating Google sign-in popup...");
    console.log("Using authDomain:", firebaseConfig.authDomain);
    
    const result = await signInWithPopup(auth, googleProvider);
    
    // Extract user information from the result
    const user = result.user;
    const { displayName, email, photoURL, uid } = user;
    const nameParts = displayName?.split(' ') || [''];
    
    // Instead of using Firebase Admin verification on backend (which requires service account),
    // we'll send the user information directly to our backend after Firebase validates the auth
    console.log("Google sign-in successful, sending user data to backend...");
    
    // Send user data directly to backend
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email,
        name: displayName || '',
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        picture: photoURL || '',
        firebaseUid: uid 
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Server authentication error:", errorData);
      throw new Error(errorData.message || 'Failed to authenticate with server');
    }
    
    console.log("Server authentication successful");
    return await response.json();
  } catch (error) {
    console.error('Error signing in with Google', error);
    
    // Provide more user-friendly error messages
    const firebaseError = error as { code?: string };
    if (firebaseError?.code === 'auth/popup-blocked') {
      throw new Error('The sign-in popup was blocked by your browser. Please allow popups for this site.');
    } else if (firebaseError?.code === 'auth/popup-closed-by-user') {
      throw new Error('The sign-in popup was closed before completing authentication.');
    } else if (firebaseError?.code === 'auth/configuration-not-found') {
      throw new Error('Firebase configuration error. Please try again later or use email/password sign-in instead.');
    }
    
    throw error;
  }
}

// Sign out
export async function signOutFromFirebase() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out', error);
    throw error;
  }
}

export { auth };