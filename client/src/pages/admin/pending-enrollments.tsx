import { useState } from 'react';
import { AdminLayout } from "./components/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, CheckCircle, CreditCard, Calendar, User, Info, Clock, CalendarClock } from 'lucide-react';

// Types for enrollments
type EnrichedEnrollment = {
  id: number;
  userId: number;
  courseId: number;
  status: string;
  enrollmentDate: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  approvedBy: number | null;
  approvedAt: string | null;
  user: {
    id: number;
    username: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  course: {
    id: number;
    title: string;
    price: number;
  } | null;
};

export default function PendingEnrollmentsPage() {
  const { toast } = useToast();
  
  // Fetch pending enrollments
  const {
    data: pendingEnrollments,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<EnrichedEnrollment[]>({
    queryKey: ["/api/admin/enrollments/pending"],
  });
  
  // Approve enrollment mutation
  const approveMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      const res = await apiRequest("POST", `/api/admin/enrollments/${enrollmentId}/approve`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Enrollment Approved",
        description: "The enrollment has been approved successfully.",
        variant: "default",
      });
      
      // Refetch data
      refetch();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleApprove = (enrollmentId: number) => {
    approveMutation.mutate(enrollmentId);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Pending Enrollments</h1>
            <p className="text-gray-600 mt-1">Review and approve enrollment requests</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="w-full">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {(error as Error)?.message || "Failed to load enrollments. Please try again."}
            </AlertDescription>
          </Alert>
        ) : pendingEnrollments?.length === 0 ? (
          <Card className="w-full bg-gray-50">
            <CardHeader>
              <div className="flex items-center justify-center">
                <Info className="h-12 w-12 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-700">No Pending Enrollments</h3>
                <p className="text-gray-500 mt-1">There are no pending enrollment requests to approve at the moment.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {pendingEnrollments?.map(enrollment => (
              <Card key={enrollment.id} className="w-full overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold">
                        {enrollment.course?.title || "Course"}
                      </CardTitle>
                      <CardDescription>
                        Price: ₹{enrollment.course?.price || 0}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      {enrollment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 mt-1 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Student Details</p>
                        <p className="text-sm text-gray-600">
                          {enrollment.user?.firstName} {enrollment.user?.lastName} ({enrollment.user?.email})
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <CreditCard className="h-4 w-4 mt-1 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Payment Details</p>
                        <p className="text-sm text-gray-600">
                          Method: {enrollment.paymentMethod || "UPI"}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          Reference: {enrollment.paymentReference || "N/A"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-1 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Request Date</p>
                        <p className="text-sm text-gray-600">
                          {enrollment.enrollmentDate ? formatDate(enrollment.enrollmentDate) : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <Separator />
                <CardFooter className="bg-gray-50 pt-3 pb-3">
                  <Button 
                    className="w-full" 
                    onClick={() => handleApprove(enrollment.id)}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Enrollment
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}