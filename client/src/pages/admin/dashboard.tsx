import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Users,
  BookOpen,
  CreditCard,
  BarChart3,
  Clock,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLayout } from "@/components/layouts/admin-layout";

// Dashboard data type
interface DashboardData {
  totalStudents: number;
  totalCourses: number;
  totalEnrollments: number;
  recentEnrollments: Array<{
    id: number;
    enrollmentDate: string;
    status: string;
    user: {
      id: number;
      username: string;
      email: string;
      firstName: string;
      lastName: string;
    };
    course: {
      id: number;
      title: string;
      slug: string;
    };
  }>;
}

// Sample chart data
const enrollmentChartData = [
  { name: 'Jan', enrollments: 20 },
  { name: 'Feb', enrollments: 28 },
  { name: 'Mar', enrollments: 32 },
  { name: 'Apr', enrollments: 45 },
  { name: 'May', enrollments: 60 },
  { name: 'Jun', enrollments: 52 },
  { name: 'Jul', enrollments: 65 },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading,
    error
  } = useQuery<DashboardData>({
    queryKey: ["/api/admin/dashboard"],
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Get user initials for avatar
  const getUserInitials = (firstName?: string, lastName?: string, username?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (username) {
      return username.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button asChild>
          <Link href="/admin/courses/new">
            Create New Course
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Students
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : error ? (
                  <p className="text-red-500">Error loading data</p>
                ) : (
                  <div className="text-2xl font-bold">{dashboardData?.totalStudents || 0}</div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Courses
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : error ? (
                  <p className="text-red-500">Error loading data</p>
                ) : (
                  <div className="text-2xl font-bold">{dashboardData?.totalCourses || 0}</div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Enrollments
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : error ? (
                  <p className="text-red-500">Error loading data</p>
                ) : (
                  <div className="text-2xl font-bold">{dashboardData?.totalEnrollments || 0}</div>
                )}
              </CardContent>
            </Card>
            
            {/* Contact Messages Card with prominent styling */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">
                  Contact Messages
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-blue-700" />
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-xl font-bold text-blue-700">View Messages</div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="default" className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                  <Link href="/admin/contact-messages">
                    View All Messages
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Enrollment Chart */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Enrollment Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={enrollmentChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="enrollments" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Enrollments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Enrollments</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/pending-enrollments">
                  View Pending
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-6">
                  <p className="text-red-500">Error loading enrollment data</p>
                </div>
              ) : dashboardData?.recentEnrollments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">No recent enrollments</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData?.recentEnrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {getUserInitials(
                                  enrollment.user?.firstName,
                                  enrollment.user?.lastName,
                                  enrollment.user?.username
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {enrollment.user?.firstName && enrollment.user?.lastName
                                  ? `${enrollment.user.firstName} ${enrollment.user.lastName}`
                                  : enrollment.user?.username}
                              </p>
                              <p className="text-xs text-gray-500">
                                {enrollment.user?.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/courses/${enrollment.course?.id}/edit`} className="text-primary hover:underline">
                            {enrollment.course?.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {formatDate(enrollment.enrollmentDate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div
                              className={`h-2 w-2 rounded-full mr-2 ${
                                enrollment.status === 'active' 
                                  ? 'bg-green-500' 
                                  : enrollment.status === 'pending' 
                                  ? 'bg-yellow-500' 
                                  : 'bg-red-500'
                              }`}
                            />
                            <span className="capitalize">
                              {enrollment.status}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="enrollments">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">
                Manage student enrollments and payment approvals.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Pending Enrollments</CardTitle>
                      <div className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                        Needs Approval
                      </div>
                    </div>
                    <CardDescription>
                      Review and approve enrollment requests
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-2">
                    <Button asChild className="w-full">
                      <Link href="/admin/pending-enrollments">
                        Manage Pending Enrollments
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">All Enrollments</CardTitle>
                    <CardDescription>
                      View and manage all student enrollments
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-2">
                    <Button variant="outline" disabled className="w-full">
                      Coming Soon
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="statistics">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">
                This section will contain detailed charts and analytics about your courses and students.
              </p>
              <div className="flex justify-center py-12">
                <p className="text-muted-foreground">Coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
