import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  ClipboardList,
  AlertTriangle,
  MessageSquare,
  Moon,
  Sun
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  
  // Check if the user has admin privileges
  const isAdmin = user?.role === "admin";
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6 text-center">
          You don't have permission to access the admin area.
        </p>
        <div className="flex gap-4">
          <Button asChild variant="default">
            <Link href="/">Go to Homepage</Link>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => logoutMutation.mutate()}
          >
            Sign Out
          </Button>
        </div>
      </div>
    );
  }
  
  const navItems = [
    { 
      label: 'Dashboard', 
      icon: <LayoutDashboard className="h-5 w-5" />, 
      href: '/admin' 
    },
    { 
      label: 'Courses', 
      icon: <BookOpen className="h-5 w-5" />, 
      href: '/admin/courses' 
    },
    { 
      label: 'Pending Enrollments', 
      icon: <ClipboardList className="h-5 w-5" />, 
      href: '/admin/pending-enrollments',
      badge: true
    },
    { 
      label: 'Users', 
      icon: <Users className="h-5 w-5" />, 
      href: '/admin/users' 
    },
    // Special styling for Contact Messages
    { 
      label: 'Contact Messages', 
      icon: <MessageSquare className="h-5 w-5 text-blue-600" />, 
      href: '/admin/contact-messages',
      special: true 
    },
    { 
      label: 'Resources', 
      icon: <FileText className="h-5 w-5" />, 
      href: '/admin/resources' 
    },
    { 
      label: 'Settings', 
      icon: <Settings className="h-5 w-5" />, 
      href: '/admin/settings' 
    },
  ];
  
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-56 lg:w-64 border-r border-border bg-background hidden md:flex md:flex-col">
        <div className="p-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary p-1.5 rounded">
              <LayoutDashboard className="h-5 w-5 lg:h-6 lg:w-6" />
            </div>
            <h1 className="text-lg lg:text-xl font-bold">Admin Panel</h1>
          </div>
        </div>
        
        <Separator className="bg-border" />
        
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex items-center px-3 py-2 rounded-md mb-1 ${
                  location === item.href 
                    ? "bg-primary/10 text-primary font-medium" 
                    : item.special 
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 font-medium border border-blue-200 dark:border-blue-800" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-muted"
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="ml-3 truncate text-sm lg:text-base">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-primary/10 text-primary text-[10px] lg:text-xs rounded-full px-2 py-0.5">
                    New
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-border mt-auto">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">{user?.firstName} {user?.lastName}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[140px]">{user?.email}</span>
              </div>
            </div>
            
            {/* Theme toggle for desktop */}
            <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-2.5">
              <div className="flex items-center">
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 mr-2 text-yellow-500" />
                ) : (
                  <Moon className="h-4 w-4 mr-2 text-blue-600" />
                )}
                <span className="text-sm font-medium">
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-7 rounded-full"
              >
                Switch
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="w-full justify-center" 
              >
                <Link href="/profile" className="flex items-center">
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  Profile
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-center text-destructive hover:text-destructive" 
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-950 border-b z-10">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary p-1 rounded">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-bold">Admin Panel</h1>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="flex"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-blue-600" />
              )}
            </Button>
            <Button size="icon" variant="ghost" onClick={() => logoutMutation.mutate()}>
              <LogOut className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="sm">
              <Link href="/">Exit Admin</Link>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t z-10">
        <div className="flex overflow-x-auto p-1 gap-1 scrollbar-hide">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-3 relative flex-shrink-0 ${
                location === item.href
                  ? "text-primary font-medium"
                  : item.special
                    ? "text-blue-600 font-medium bg-blue-50 dark:bg-blue-950/30 rounded-md"
                    : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1 whitespace-nowrap">{item.label.match(/Contact/) ? "Messages" : item.label}</span>
              {item.badge && (
                <span className="absolute top-0 right-0 bg-primary w-2 h-2 rounded-full" />
              )}
            </Link>
          ))}
        </div>
      </div>
      
      {/* Main content */}
      <main className="flex-1 md:ml-0 pt-16 pb-16 md:pt-0 md:pb-0">
        {children}
      </main>
    </div>
  );
}