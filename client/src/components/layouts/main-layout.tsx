import { ReactNode, useState } from "react";
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
  Menu,
  Moon,
  Shield,
  Sun,
  User,
  Wrench,
  Phone,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  FaFacebookSquare, 
  FaInstagram, 
  FaTwitterSquare, 
  FaLinkedin, 
  FaYoutubeSquare 
} from "react-icons/fa";
import IraTechLogo from "@/assets/iratech-logo.png";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <Link href="/">
              <span className="flex items-center cursor-pointer">
                <img src={IraTechLogo} alt="IraTech Logo" className="h-12 mr-2" />
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-indigo-600 text-transparent bg-clip-text">
                  IraTech
                </span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-2 lg:space-x-4">
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
              <NavLink
                href="/services"
                active={location === "/services"}
                icon={<Wrench size={16} />}
              >
                Services
              </NavLink>
              <NavLink
                href="/contact"
                active={location === "/contact"}
                icon={<Phone size={16} />}
              >
                Contact Us
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

          <div className="flex items-center space-x-2 sm:space-x-4">
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

            {/* User Menu or Login Button */}
            {user ? (
              <UserMenu user={user} onLogout={() => logoutMutation.mutate()} />
            ) : (
              <Link href="/auth">
                <Button variant="default" className="hidden sm:flex">Login</Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] sm:w-[350px] pt-12">
                <div className="flex flex-col space-y-6">
                  {/* Title in mobile menu */}
                  <div className="flex items-center mb-2">
                    <img src={IraTechLogo} alt="IraTech Logo" className="h-10 mr-2" />
                    <span className="text-xl font-bold bg-gradient-to-r from-primary to-indigo-600 text-transparent bg-clip-text">
                      IraTech
                    </span>
                  </div>
                  <nav className="flex flex-col space-y-4">
                    <MobileNavLink href="/" active={location === "/"} icon={<Home size={16} />}>
                      Home
                    </MobileNavLink>
                    <MobileNavLink 
                      href="/courses" 
                      active={location === "/courses"} 
                      icon={<Book size={16} />}
                    >
                      Courses
                    </MobileNavLink>
                    <MobileNavLink 
                      href="/services" 
                      active={location === "/services"} 
                      icon={<Wrench size={16} />}
                    >
                      Services
                    </MobileNavLink>
                    <MobileNavLink 
                      href="/contact" 
                      active={location === "/contact"} 
                      icon={<Phone size={16} />}
                    >
                      Contact Us
                    </MobileNavLink>
                    {user && (
                      <MobileNavLink 
                        href="/my-learning" 
                        active={location === "/my-learning"} 
                        icon={<Clipboard size={16} />}
                      >
                        My Learning
                      </MobileNavLink>
                    )}
                    {user && user.role === "admin" && (
                      <MobileNavLink 
                        href="/admin" 
                        active={location.startsWith("/admin")} 
                        icon={<Shield size={16} />}
                      >
                        Admin
                      </MobileNavLink>
                    )}
                  </nav>
                  
                  <div className="flex flex-col space-y-2 border-t pt-4 mt-2">
                    <p className="text-sm font-medium text-muted-foreground">Appearance</p>
                    <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
                      <div className="flex items-center">
                        {theme === "dark" ? (
                          <Sun className="h-5 w-5 mr-2 text-yellow-500" />
                        ) : (
                          <Moon className="h-5 w-5 mr-2 text-blue-600" />
                        )}
                        <span className="font-medium">
                          {theme === "dark" ? "Light Mode" : "Dark Mode"}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="h-8 rounded-full"
                      >
                        Switch
                      </Button>
                    </div>
                  </div>
                  
                  {!user && (
                    <Link href="/auth">
                      <Button variant="default" className="w-full">Login</Button>
                    </Link>
                  )}
                  
                  {user && (
                    <div className="flex flex-col space-y-4 border-t pt-4">
                      <div className="flex items-center">
                        <User className="h-5 w-5 mr-2 text-primary" />
                        <span className="font-medium">
                          {user.firstName
                            ? `${user.firstName} ${user.lastName || ""}`
                            : user.username}
                        </span>
                        {user.role === "admin" && (
                          <Badge className="ml-2" variant="secondary">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <Link href="/profile">
                        <Button variant="outline" className="w-full">Profile</Button>
                      </Link>
                      {user.role === "admin" && (
                        <Link href="/admin">
                          <Button variant="outline" className="w-full">Admin Dashboard</Button>
                        </Link>
                      )}
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={() => logoutMutation.mutate()}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">{children}</main>
      
      <footer className="border-t py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col items-center md:items-start space-y-2">
              <div className="flex items-center">
                <img src={IraTechLogo} alt="IraTech Logo" className="h-10 mr-2" />
                <span className="text-lg font-bold bg-gradient-to-r from-primary to-indigo-600 text-transparent bg-clip-text">
                  IraTech
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} IraTech. All rights reserved.
              </div>
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
              <div className="flex flex-wrap justify-center md:justify-end gap-4 sm:gap-6">
                <Link href="/terms">
                  <span className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary cursor-pointer text-sm">
                    Terms
                  </span>
                </Link>
                <Link href="/privacy-policy">
                  <span className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary cursor-pointer text-sm">
                    Privacy
                  </span>
                </Link>
                <Link href="/services">
                  <span className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary cursor-pointer text-sm">
                    Services
                  </span>
                </Link>
                <Link href="/contact">
                  <span className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary cursor-pointer text-sm">
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

function MobileNavLink({ href, active, icon, children }: NavLinkProps) {
  return (
    <SheetClose asChild>
      <Link href={href}>
        <span
          className={`flex items-center px-4 py-3 rounded-md transition-colors cursor-pointer ${
            active
              ? "text-primary font-medium bg-primary/10"
              : "text-gray-700 dark:text-gray-300 hover:bg-muted"
          }`}
        >
          {icon && <span className="mr-3 text-primary">{icon}</span>}
          <span className="text-base">{children}</span>
        </span>
      </Link>
    </SheetClose>
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