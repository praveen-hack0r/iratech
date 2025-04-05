import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { checkRedirectResult } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

/**
 * AuthRedirect page - Handles Firebase authentication redirects
 * 
 * This page is shown after the user is redirected back from Google's sign-in page
 * It processes the authentication result and redirects to the homepage
 */
export default function AuthRedirect() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // If user is already logged in, redirect to home
    if (user) {
      setLocation("/");
      return;
    }

    // Handle the Firebase redirect
    async function processRedirect() {
      try {
        console.log("Processing Google authentication redirect...");
        
        // Process the redirect result from Firebase
        const result = await checkRedirectResult();
        
        if (result) {
          console.log("Google authentication successful");
          setLocation("/");
        } else {
          setError("No authentication data found. Please try signing in again.");
        }
      } catch (err: any) {
        console.error("Error handling redirect:", err);
        setError(err.message || "Authentication failed");
      } finally {
        setIsLoading(false);
      }
    }

    processRedirect();
  }, [user, setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {isLoading ? "Processing Authentication" : error ? "Authentication Error" : "Success!"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center space-y-4 p-6">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-center text-sm text-muted-foreground">
                Please wait while we process your sign-in...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center space-y-4">
              <p className="text-center text-sm text-destructive">{error}</p>
              <Button onClick={() => setLocation("/auth")}>Return to Login</Button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Authentication successful! Redirecting you to the homepage...
              </p>
              <Button onClick={() => setLocation("/")}>Go to Homepage</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}