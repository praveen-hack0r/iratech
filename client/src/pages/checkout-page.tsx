import { useState, useEffect } from 'react';
import { MainLayout } from "@/components/layouts/main-layout";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle, CheckCircle, CreditCard, QrCode, Copy, CheckCheck, IndianRupee, Smartphone } from 'lucide-react';
import { CourseWithCategory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Copy Button Component
function CopyButton({ textToCopy }: { textToCopy: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopied(true);
        toast({
          title: "Copied to clipboard",
          description: "UPI ID has been copied",
          variant: "default",
        });
        
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        toast({
          title: "Failed to copy",
          description: "Please try again",
          variant: "destructive",
        });
      });
  };
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="text-gray-500 hover:text-gray-800"
    >
      {copied ? (
        <CheckCheck className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

export default function CheckoutPage() {
  const [match, params] = useRoute("/checkout/:courseId");
  const courseId = parseInt(params?.courseId || "0");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Fetch course details
  const {
    data: course,
    isLoading: courseLoading,
    error: courseError
  } = useQuery<CourseWithCategory>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });
  
  // Create enrollment without payment
  const enrollMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/enroll", { courseId });
      return await res.json();
    },
    onSuccess: () => {
      setSuccess(true);
      toast({
        title: "Enrollment Successful",
        description: `You have successfully enrolled in ${course?.title}`,
        variant: "default",
      });
      
      // Invalidate courses and enrollments queries
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      
      setTimeout(() => {
        navigate('/my-learning');
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Enrollment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleEnroll = () => {
    setLoading(true);
    enrollMutation.mutate();
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Complete Your Enrollment</h1>
          <p className="text-gray-600 mt-2">Enroll in your selected course</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Left column - Enrollment Form */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-6">Enrollment Details</h2>
              
              {courseLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-10 w-full mb-2" />
                  <Skeleton className="h-10 w-full mb-2" />
                  <Skeleton className="h-10 w-full mb-6" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : courseError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {(courseError as Error)?.message || 
                     "Failed to load course details. Please try again."}
                  </AlertDescription>
                </Alert>
              ) : course ? (
                <div>
                  {success ? (
                    <Alert className="mb-4 bg-green-50 border-green-500">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-700">Enrollment Successful!</AlertTitle>
                      <AlertDescription className="text-green-600">
                        Your enrollment has been processed successfully. Redirecting to your courses...
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h3 className="font-medium text-blue-800 mb-2">What you'll get:</h3>
                        <ul className="space-y-2 text-sm text-blue-700">
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-blue-600" />
                            <span>Full access to all course content</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-blue-600" />
                            <span>Downloadable resources and materials</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-blue-600" />
                            <span>Lifetime access to the course</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <IndianRupee className="h-5 w-5 mr-2" />
                          Payment Options
                        </h3>
                        
                        <Tabs defaultValue="upi-qr" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="upi-qr" className="flex items-center">
                              <QrCode className="h-4 w-4 mr-2" />
                              UPI QR
                            </TabsTrigger>
                            <TabsTrigger value="upi-id" className="flex items-center">
                              <Smartphone className="h-4 w-4 mr-2" />
                              UPI ID
                            </TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="upi-qr" className="mt-4">
                            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="h-48 w-48 bg-white p-2 rounded-lg border mb-4 flex items-center justify-center">
                                {/* Using QR code SVG embedded - this represents the UPI payment QR code */}
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=9015090976@upi&pn=EduPlatform&am=${course.price || 999}&cu=INR&tn=Course:${encodeURIComponent(course.title || 'Course Payment')}`} 
                                  alt="UPI QR Code"
                                  className="h-full w-full object-contain"
                                />
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-600 mb-2">Scan with any UPI app to pay</p>
                                <p className="text-xs text-gray-500">GPay, PhonePe, Paytm, or any UPI app</p>
                                <p className="text-xs font-medium text-orange-600 mt-2">Amount: ₹{course.price || 999}</p>
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="upi-id" className="mt-4">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-sm text-gray-600 mb-4">Pay to this UPI ID using your preferred UPI app:</p>
                              
                              <div className="flex items-center justify-between bg-white p-3 rounded border">
                                <div className="font-medium">9015090976@upi</div>
                                <CopyButton textToCopy="9015090976@upi" />
                              </div>
                              
                              <div className="mt-4 text-xs text-gray-500">
                                <p>1. Open your UPI app (GPay, PhonePe, Paytm, etc.)</p>
                                <p>2. Select "Pay to UPI ID" option</p>
                                <p>3. Enter the UPI ID shown above</p>
                                <p>4. Enter the exact amount: ₹{course.price || 999}</p>
                                <p>5. Complete the payment</p>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                      
                      <div className="mb-6">
                        <div className="flex items-center text-sm text-orange-600 mb-3">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <p>After payment, click the button below to complete enrollment</p>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleEnroll}
                        className="w-full font-semibold" 
                        disabled={loading || success}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : success ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Enrollment Complete
                          </>
                        ) : (
                          `Confirm Payment & Enroll`
                        )}
                      </Button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>
          
          {/* Right column - Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
              <h2 className="text-xl font-bold mb-6">Course Summary</h2>
              
              {courseLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-12 w-12" />
                    <div className="flex-1 ml-4">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                </div>
              ) : courseError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load course details. Please try again.
                  </AlertDescription>
                </Alert>
              ) : course ? (
                <>
                  <div className="flex items-start mb-6">
                    {course.thumbnailUrl ? (
                      <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        <div 
                          className="w-full h-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${course.thumbnailUrl})` }}
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                        <CreditCard className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="ml-4">
                      <h3 className="font-medium">{course.title}</h3>
                      <p className="text-sm text-gray-500">
                        {course.category?.name}
                      </p>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Course Duration</span>
                      <span>{course.duration ? `${Math.round(course.duration/60)} hours` : 'Self-paced'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Resources</span>
                      <span>{course.resourceCount || 0} files</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category</span>
                      <span>{course.category?.name || 'Uncategorized'}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Price</span>
                      <span className="text-green-600">₹{course.price || 0}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-xs text-gray-500">
                    <p>By enrolling in this course you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.</p>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
