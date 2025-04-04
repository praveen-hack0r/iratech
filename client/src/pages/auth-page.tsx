import { useState } from "react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { loginSchema, registerSchema, resetPasswordSchema } from "@shared/schema";
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
      <a
        className={`flex items-center px-3 py-2 rounded-md transition-colors ${
          active
            ? "text-primary font-medium"
            : "text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
        }`}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </a>
    </Link>
  );
}

export default function AuthPage() {
  const [authType, setAuthType] = useState<"login" | "register" | "reset">("login");
  const [location, setLocation] = useLocation();
  const { user, loginMutation, registerMutation, resetPasswordMutation } = useAuth();
  const { theme, setTheme } = useTheme();

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <a className="flex items-center">
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-indigo-600 text-transparent bg-clip-text">
                  IraTech
                </span>
              </a>
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
              <CardFooter className="flex justify-center">
                {authType !== "reset" ? (
                  <Button
                    variant="link"
                    onClick={() => setAuthType("reset")}
                    className="px-0"
                  >
                    Forgot password?
                  </Button>
                ) : (
                  <Button
                    variant="link"
                    onClick={() => setAuthType("login")}
                    className="px-0"
                  >
                    Back to login
                  </Button>
                )}
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
  const { loginMutation } = useAuth();
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