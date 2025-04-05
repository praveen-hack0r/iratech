import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Enrollment } from "@shared/schema";

// Enhanced enrollment interface with course details
interface EnhancedEnrollment extends Enrollment {
  courseTitle: string;
  courseSlug: string;
  coursePrice: number;
  // Note: TypeScript declaration for enrollmentDate is already included in the Enrollment type
  // But we're adding a comment here to make it clear that this field is expected in the API response
}
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Loader2,
  Save,
  X,
} from "lucide-react";

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("username");
  const [sortOrder, setSortOrder] = useState("asc");
  
  // User edit dialog state
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    role: "",
    phoneNumber: ""
  });
  
  // Password reset dialog state
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  
  // Enrollments dialog state
  const [isEnrollmentsOpen, setIsEnrollmentsOpen] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<number | null>(null);
  
  const { toast } = useToast();

  // Fetch all users
  const {
    data: users,
    isLoading,
    error,
    refetch: refetchUsers
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });
  
  // Fetch enrollment counts for users
  const [userEnrollmentCounts, setUserEnrollmentCounts] = useState<Record<number, number>>({});
  
  // Fetch enrollment counts when users are loaded
  useEffect(() => {
    if (users && users.length > 0) {
      // Fetch enrollment counts for each user
      const fetchEnrollmentCounts = async () => {
        const counts: Record<number, number> = {};
        
        try {
          // Use Promise.all to fetch counts in parallel
          await Promise.all(
            users.map(async (user) => {
              try {
                const response = await apiRequest("GET", `/api/admin/users/${user.id}/enrollments`);
                const enrollments = await response.json();
                counts[user.id] = enrollments.length;
              } catch (err) {
                console.error(`Error fetching enrollments for user ${user.id}:`, err);
                counts[user.id] = 0;
              }
            })
          );
          
          setUserEnrollmentCounts(counts);
        } catch (error) {
          console.error("Error fetching enrollment counts:", error);
        }
      };
      
      fetchEnrollmentCounts();
    }
  }, [users]);
  
  // Fetch user enrollments
  const {
    data: enrollments,
    isLoading: isLoadingEnrollments,
  } = useQuery<EnhancedEnrollment[]>({
    queryKey: ["/api/admin/users", viewingUserId, "enrollments"],
    queryFn: async () => {
      if (!viewingUserId) return [];
      const response = await apiRequest("GET", `/api/admin/users/${viewingUserId}/enrollments`);
      return await response.json();
    },
    enabled: isEnrollmentsOpen && viewingUserId !== null,
  });
  
  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<User> & { id: number }) => {
      const { id, ...rest } = userData;
      const response = await apiRequest("PUT", `/api/admin/users/${id}`, rest);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "User information has been updated successfully.",
      });
      setIsEditUserOpen(false);
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update user information.",
        variant: "destructive",
      });
    },
  });
  
  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: number; password: string }) => {
      const response = await apiRequest(
        "POST", 
        `/api/admin/users/${userId}/reset-password`, 
        { newPassword: password }
      );
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password reset",
        description: "User password has been reset successfully.",
      });
      setIsPasswordResetOpen(false);
      setNewPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Reset failed",
        description: error.message || "Failed to reset user password.",
        variant: "destructive",
      });
    },
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
  const getUserInitials = (firstName?: string | null, lastName?: string | null, username?: string) => {
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
  
  // Handle edit user action
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      username: user.username,
      role: user.role,
      phoneNumber: user.phoneNumber || ""
    });
    setIsEditUserOpen(true);
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle role selection changes
  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
  };
  
  // Handle save user changes
  const handleSaveUser = () => {
    if (!editingUser) return;
    
    updateUserMutation.mutate({
      id: editingUser.id,
      ...formData
    });
  };
  
  // Handle reset password action
  const handleResetPassword = (userId: number) => {
    setResetPasswordUserId(userId);
    setNewPassword("");
    setIsPasswordResetOpen(true);
  };
  
  // Handle submit password reset
  const handleSubmitPasswordReset = () => {
    if (!resetPasswordUserId || !newPassword) return;
    
    resetPasswordMutation.mutate({
      userId: resetPasswordUserId,
      password: newPassword
    });
  };
  
  // Handle view enrollments action
  const handleViewEnrollments = (userId: number) => {
    setViewingUserId(userId);
    setIsEnrollmentsOpen(true);
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
                        <Badge variant="secondary">
                          {userEnrollmentCounts[user.id] || 0} courses
                        </Badge>
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
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <UserCog className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                              <KeyRound className="h-4 w-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewEnrollments(user.id)}>
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
    
      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last Name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email Address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Phone Number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isPasswordResetOpen} onOpenChange={setIsPasswordResetOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Create a new password for this user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordResetOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitPasswordReset} 
              disabled={resetPasswordMutation.isPending || !newPassword}
            >
              {resetPasswordMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Enrollments Dialog */}
      <Dialog open={isEnrollmentsOpen} onOpenChange={setIsEnrollmentsOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>User Enrollments</DialogTitle>
            <DialogDescription>
              View courses this user is enrolled in
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoadingEnrollments ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !enrollments || enrollments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                This user is not enrolled in any courses.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enrolled On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments?.map((enrollment: EnhancedEnrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div className="font-medium">{enrollment.courseTitle}</div>
                        </TableCell>
                        <TableCell>₹{enrollment.coursePrice}</TableCell>
                        <TableCell>
                          <Badge
                            variant={enrollment.status === "active" ? "default" : "secondary"}
                          >
                            {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString() : 'Not available'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsEnrollmentsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
