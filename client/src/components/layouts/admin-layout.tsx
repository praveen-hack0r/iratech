import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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
  MessageSquare
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logoutMutation } = useAuth();
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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white hidden md:flex md:flex-col">
        <div className="p-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary p-1 rounded">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
        </div>
        
        <Separator />
        
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
                      ? "text-blue-600 bg-blue-50 hover:bg-blue-100 font-medium border border-blue-200" 
                      : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="ml-3 truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5">
                    New
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t mt-auto">
          <div className="flex items-center mb-4">
            <div className="flex flex-col">
              <span className="font-medium">{user?.firstName} {user?.lastName}</span>
              <span className="text-xs text-gray-500">{user?.email}</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>
      
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-10">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary p-1 rounded">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-bold">Admin Panel</h1>
          </div>
          
          <Button variant="outline" size="sm">
            <Link href="/">Exit Admin</Link>
          </Button>
        </div>
      </div>
      
      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-10">
        <div className="grid grid-cols-7 gap-1 p-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-1 relative text-sm ${
                location === item.href
                  ? "text-primary font-medium"
                  : item.special
                    ? "text-blue-600 font-medium bg-blue-50 rounded-md"
                    : "text-gray-700"
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1 text-center">{item.label.match(/Contact/) ? "Contact" : item.label.split(' ')[0]}</span>
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