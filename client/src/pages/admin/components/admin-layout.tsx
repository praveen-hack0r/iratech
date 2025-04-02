import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  Settings,
  Upload,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useMobile } from "@/hooks/use-mobile";
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logoutMutation } = useAuth();
  const isMobile = useMobile();

  const navItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/admin",
      active: location === "/admin"
    },
    {
      title: "Courses",
      icon: <BookOpen className="h-5 w-5" />,
      href: "/admin/courses",
      active: location.startsWith("/admin/courses")
    },
    {
      title: "Users",
      icon: <Users className="h-5 w-5" />,
      href: "/admin/users",
      active: location.startsWith("/admin/users")
    },
    {
      title: "Resources",
      icon: <FileText className="h-5 w-5" />,
      href: "/admin/resources",
      active: location.startsWith("/admin/resources")
    },
    {
      title: "Content Upload",
      icon: <Upload className="h-5 w-5" />,
      href: "/admin/upload",
      active: location.startsWith("/admin/upload")
    },
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/admin/settings",
      active: location.startsWith("/admin/settings")
    }
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const SidebarContent = () => (
    <>
      <div className="px-3 py-2">
        <div className="flex items-center mb-6">
          <Link href="/">
            <a className="flex items-center">
              <svg className="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              {!collapsed && <span className="ml-2 text-xl font-bold">TechLearn</span>}
            </a>
          </Link>
          {!isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto" 
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>

        <div className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                item.active 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}>
                {item.icon}
                {!collapsed && <span className="ml-3">{item.title}</span>}
              </a>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-auto px-3 py-2">
        <Separator className="my-4" />
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="ml-2">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            size={collapsed ? "icon" : "sm"} 
            onClick={handleLogout}
            title="Logout"
          >
            {collapsed ? <LogOut className="h-4 w-4" /> : (
              <>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className={`bg-white border-r h-screen sticky top-0 flex flex-col ${
          collapsed ? 'w-[70px]' : 'w-64'
        } transition-all duration-300`}>
          <SidebarContent />
        </aside>
      )}

      {/* Mobile sidebar */}
      {isMobile && (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="fixed top-4 left-4 z-40">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 flex flex-col">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      )}

      {/* Main content */}
      <main className={`flex-1 overflow-auto p-8 ${isMobile ? 'pt-16' : ''}`}>
        {children}
      </main>
    </div>
  );
}
