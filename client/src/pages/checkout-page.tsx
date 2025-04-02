import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { MainLayout } from "@/components/layouts/main-layout";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle, CheckCircle, ShieldCheck, CreditCard } from 'lucide-react';
import { CourseWithCategory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function CheckoutForm({ courseId, course }: { courseId: number, course: CourseWithCategory | undefined }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Confirm the payment
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/my-learning', // In real app, use a webhook instead
        },
        redirect: 'if_required'
      });
      
      if (submitError) {
        throw new Error(submitError.message || 'Payment failed. Please try again.');
      } else {
        // If we get here, payment succeeded (no redirect needed)
        setSuccess(true);
        toast({
          title: "Payment Successful",
          description: `You have successfully enrolled in ${course?.title}`,
          variant: "default",
        });
        setTimeout(() => {
          navigate('/my-learning');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Payment Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Payment Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 bg-green-50 border-green-500">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700">Payment Successful!</AlertTitle>
          <AlertDescription className="text-green-600">
            Your enrollment has been processed successfully. Redirecting to your courses...
          </AlertDescription>
        </Alert>
      )}
      
      <div className="mb-6">
        <PaymentElement />
      </div>
      
      <div className="flex flex-col space-y-2">
        <Button 
          type="submit" 
          className="w-full font-semibold" 
          disabled={!stripe || loading || success}
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
            `Pay ${course ? new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(course.salePrice || course.price) : '$0.00'}`
          )}
        </Button>
        
        {!success && (
          <div className="flex justify-center space-x-1 text-xs text-gray-500">
            <ShieldCheck className="h-4 w-4" />
            <span>Secure payment powered by Stripe</span>
          </div>
        )}
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  const [match, params] = useRoute("/checkout/:courseId");
  const courseId = parseInt(params?.courseId || "0");
  const [clientSecret, setClientSecret] = useState("");
  
  // Fetch course details
  const {
    data: course,
    isLoading: courseLoading,
    error: courseError
  } = useQuery<CourseWithCategory>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });
  
  // Create payment intent
  const createPaymentIntent = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/create-payment-intent", { courseId });
      return await res.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
  });
  
  useEffect(() => {
    if (courseId && !clientSecret && !createPaymentIntent.isLoading) {
      createPaymentIntent.mutate();
    }
  }, [courseId, clientSecret, createPaymentIntent]);
  
  // Calculate the order summary
  const calculateSummary = () => {
    if (!course) return { subtotal: 0, total: 0 };
    
    const subtotal = course.price;
    const discount = course.salePrice ? subtotal - course.salePrice : 0;
    const total = subtotal - discount;
    
    return { subtotal, discount, total };
  };
  
  const { subtotal, discount, total } = calculateSummary();
  
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
          <h1 className="text-2xl md:text-3xl font-bold">Complete Your Purchase</h1>
          <p className="text-gray-600 mt-2">Securely pay for your course enrollment</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Left column - Payment Form */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold mb-6">Payment Details</h2>
              
              {courseLoading || createPaymentIntent.isLoading || !clientSecret ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-10 w-full mb-2" />
                  <Skeleton className="h-10 w-full mb-2" />
                  <Skeleton className="h-10 w-full mb-6" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : courseError || createPaymentIntent.error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {(courseError as Error)?.message || 
                     (createPaymentIntent.error as Error)?.message || 
                     "Failed to load payment form. Please try again."}
                  </AlertDescription>
                </Alert>
              ) : clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm courseId={courseId} course={course} />
                </Elements>
              ) : null}
            </div>
          </div>
          
          {/* Right column - Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              
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
                      <span className="text-gray-600">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount</span>
                        <span className="text-green-600">-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-xs text-gray-500">
                    <p>By completing your purchase you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.</p>
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
