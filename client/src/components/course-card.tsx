import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Clock, FileText, Play, Award, Heart } from "lucide-react";
import { CourseWithCategory } from "@shared/schema";
import { Link } from "wouter";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

interface CourseCardProps {
  course: CourseWithCategory;
  showEnrollButton?: boolean;
}

export function CourseCard({ course, showEnrollButton = true }: CourseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuth();
  const { 
    id, 
    title, 
    description, 
    thumbnailUrl, 
    price, 
    salePrice, 
    duration,
    resourceCount,
    category,
    slug,
    isFeatured
  } = course;
  
  // Check if user is enrolled in this course
  const { data: enrollmentData, isLoading: enrollmentLoading } = useQuery({
    queryKey: [`/api/enrollments/${id}`],
    // Only run this query if the user is logged in
    enabled: !!user,
    // Add additional logging to debug enrollment status
    onSuccess: (data) => {
      console.log(`Enrollment status for course ${id}:`, data);
    }
  });

  // Format price as currency
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(price);

  // Format sale price if available
  const formattedSalePrice = salePrice ? new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(salePrice) : null;

  // Function to determine category color
  const getCategoryStyles = () => {
    if (!category) return {};
    
    const bg = category.bgColor || "bg-primary/10";
    let darkBg = "";
    
    // Add dark mode variants
    if (bg.includes('blue')) darkBg = "dark:bg-blue-900/20";
    else if (bg.includes('green')) darkBg = "dark:bg-green-900/20";
    else if (bg.includes('indigo')) darkBg = "dark:bg-indigo-900/20";
    else if (bg.includes('yellow')) darkBg = "dark:bg-yellow-900/20";
    else if (bg.includes('red')) darkBg = "dark:bg-red-900/20";
    else if (bg.includes('pink')) darkBg = "dark:bg-pink-900/20";
    
    return {
      bg: `${bg} ${darkBg}`,
      text: category.textColor || "text-primary"
    };
  };

  const categoryStyles = getCategoryStyles();
  
  // Default placeholder image if no thumbnail provided
  const defaultThumbnail = () => {
    if (!category) return "bg-gradient-to-br from-blue-500 to-purple-600";
    
    if (category.name.toLowerCase().includes("hacking")) {
      return "bg-gradient-to-br from-green-500 to-teal-600";
    } else if (category.name.toLowerCase().includes("coding")) {
      return "bg-gradient-to-br from-blue-500 to-indigo-600";
    } else if (category.name.toLowerCase().includes("excel")) {
      return "bg-gradient-to-br from-green-500 to-emerald-600";
    } else if (category.name.toLowerCase().includes("marketing")) {
      return "bg-gradient-to-br from-orange-500 to-red-600";
    }
    
    return "bg-gradient-to-br from-blue-500 to-purple-600";
  };

  return (
    <Card 
      className="bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-border group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden">
        <Link href={`/courses/${slug}`} className="block">
          {thumbnailUrl ? (
            <div className="w-full h-52 bg-muted relative overflow-hidden">
              <div 
                className={`w-full h-full bg-center bg-cover transform transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
                style={{ backgroundImage: `url(${thumbnailUrl})` }}
                aria-label={`${title} course thumbnail`}
              />
              {/* Overlay on hover */}
              <div className={`absolute inset-0 bg-black bg-opacity-30 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'} flex items-center justify-center`}>
                <div className="bg-white bg-opacity-90 rounded-full p-3 transform transition-transform duration-300 hover:scale-110">
                  <Play className="w-8 h-8 text-primary fill-current" />
                </div>
              </div>
            </div>
          ) : (
            <div className={`w-full h-52 ${defaultThumbnail()} flex items-center justify-center p-4 relative`}>
              <div className="text-center text-white z-10">
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-sm text-white/80 line-clamp-2">{description}</p>
              </div>
              {/* Hover effect */}
              <div className={`absolute inset-0 bg-black bg-opacity-10 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'} flex items-center justify-center`}>
                <div className="bg-white bg-opacity-90 rounded-full p-3 transform transition-transform duration-300 hover:scale-110">
                  <Play className="w-8 h-8 text-primary fill-current" />
                </div>
              </div>
            </div>
          )}
        </Link>
        
        {/* Course badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {isFeatured && (
            <div className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center">
              <Award className="w-3 h-3 mr-1" />
              BESTSELLER
            </div>
          )}
          {salePrice && (
            <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
              SALE
            </div>
          )}
        </div>
        
        {/* Like button */}
        <button 
          className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 p-2 rounded-full shadow-md hover:bg-white dark:hover:bg-gray-800 transition-colors"
          aria-label="Add to favorites"
        >
          <Heart className="w-4 h-4 text-gray-500 hover:text-red-500 transition-colors" />
        </button>
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-center mb-3">
          {category && (
            <span className={`${categoryStyles.bg} ${categoryStyles.text} text-xs font-medium px-2.5 py-1 rounded-full`}>
              {category.name}
            </span>
          )}
          <div className="flex items-center ml-auto">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`w-4 h-4 ${star <= 4 ? 'text-yellow-400 dark:text-yellow-300 fill-current' : 'text-gray-300 dark:text-gray-600'}`} 
                />
              ))}
            </div>
            <span className="text-muted-foreground text-sm ml-1">4.8 (320)</span>
          </div>
        </div>
        
        <Link href={`/courses/${slug}`} className="block group-hover:text-primary transition-colors">
          <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
        </Link>
        
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{description}</p>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1.5 text-primary/70" />
            <span>{duration || 0} hours</span>
          </div>
          <div className="flex items-center">
            <FileText className="w-4 h-4 mr-1.5 text-primary/70" />
            <span>{resourceCount || 0} resources</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <div>
            <span className="text-2xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {formattedSalePrice || formattedPrice}
            </span>
            {formattedSalePrice && (
              <span className="text-sm text-muted-foreground line-through ml-2">{formattedPrice}</span>
            )}
          </div>
          
          {showEnrollButton && (
            <Button 
              asChild
              variant={enrollmentData?.isEnrolled ? "success" : "default"}
              className={`rounded-full px-5 shadow-md hover:shadow-lg transition-all 
                ${enrollmentData?.isEnrolled ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              <Link href={enrollmentData?.isEnrolled ? "/my-learning" : `/courses/${slug}`}>
                {enrollmentLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </span>
                ) : enrollmentData?.isEnrolled ? (
                  "Continue Learning"
                ) : (
                  "Enroll Now"
                )}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
