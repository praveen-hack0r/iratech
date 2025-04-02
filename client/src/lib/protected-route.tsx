import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, useLocation } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  allowedRoles?: string[];
}

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles = [],
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Return a route component that renders different content based on auth state
  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        // User is not authenticated
        if (!user) {
          // Redirect to auth page
          setLocation("/auth");
          return null;
        }

        // Check for role-based access
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen">
              <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You don't have permission to access this page.
              </p>
              <button
                onClick={() => setLocation("/")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Go to Home
              </button>
            </div>
          );
        }

        // User is authenticated and has required role if specified
        return <Component />;
      }}
    </Route>
  );
}