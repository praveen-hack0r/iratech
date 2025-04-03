import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  LogOut,
  CheckSquare,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  alert?: boolean;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending enrollments count
  useEffect(() => {
    fetch("/api/admin/enrollments/pending")
      .then((res) => res.json())
      .then((data) => {
        setPendingCount(data.length || 0);
      })
      .catch(() => {
        setPendingCount(0);
      });
  }, []);

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Courses",
      href: "/admin/courses",
      icon: BookOpen,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "Resources",
      href: "/admin/resources",
      icon: FileText,
    },
    {
      title: "Pending Enrollments",
      href: "/admin/pending-enrollments",
      icon: CheckSquare,
      alert: pendingCount > 0,
    },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-6">You don't have permission to access this area.</p>
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const renderNavItem = (item: NavItem, isMobile = false) => (
    <Button
      key={item.href}
      variant={location === item.href ? "default" : "ghost"}
      className={cn(
        "w-full justify-start gap-3",
        location === item.href
          ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
          : ""
      )}
      asChild
      onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
    >
      <Link href={item.href}>
        <item.icon className="h-5 w-5" />
        <span className="flex-1 text-left">{item.title}</span>
        {item.alert && (
          <span className="h-2 w-2 rounded-full bg-destructive"></span>
        )}
      </Link>
    </Button>
  );

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Mobile Menu Toggle */}
      <div className="flex items-center lg:hidden absolute top-4 left-4 z-50">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <div className="flex flex-col h-full">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-8">
                  <Avatar>
                    <AvatarFallback>
                      {user.firstName && user.lastName
                        ? `${user.firstName[0]}${user.lastName[0]}`
                        : user.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => renderNavItem(item, true))}
                </nav>
              </div>
              <div className="mt-auto p-4">
                <Separator className="mb-4" />
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  <span>Log Out</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 flex-col border-r bg-card">
        <div className="flex flex-col h-full">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-8">
              <Avatar>
                <AvatarFallback>
                  {user.firstName && user.lastName
                    ? `${user.firstName[0]}${user.lastName[0]}`
                    : user.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.username}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => renderNavItem(item))}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Separator className="mb-4" />
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span>Log Out</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}