import { MainLayout } from "@/components/layouts/main-layout";
import { Button } from "@/components/ui/button";
import { CategoryCard } from "@/components/category-card";
import { CourseCard } from "@/components/course-card";
import { FeatureCard } from "@/components/feature-card";
import { useQuery } from "@tanstack/react-query";
import { Category, CourseWithCategory } from "@shared/schema";
import { Link } from "wouter";
import { 
  Shield, 
  FileText, 
  CreditCard, 
  AlertCircle, 
  RotateCcw, 
  MessageSquare,
  AlertTriangle,
  MailCheck
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function HomePage() {
  const { user, resendVerificationMutation } = useAuth();
  
  // Check if user is logged in but not verified
  const needsVerification = user && !user.isVerified;
  
  // Handle resending verification email
  const handleResendVerification = () => {
    resendVerificationMutation.mutate();
  };
  
  // Fetch categories
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError
  } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch featured courses
  const {
    data: featuredCourses,
    isLoading: coursesLoading,
    error: coursesError
  } = useQuery<CourseWithCategory[]>({
    queryKey: ["/api/courses?featured=true"],
  });

  // Features list
  const features = [
    {
      title: "Secure Video Platform",
      description: "Our video player prevents screen recording, ensuring your learning materials remain protected and exclusive.",
      icon: Shield,
      iconColor: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Downloadable Resources",
      description: "Access and download comprehensive notes and practice materials for each course to enhance your learning.",
      icon: FileText,
      iconColor: "text-secondary",
      bgColor: "bg-secondary/10"
    },
    {
      title: "Secure Payment",
      description: "Our integrated payment gateway ensures secure transactions when enrolling in courses.",
      icon: CreditCard,
      iconColor: "text-accent",
      bgColor: "bg-accent/10"
    },
    {
      title: "Expert Instructors",
      description: "Learn from industry professionals with years of experience in their respective fields.",
      icon: AlertCircle,
      iconColor: "text-yellow-500 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20"
    },
    {
      title: "Regular Updates",
      description: "Courses are regularly updated to ensure the content stays relevant with the latest industry trends.",
      icon: RotateCcw,
      iconColor: "text-red-500 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/20"
    },
    {
      title: "Community Support",
      description: "Join our community of learners and instructors to get support and share knowledge.",
      icon: MessageSquare,
      iconColor: "text-pink-500 dark:text-pink-400",
      bgColor: "bg-pink-100 dark:bg-pink-900/20"
    },
  ];

  return (
    <MainLayout>
      {/* Verification Alert */}
      {needsVerification && (
        <div className="pt-6 px-4">
          <Alert variant="warning" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-600 dark:text-amber-400">
              Email verification required
            </AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span>Please verify your email address to access all features.</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-amber-500 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 ml-0 sm:ml-2 w-fit"
                onClick={handleResendVerification}
                disabled={resendVerificationMutation.isPending}
              >
                {resendVerificationMutation.isPending ? (
                  "Sending..."
                ) : (
                  <><MailCheck className="mr-2 h-4 w-4" /> Resend verification email</>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Hero Section */}
      <header className="pt-24 md:pt-32 pb-16 bg-background dark:bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
                Master Tech Skills with Expert-Led Courses
              </h1>
              <p className="mt-4 text-xl text-muted-foreground max-w-3xl">
                Learn hacking, coding, Excel with AI, and digital marketing from industry professionals.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-primary hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-md text-center transition-colors">
                  <Link href="/courses">
                    Explore Courses
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="bg-white hover:bg-gray-100 text-primary border border-primary font-medium px-6 py-3 rounded-md text-center transition-colors">
                  <Link href="/auth?tab=register">
                    Sign Up Free
                  </Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="rounded-lg shadow-xl w-full aspect-video overflow-hidden">
                <div 
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: "url('https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80')" }}
                  aria-label="Hero image of students learning technology"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Categories Section */}
      <section className="py-12 bg-background dark:bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Our Course Categories</h2>
          
          {categoriesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl p-6 shadow-sm">
                  <Skeleton className="w-14 h-14 rounded-lg mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          ) : categoriesError ? (
            <div className="text-center text-red-500">
              Failed to load categories. Please try again later.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {categories?.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-12 bg-secondary dark:bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">Featured Courses</h2>
            <Link href="/courses" className="text-primary hover:text-primary/90 font-medium flex items-center">
              View All
              <svg className="w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg overflow-hidden shadow-md">
                  <Skeleton className="w-full h-48" />
                  <div className="p-6">
                    <div className="flex items-center mb-2">
                      <Skeleton className="h-5 w-20" />
                      <div className="flex items-center ml-auto">
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-10 w-28" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : coursesError ? (
            <div className="text-center text-destructive">
              Failed to load courses. Please try again later.
            </div>
          ) : featuredCourses?.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              No featured courses available at the moment. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCourses?.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-background dark:bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Why Choose TechLearn</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              We provide high-quality, industry-relevant tech courses with features designed to enhance your learning experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                iconColor={feature.iconColor}
                bgColor={feature.bgColor}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 bg-primary dark:bg-[#000000] text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Learning Journey?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join thousands of students already learning with TechLearn and take your skills to the next level.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 font-medium px-8 py-3 rounded-md transition-colors">
              <Link href="/auth?tab=register">
                Get Started
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent text-white hover:bg-white/10 border border-white font-medium px-8 py-3 rounded-md transition-colors">
              <Link href="/courses">
                Browse Courses
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
