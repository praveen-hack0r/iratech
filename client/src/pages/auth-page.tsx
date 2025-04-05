import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { loginSchema, registerSchema, resetPasswordSchema, verifyEmailSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { 
  Book, 
  Home, 
  LockKeyhole, 
  Mail, 
  Moon, 
  Sun, 
  User 
} from "lucide-react";
import { 
  FaFacebookSquare, 
  FaGoogle,
  FaInstagram, 
  FaTwitterSquare, 
  FaLinkedin, 
  FaYoutubeSquare 
} from "react-icons/fa";

// NavLink component
interface NavLinkProps {
  href: string;
  active: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function NavLink({ href, active, icon, children }: NavLinkProps) {
  return (
    <Link href={href}>
      <div
        className={`flex items-center px-3 py-2 rounded-md transition-colors ${
          active
            ? "text-primary font-medium"
            : "text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
        }`}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </div>
    </Link>
  );
}

export default function AuthPage() {
  const [authType, setAuthType] = useState<"login" | "register" | "reset" | "verify">("login");
  const [location, setLocation] = useLocation();
  const { 
    user, 
    loginMutation, 
    googleSignInMutation,
    registerMutation, 
    resetPasswordMutation, 
    verifyEmailMutation 
  } = useAuth();
  const { theme, setTheme } = useTheme();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);
  
  if (user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <div className="flex items-center">
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-indigo-600 text-transparent bg-clip-text">
                  IraTech
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex space-x-4">
              <NavLink href="/" active={location === "/"} icon={<Home size={16} />}>
                Home
              </NavLink>
              <NavLink
                href="/courses"
                active={location === "/courses"}
                icon={<Book size={16} />}
              >
                Courses
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-130px)]">
          {/* Auth Form Side */}
          <div className="flex-1 flex items-center justify-center p-6 bg-background">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                  Welcome to IraTech
                </CardTitle>
                <CardDescription className="text-center">
                  Your gateway to advanced tech education
                </CardDescription>
              </CardHeader>
              <CardContent>
                {authType === "reset" ? (
                  <div className="mt-4">
                    <h2 className="text-xl font-semibold mb-2">Reset Your Password</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                    <ResetPasswordForm />
                  </div>
                ) : authType === "verify" ? (
                  <div className="mt-4">
                    <h2 className="text-xl font-semibold mb-2">Verify Your Email</h2>
                    <div className="text-gray-600 dark:text-gray-400 mb-6 space-y-2">
                      <p>
                        Enter the verification token from the email we sent you to complete your registration.
                      </p>
                      <div className="rounded-md bg-amber-50 dark:bg-amber-950 p-3 text-sm border border-amber-200 dark:border-amber-800">
                        <p className="font-medium text-amber-800 dark:text-amber-400">Can't find the email?</p>
                        <ul className="list-disc ml-5 mt-1 text-amber-700 dark:text-amber-300">
                          <li>Check your spam or junk folder</li>
                          <li>Look for an email from "IraTech"</li>
                          <li>The token is a long string of letters and numbers</li>
                          <li>Copy the token exactly as shown in the email</li>
                        </ul>
                      </div>
                    </div>
                    <VerifyEmailForm />
                  </div>
                ) : (
                  <Tabs value={authType} onValueChange={(value) => setAuthType(value as any)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">Login</TabsTrigger>
                      <TabsTrigger value="register">Register</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login">
                      <LoginForm />
                    </TabsContent>
                    <TabsContent value="register">
                      <RegisterForm />
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-2 justify-center">
                {authType === "login" ? (
                  <>
                    <Button
                      variant="link"
                      onClick={() => setAuthType("reset")}
                      className="px-0"
                    >
                      Forgot password?
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => setAuthType("verify")}
                      className="px-0"
                    >
                      Need to verify your email?
                    </Button>
                  </>
                ) : authType === "reset" || authType === "verify" ? (
                  <Button
                    variant="link"
                    onClick={() => setAuthType("login")}
                    className="px-0"
                  >
                    Back to login
                  </Button>
                ) : null}
              </CardFooter>
            </Card>
          </div>

          {/* Hero Section Side */}
          <div className="flex-1 bg-gradient-to-br from-primary/50 to-primary p-6 hidden lg:flex flex-col justify-center">
            <div className="max-w-xl mx-auto">
              <h1 className="text-4xl font-bold text-white mb-6">
                Elevate Your Technical Skills
              </h1>
              <p className="text-white/90 text-lg mb-8">
                Access premium courses in ethical hacking, programming, Excel with AI, and digital marketing. 
                Learn from industry experts and advance your career with practical, hands-on training.
              </p>
              <div className="space-y-4">
                <FeatureItem text="Comprehensive courses in cutting-edge technologies" />
                <FeatureItem text="Expert instructors with industry experience" />
                <FeatureItem text="Hands-on projects and practical exercises" />
                <FeatureItem text="Flexible learning paths to fit your goals" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} IraTech. All rights reserved.
            </div>
            <div className="flex flex-col items-center md:items-end space-y-4 mt-4 md:mt-0">
              {/* Social Media Icons */}
              <div className="flex space-x-4">
                <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary" aria-label="Facebook">
                  <FaFacebookSquare size={24} />
                </a>
                <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary" aria-label="Instagram">
                  <FaInstagram size={24} />
                </a>
                <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary" aria-label="Twitter">
                  <FaTwitterSquare size={24} />
                </a>
                <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary" aria-label="LinkedIn">
                  <FaLinkedin size={24} />
                </a>
                <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary" aria-label="YouTube">
                  <FaYoutubeSquare size={24} />
                </a>
              </div>
              {/* Footer Links */}
              <div className="flex space-x-6">
                <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                  Terms
                </a>
                <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                  Privacy
                </a>
                <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center">
      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center mr-3">
        <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
      </div>
      <p className="text-white/80">{text}</p>
    </div>
  );
}

