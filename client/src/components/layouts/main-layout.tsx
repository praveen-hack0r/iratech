import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import {
  Book,
  ChevronDown,
  Clipboard,
  Home,
  LogOut,
  Moon,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  FaFacebookSquare, 
  FaInstagram, 
  FaTwitterSquare, 
  FaLinkedin, 
  FaYoutubeSquare 
} from "react-icons/fa";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <span className="flex items-center cursor-pointer">
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-indigo-600 text-transparent bg-clip-text">
                  IraTech
                </span>
              </span>
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
              {user && (
                <NavLink
                  href="/my-learning"
                  active={location === "/my-learning"}
                  icon={<Clipboard size={16} />}
                >
                  My Learning
                </NavLink>
              )}
              {user && user.role === "admin" && (
                <NavLink
                  href="/admin"
                  active={location.startsWith("/admin")}
                  icon={<Shield size={16} />}
                >
                  Admin
                </NavLink>
              )}
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

            {user ? (
              <UserMenu user={user} onLogout={() => logoutMutation.mutate()} />
            ) : (
              <Link href="/auth">
                <Button variant="default">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="flex-grow">{children}</main>
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
                <Link href="/terms">
                  <span className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary cursor-pointer">
                    Terms
                  </span>
                </Link>
                <Link href="/privacy-policy">
                  <span className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary cursor-pointer">
                    Privacy
                  </span>
                </Link>
                <Link href="/contact">
                  <span className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary cursor-pointer">
                    Contact
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface NavLinkProps {
  href: string;
  active: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

function NavLink({ href, active, icon, children }: NavLinkProps) {
  return (
    <Link href={href}>
      <span
        className={`flex items-center px-3 py-2 rounded-md transition-colors cursor-pointer ${
          active
            ? "text-primary font-medium"
            : "text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
        }`}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </span>
    </Link>
  );
}

interface UserMenuProps {
  user: {
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    role: string;
  };
  onLogout: () => void;
}

function UserMenu({ user, onLogout }: UserMenuProps) {
  const displayName = user.firstName
    ? `${user.firstName} ${user.lastName || ""}`
    : user.username;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center">
          <User className="h-4 w-4 mr-2" />
          <span className="max-w-[100px] truncate">{displayName}</span>
          <ChevronDown className="h-4 w-4 ml-2" />
          {user.role === "admin" && (
            <Badge className="ml-2 py-0" variant="secondary">
              Admin
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <span className="w-full cursor-pointer">Profile</span>
          </Link>
        </DropdownMenuItem>
        {user.role === "admin" && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <span className="w-full cursor-pointer">Admin Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/pending-enrollments">
                <span className="w-full cursor-pointer">
                  Pending Enrollments
                  <Badge variant="secondary" className="ml-2">
                    New
                  </Badge>
                </span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="text-red-500 dark:text-red-400 cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}