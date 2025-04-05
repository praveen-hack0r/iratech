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

// Firebase configuration - with special handling for Replit environments
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // Use the Firebase project's domain for authDomain, but allow it to be overridden
  authDomain: isReplitEnvironment()
    ? window.location.hostname // Use current hostname to help with cross-origin issues
    : `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
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
    // Attempt to get result from Firebase redirect
    console.log("Checking for Google sign-in redirect result...");
    const result = await getRedirectResult(auth);
    
    if (result) {
      // User just logged in via redirect
      console.log("Google sign-in redirect result received successfully");
      
      // Extract user information from the result
      const user = result.user;
      const { displayName, email, photoURL, uid } = user;
      
      if (!email) {
        throw new Error("No email received from Google authentication");
      }
      
      const nameParts = displayName?.split(' ') || [''];
      
      console.log("Google sign-in successful, sending user data to backend...");
      
      try {
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
        
        // Redirect to the auth-redirect page to handle post-login state
        window.location.href = '/auth-redirect';
        
        return await response.json();
      } catch (serverError) {
        console.error("Error communicating with our server:", serverError);
        throw new Error("Successfully authenticated with Google, but failed to connect to our server. Please try again.");
      }
    }
    
    console.log("No redirect result found, user has not authenticated with Google yet");
    return null; // No redirect result
  } catch (error) {
    console.error('Error handling redirect result', error);
    
    // Provide more user-friendly error messages for common errors
    const firebaseError = error as { code?: string, message?: string };
    
    if (firebaseError?.code) {
      switch(firebaseError.code) {
        case 'auth/account-exists-with-different-credential':
          console.error('An account already exists with the same email address but different sign-in credentials.');
          throw new Error('An account already exists with this email. Try signing in with a different method.');
          
        case 'auth/configuration-not-found':
          console.error('Firebase configuration error. The Replit domain may not be authorized in Firebase Console.');
          throw new Error(`Authentication configuration error. The domain "${currentDomain}" needs to be added to Firebase authorized domains.`);
          
        case 'auth/operation-not-allowed':
          console.error('Google authentication may not be enabled in the Firebase project.');
          throw new Error('Google sign-in is not enabled for this application. Please contact support.');
          
        case 'auth/web-storage-unsupported':
          console.error("Browser doesn't support web storage or it's disabled.");
          throw new Error("Your browser doesn't support web storage or it's disabled. Try using a different browser.");
          
        case 'auth/network-request-failed':
          console.error("Network error during Google authentication.");
          throw new Error("Network connection issue. Please check your internet connection and try again.");
          
        case 'auth/popup-blocked':
        case 'auth/popup-closed-by-user':
          console.error("Popup was blocked or closed.");
          throw new Error("Authentication popup was blocked or closed. Please enable popups for this site.");
          
        case 'auth/cancelled-popup-request':
          console.error("Authentication popup request was cancelled.");
          throw new Error("Authentication request was cancelled. Please try again.");
          
        case 'auth/internal-error':
          console.error("Firebase internal error occurred.");
          throw new Error("An internal error occurred. Please try again later or use email/password login.");
        
        default:
          console.error(`Unhandled Firebase error code: ${firebaseError.code}`);
      }
    }
    
    // Handle connection refused errors from Google servers (common in Replit)
    if (firebaseError?.message && 
        (firebaseError.message.includes('accounts.google.com') || 
         firebaseError.message.includes('refused to connect'))) {
      console.error("Google authentication server connection refused.");
      throw new Error("Could not connect to Google authentication servers. This is common in some environments. Please use email/password login instead.");
    }
    
    // Handle 403 Forbidden errors (also common in Replit environments)
    if (firebaseError?.message && 
        (firebaseError.message.includes('403') || 
         firebaseError.message.includes('forbidden') || 
         firebaseError.message.includes('Forbidden'))) {
      console.error("403 Forbidden error from Google Auth servers");
      throw new Error("Google authentication access was forbidden (403 error). This commonly happens when the authentication service is restricted in certain environments. Please use email/password login instead.");
    }
    
    throw error;
  }
}

// Sign in with Google using redirect
export async function signInWithGoogle() {
  try {
    console.log("Starting Google sign-in process via Firebase...");
    
    // Clear any previous configurations
    googleProvider = new GoogleAuthProvider();
    
    // Add these scopes to ensure we can get profile info
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    
    // Set custom parameters with a simpler approach
    const customParams: { [key: string]: string } = {
      prompt: 'select_account',
    };
    
    // If we're in Replit, add more forgiving parameters
    if (isReplitEnvironment()) {
      console.log("Detected Replit environment, adding special parameters");
      
      // Force OAuth to be more permissive with redirects
      customParams.include_granted_scopes = 'true';
      
      // Use a more direct OAuth flow
      customParams.response_type = 'token id_token';
      
      // Make sure cross-origin is handled properly
      customParams.origin = window.location.origin;
    }
    
    googleProvider.setCustomParameters(customParams);
    
    console.log("Initiating Google sign-in redirect...");
    console.log("Using authDomain:", firebaseConfig.authDomain);
    console.log("Current hostname:", currentDomain);
    
    try {
      // This will redirect the page to Google sign-in
      await signInWithRedirect(auth, googleProvider);
      
      // This code won't execute due to the redirect
      return null;
    } catch (redirectError: any) {
      console.error("Google sign-in redirect failed:", redirectError);
      
      // Handle specific error types with user-friendly messages
      let errorMessage = "Google sign-in failed. ";
      
      if (redirectError.code === 'auth/configuration-not-found') {
        errorMessage += `The domain "${currentDomain}" needs to be added to authorized domains in Firebase Console.`;
      } else if (redirectError.code === 'auth/operation-not-allowed') {
        errorMessage += "Google authentication may not be enabled in your Firebase project.";
      } else if (redirectError.message && redirectError.message.includes('403')) {
        errorMessage += "Access was forbidden (403 error). This commonly happens in some environments.";
      } else if (redirectError.message && redirectError.message.includes('refused to connect')) {
        errorMessage += "Could not connect to Google authentication servers. This may be due to network restrictions.";
      } else {
        errorMessage += redirectError.message || "Unknown error occurred";
      }
      
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Error in Google sign-in process:', error);
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