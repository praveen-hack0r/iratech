import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layouts/main-layout";
import { Link } from "wouter";
import { Check, ArrowRight } from "lucide-react";

export default function VerificationSuccessPage() {
  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="max-w-md w-full px-4 py-10 bg-card rounded-lg shadow-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Check className="h-8 w-8 text-primary" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Email Successfully Verified!</h1>
          
          <div className="space-y-4 mb-8">
            <p className="text-card-foreground">
              Thank you for verifying your email address. Your IraTech account is now fully activated!
            </p>
            
            <p className="text-muted-foreground">
              You now have complete access to all our premium learning resources, including 
              hacking tutorials, coding courses, Excel with AI training, and digital marketing lessons.
            </p>
            
            <p className="text-primary font-medium">
              Start your learning journey today and unlock your full potential!
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button asChild size="lg">
              <Link href="/courses">
                <span className="flex items-center">
                  Browse Courses <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg">
              <Link href="/my-learning">My Learning</Link>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}