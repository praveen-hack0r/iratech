import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, Auth } from "firebase/auth";

// Declare our firebase initialization flag on window
declare global {
  interface Window {
    _FIREBASE_INITIALIZED?: boolean;
  }
}

// Helper function to check if we're in a Replit environment
const isReplitEnvironment = () => {
  return window.location.hostname.includes('.repl.co') || 
         window.location.hostname.includes('replit.dev') ||
         window.location.hostname === 'localhost';
};

// Get the current domain
const currentDomain = window.location.hostname;
console.log("Current domain for Firebase:", currentDomain);

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // Use the Firebase project's domain for authDomain
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

    // Check for redirect result on page load
    checkRedirectResult();
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
})();

// Check for redirect result when the page loads
export async function checkRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // User just logged in via redirect
      console.log("Google sign-in redirect result received");
      
      // Extract user information from the result
      const user = result.user;
      const { displayName, email, photoURL, uid } = user;
      const nameParts = displayName?.split(' ') || [''];
      
      console.log("Google sign-in successful, sending user data to backend...");
      
      // Send user data to our backend
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
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
      
      // Refresh the page after successful login to update UI
      window.location.href = '/';
      
      return await response.json();
    }
    return null; // No redirect result
  } catch (error) {
    console.error('Error handling redirect result', error);
    
    // Provide more user-friendly error messages for common errors
    const firebaseError = error as { code?: string };
    if (firebaseError?.code === 'auth/account-exists-with-different-credential') {
      console.error('An account already exists with the same email address but different sign-in credentials.');
    } else if (firebaseError?.code === 'auth/configuration-not-found') {
      console.error('Firebase configuration error. The Replit domain may not be authorized in Firebase Console.');
    }
    
    throw error;
  }
}

// Sign in with Google using redirect (more reliable in Replit than popup)
export async function signInWithGoogle() {
  try {
    // Set custom parameters based on environment
    const customParams: { [key: string]: string } = {
      prompt: 'select_account'
    };
    
    // If we're in Replit, add some extra parameters that might help
    if (isReplitEnvironment()) {
      console.log("Detected Replit environment, adding special parameters");
      customParams.login_hint = currentDomain;
      // Tell Firebase this is a Replit environment
      customParams.app_domain = currentDomain;
    }
    
    googleProvider.setCustomParameters(customParams);
    
    console.log("Initiating Google sign-in redirect...");
    console.log("Using authDomain:", firebaseConfig.authDomain);
    console.log("Current hostname:", currentDomain);
    
    // This will redirect the page to Google sign-in
    await signInWithRedirect(auth, googleProvider);
    
    // The function won't return here because of the redirect
    // The result will be handled by checkRedirectResult when the page loads again
  } catch (error) {
    console.error('Error starting Google sign-in', error);
    
    // Provide more user-friendly error messages
    const firebaseError = error as { code?: string };
    if (firebaseError?.code === 'auth/configuration-not-found') {
      throw new Error('Firebase configuration error. Make sure the domain "' + currentDomain + '" is added to the authorized domains in Firebase Console.');
    } else if (firebaseError?.code === 'auth/operation-not-supported-in-this-environment') {
      throw new Error('This authentication operation is not supported in this environment. Try using a different browser or device.');
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