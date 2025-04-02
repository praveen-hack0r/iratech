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
  MessageSquare 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
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
      bgColor: "bg-blue-100"
    },
    {
      title: "Downloadable Resources",
      description: "Access and download comprehensive notes and practice materials for each course to enhance your learning.",
      icon: FileText,
      iconColor: "text-secondary",
      bgColor: "bg-green-100"
    },
    {
      title: "Secure Payment",
      description: "Our integrated payment gateway ensures secure transactions when enrolling in courses.",
      icon: CreditCard,
      iconColor: "text-accent",
      bgColor: "bg-indigo-100"
    },
    {
      title: "Expert Instructors",
      description: "Learn from industry professionals with years of experience in their respective fields.",
      icon: AlertCircle,
      iconColor: "text-yellow-500",
      bgColor: "bg-yellow-100"
    },
    {
      title: "Regular Updates",
      description: "Courses are regularly updated to ensure the content stays relevant with the latest industry trends.",
      icon: RotateCcw,
      iconColor: "text-red-500",
      bgColor: "bg-red-100"
    },
    {
      title: "Community Support",
      description: "Join our community of learners and instructors to get support and share knowledge.",
      icon: MessageSquare,
      iconColor: "text-pink-500",
      bgColor: "bg-pink-100"
    },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <header className="pt-24 md:pt-32 pb-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl font-bold text-dark sm:text-5xl">
                Master Tech Skills with Expert-Led Courses
              </h1>
              <p className="mt-4 text-xl text-gray-600 max-w-3xl">
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
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Our Course Categories</h2>
          
          {categoriesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-6 shadow-sm">
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
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Courses</h2>
            <Link href="/courses">
              <a className="text-primary hover:text-blue-700 font-medium flex items-center">
                View All
                <svg className="w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </Link>
          </div>
          
          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md">
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
            <div className="text-center text-red-500">
              Failed to load courses. Please try again later.
            </div>
          ) : featuredCourses?.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
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
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose TechLearn</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
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
      <section className="py-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Learning Journey?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join thousands of students already learning with TechLearn and take your skills to the next level.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-100 font-medium px-8 py-3 rounded-md transition-colors">
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
