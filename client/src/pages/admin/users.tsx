import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { AdminLayout } from "./components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  MoreVertical,
  Mail,
  UserCog,
  KeyRound,
  BookOpen,
  ArrowUpDown,
} from "lucide-react";

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("username");
  const [sortOrder, setSortOrder] = useState("asc");

  // Fetch all users
  const {
    data: users,
    isLoading,
    error,
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Filter and sort users
  const filteredUsers = users
    ? users
        .filter((user) => {
          // Filter by search query
          const matchesSearch =
            searchQuery === "" ||
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.email &&
              user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (user.firstName &&
              user.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (user.lastName &&
              user.lastName.toLowerCase().includes(searchQuery.toLowerCase()));

          // Filter by role
          const matchesRole = roleFilter === "all" || user.role === roleFilter;

          return matchesSearch && matchesRole;
        })
        // Sort users
        .sort((a, b) => {
          let comparison = 0;
          switch (sortBy) {
            case "username":
              comparison = a.username.localeCompare(b.username);
              break;
            case "email":
              comparison = (a.email || "").localeCompare(b.email || "");
              break;
            case "name":
              const aName = `${a.firstName || ""} ${a.lastName || ""}`.trim();
              const bName = `${b.firstName || ""} ${b.lastName || ""}`.trim();
              comparison = aName.localeCompare(bName);
              break;
            case "role":
              comparison = a.role.localeCompare(b.role);
              break;
            default:
              comparison = a.username.localeCompare(b.username);
          }
          return sortOrder === "asc" ? comparison : -comparison;
        })
    : [];

  // Get user initials for avatar
  const getUserInitials = (firstName?: string, lastName?: string, username?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (username) {
      return username.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Get full name or username
  const getDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username;
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button variant="outline">
          <ArrowUpDown className="mr-2 h-4 w-4" />
          Export Users
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage user accounts, enrollments, and permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-2/3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Search users by name, email or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-1/3">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Administrators</SelectItem>
                  <SelectItem value="user">Regular Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">
              Failed to load users. Please try again.
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No users found. Try adjusting your search or filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Enrollments</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className={user.role === "admin" ? "bg-primary" : "bg-gray-200"}>
                              {getUserInitials(user.firstName, user.lastName, user.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{getDisplayName(user)}</p>
                            <p className="text-sm text-gray-500">@{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "outline"}>
                          {user.role === "admin" ? "Administrator" : "User"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">0 courses</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <UserCog className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <KeyRound className="h-4 w-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <BookOpen className="h-4 w-4 mr-2" />
                              View Enrollments
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
