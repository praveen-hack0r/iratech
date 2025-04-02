import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Clock, FileText } from "lucide-react";
import { CourseWithCategory } from "@shared/schema";
import { Link } from "wouter";

interface CourseCardProps {
  course: CourseWithCategory;
  showEnrollButton?: boolean;
}

export function CourseCard({ course, showEnrollButton = true }: CourseCardProps) {
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

  // Format price as currency
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);

  // Format sale price if available
  const formattedSalePrice = salePrice ? new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
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

  return (
    <Card className="bg-card rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-border">
      <div className="relative">
        {thumbnailUrl ? (
          <div className="w-full h-48 bg-muted">
            <div 
              className="w-full h-full bg-center bg-cover"
              style={{ backgroundImage: `url(${thumbnailUrl})` }}
              aria-label={`${title} course thumbnail`}
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">No thumbnail available</span>
          </div>
        )}
        {isFeatured && (
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 m-2 rounded">
            BESTSELLER
          </div>
        )}
      </div>
      <CardContent className="p-6">
        <div className="flex items-center mb-2">
          {category && (
            <span className={`${categoryStyles.bg} ${categoryStyles.text} text-xs px-2 py-1 rounded`}>
              {category.name}
            </span>
          )}
          <div className="flex items-center ml-auto">
            <Star className="w-4 h-4 text-yellow-400 dark:text-yellow-300 fill-current" />
            <span className="text-muted-foreground text-sm ml-1">4.8 (320)</span>
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{description}</p>
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <Clock className="w-4 h-4 mr-1" />
          <span>{duration || 0} hours of content</span>
          <span className="mx-2">•</span>
          <FileText className="w-4 h-4 mr-1" />
          <span>{resourceCount || 0} downloadable resources</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-foreground">
              {formattedSalePrice || formattedPrice}
            </span>
            {formattedSalePrice && (
              <span className="text-sm text-muted-foreground line-through ml-2">{formattedPrice}</span>
            )}
          </div>
          {showEnrollButton && (
            <Button 
              asChild
              className={`${category?.textColor === 'text-primary' ? 'bg-primary hover:bg-primary/90' : 
                category?.textColor === 'text-secondary' ? 'bg-secondary hover:bg-secondary/90' : 
                category?.textColor === 'text-accent' ? 'bg-accent hover:bg-accent/90' : 
                'bg-primary hover:bg-primary/90'} text-primary-foreground px-4 py-2 rounded-md text-sm font-medium`}
            >
              <Link href={`/courses/${slug}`}>
                Enroll Now
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
