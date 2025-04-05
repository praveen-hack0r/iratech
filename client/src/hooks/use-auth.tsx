import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, LoginData, RegisterData, ResetPasswordData, VerifyEmailData } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle as firebaseSignInWithGoogle, signOutFromFirebase } from "@/lib/firebase";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  googleSignInMutation: UseMutationResult<any, Error, void>; // Changed return type to any since redirects don't return
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  resetPasswordMutation: UseMutationResult<void, Error, ResetPasswordData>;
  resendVerificationMutation: UseMutationResult<void, Error, void>;
  verifyEmailMutation: UseMutationResult<any, Error, VerifyEmailData>;
};

// Create context without exporting it directly
const AuthContext = createContext<AuthContextType | null>(null);

// Export a function component that provides the auth context
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/user");
        if (res.status === 401) return null;
        if (!res.ok) throw new Error("Failed to fetch user data");
        return await res.json();
      } catch (err) {
        if (err instanceof Error) {
          throw err;
        }
        throw new Error("Failed to fetch user data");
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      
      if (!res.ok) {
        try {
          const errorData = await res.json();
          throw new Error(errorData.message || "Invalid username or password");
        } catch (err) {
          throw new Error("Invalid username or password");
        }
      }
      
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.firstName || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const googleSignInMutation = useMutation({
    mutationFn: async () => {
      try {
        // Log to help debug Firebase configuration
        console.log("Starting Google sign-in process via Firebase...");
        
        // This will redirect to Google Sign-in page and won't return here
        // The result will be handled by checkRedirectResult() in firebase.ts
        await firebaseSignInWithGoogle();
        
        // This code won't execute because of the redirect
        return null as any;
      } catch (error) {
        console.error("Google sign-in error:", error);
        
        // Add more specific error information to help debugging
        let errorMessage = "";
        
        if (error instanceof Error) {
          const firebaseError = error as any;
          
          if (firebaseError.code) {
            // Map Firebase error codes to user-friendly messages
            switch (firebaseError.code) {
              case 'auth/configuration-not-found':
                errorMessage = `Firebase configuration error: The site domain is not authorized in Firebase Console.`;
                break;
              case 'auth/operation-not-allowed':
                errorMessage = "Google authentication is not enabled in your Firebase project.";
                break;
              case 'auth/popup-blocked':
                errorMessage = "Popup was blocked by your browser. Please allow popups for this site.";
                break;
              case 'auth/popup-closed-by-user':
                errorMessage = "Authentication was cancelled. Please try again.";
                break;
              default:
                errorMessage = firebaseError.message || "An error occurred during Google authentication.";
            }
          } else {
            errorMessage = error.message;
          }
        } else {
          errorMessage = "Unknown error during Google sign-in.";
        }
        
        throw new Error(errorMessage);
      }
    },
    onError: (error: Error) => {
      // The error display is now handled in the component to allow for custom formatting
      console.error("Google sign-in mutation error:", error);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome to IraTech, ${user.firstName || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        // Sign out from both our server and Firebase
        const response = await apiRequest("POST", "/api/logout");
        
        // Also attempt to sign out from Firebase, but don't block on failure
        try {
          await signOutFromFirebase();
          console.log("Successfully signed out from Firebase");
        } catch (firebaseError) {
          console.warn("Firebase sign out failed, but continuing:", firebaseError);
          // We don't throw here because we still want to succeed if server logout worked
        }
        
        if (response.ok) {
          return;
        }
        throw new Error("Logout failed");
      } catch (error) {
        console.error("Logout error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordData) => {
      await apiRequest("POST", "/api/forgot-password", data);
    },
    onSuccess: () => {
      toast({
        title: "Password reset initiated",
        description: "If your email is registered, you will receive a reset link",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/resend-verification");
    },
    onSuccess: () => {
      toast({
        title: "Verification email sent",
        description: "Please check your email for the verification link",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send verification email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async (data: VerifyEmailData) => {
      try {
        const res = await apiRequest("POST", "/api/verify-email-manual", data);
        
        // Handle non-200 responses
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Verification failed. Please try again.");
        }
        
        return await res.json();
      } catch (error: any) {
        console.error("Verification error:", error);
        throw error;
      }
    },
    onSuccess: (response: any) => {
      // Handle different success statuses
      if (response.status === "already_verified") {
        toast({
          title: "Already Verified",
          description: "Your email is already verified. You can now log in to your account.",
        });
      } else {
        toast({
          title: "Email Verified!",
          description: "Your email has been verified and your account is now fully activated!",
        });
      }
      
      if (response.user) {
        queryClient.setQueryData(["/api/user"], response.user);
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }
    },
    onError: (error: Error) => {
      // Provide specific guidance based on the error message
      let title = "Verification Failed";
      let description = error.message || "Invalid verification token";
      
      if (error.message?.includes("No account found")) {
        title = "Email Not Found";
        description = "No account found with this email address. Please check the email you entered.";
      } else if (error.message?.includes("token is invalid")) {
        title = "Invalid Token";
        description = "The verification token is invalid. Please make sure you've copied it correctly from the email.";
      } else if (error.message?.includes("expired")) {
        title = "Token Expired";
        description = "Your verification token has expired. Please request a new verification email.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        googleSignInMutation,
        logoutMutation,
        registerMutation,
        resetPasswordMutation,
        resendVerificationMutation,
        verifyEmailMutation
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}