function LoginForm() {
  const { loginMutation, googleSignInMutation } = useAuth();
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(values);
  }
  
  // Function to handle Google Sign-in attempt
  function handleGoogleSignIn() {
    try {
      // Show a toast notification to inform the user about the redirect
      toast({
        title: "Redirecting to Google",
        description: "You'll be redirected to Google for authentication",
      });
      
      // Trigger the Google sign-in process via mutation
      googleSignInMutation.mutate(undefined, {
        onError: (error) => {
          // Error handling for Firebase errors
          console.error("Failed to initiate Google sign-in:", error);
          
          let title = "Google Sign-in Failed";
          let description = "";
          
          // Extract message from the error
          if (error instanceof Error) {
            // Check for Firebase specific error messages
            if (error.message.includes("domain")) {
              description = "This website domain is not authorized for Firebase authentication. Please contact support.";
            } else if (error.message.includes("not enabled")) {
              description = "Google authentication is not enabled for this application.";
            } else if (error.message.includes("operation")) {
              description = "This authentication operation is not supported in this environment.";
            } else {
              description = error.message;
            }
          } else {
            description = "An unexpected error occurred";
          }
          
          // Show error toast
          toast({
            title,
            description,
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      // This catch handles synchronous errors (unlikely with the mutation approach)
      console.error("Synchronous error in Google sign-in:", error);
      toast({
        title: "Google Sign-in Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    className="pl-9"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Signing in..." : "Sign In"}
        </Button>
        
        <div className="relative flex items-center justify-center mt-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted" />
          </div>
          <div className="relative px-3 text-xs uppercase bg-background text-muted-foreground">
            Or continue with
          </div>
        </div>
        
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleGoogleSignIn}
          disabled={googleSignInMutation.isPending}
        >
          <FaGoogle className="h-4 w-4 text-red-500" />
          {googleSignInMutation.isPending ? "Connecting..." : "Sign in with Google"}
        </Button>
      </form>
    </Form>
  );
}

function RegisterForm() {
  const { registerMutation } = useAuth();
  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: "user",
    },
  });

  function onSubmit(values: z.infer<typeof registerSchema>) {
    registerMutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Smith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="johnsmith"
                    className="pl-9"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="john.smith@example.com"
                    className="pl-9"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? "Creating account..." : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}

function ResetPasswordForm() {
  const { resetPasswordMutation } = useAuth();
  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    resetPasswordMutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="john.smith@example.com"
                    className="pl-9"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={resetPasswordMutation.isPending}
        >
          {resetPasswordMutation.isPending
            ? "Sending reset link..."
            : "Send Reset Link"}
        </Button>
      </form>
    </Form>
  );
}

function VerifyEmailForm() {
  const { verifyEmailMutation } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const form = useForm({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      token: "",
      email: "",
    },
  });

  function onSubmit(values: z.infer<typeof verifyEmailSchema>) {
    setVerificationStatus('idle');
    verifyEmailMutation.mutate(values, {
      onSuccess: () => {
        setVerificationStatus('success');
      },
      onError: () => {
        setVerificationStatus('error');
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        {verificationStatus === 'success' && (
          <div className="rounded-md bg-green-50 dark:bg-green-900 p-4 mb-4 border border-green-200 dark:border-green-800">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                  Email Verification Successful
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                  <p>Your email has been verified successfully. You can now login to your account.</p>
                </div>
                <div className="mt-4">
                  <Link href="/auth?tab=login">
                    <Button type="button" size="sm" variant="outline" className="flex items-center space-x-1 text-xs">
                      <span>Go to Login</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    className="pl-9"
                    {...field}
                    disabled={verifyEmailMutation.isPending || verificationStatus === 'success'}
                  />
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                Enter the same email address you used during registration.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Token</FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute left-3 top-3 h-4 w-4 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <Input
                    className="pl-9 font-mono text-sm"
                    placeholder="Enter the token from your email"
                    {...field}
                    disabled={verifyEmailMutation.isPending || verificationStatus === 'success'}
                  />
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                Paste the complete token exactly as shown in the verification email.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {verificationStatus === 'error' && (
          <div className="text-sm text-red-600 dark:text-red-400 mt-2 rounded-md bg-red-50 dark:bg-red-900/30 p-3 border border-red-200 dark:border-red-800/30">
            <p className="font-medium mb-1">Verification failed</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Check that you've entered the correct email address</li>
              <li>Make sure you've copied the entire token correctly</li>
              <li>Try to copy and paste the token instead of typing it</li>
              <li>The token might have expired - try registering again</li>
            </ul>
          </div>
        )}
        
        <Button
          type="submit"
          className="w-full"
          disabled={verifyEmailMutation.isPending || verificationStatus === 'success'}
        >
          {verifyEmailMutation.isPending
            ? "Verifying..."
            : verificationStatus === 'success' 
              ? "Email Verified!"
              : "Verify Email"}
        </Button>
      </form>
    </Form>
  );
}