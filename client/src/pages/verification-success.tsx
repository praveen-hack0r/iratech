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
          
          <h1 className="text-2xl font-bold mb-4">Email Verified!</h1>
          
          <p className="text-muted-foreground mb-8">
            Your email has been successfully verified. You now have full access to all features and courses on IraTech.
          </p>
          
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