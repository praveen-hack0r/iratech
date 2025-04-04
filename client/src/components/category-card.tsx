import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Category } from "@shared/schema";
import { 
  Lock, 
  Code, 
  FileSpreadsheet, 
  Megaphone,
  ChevronRight
} from "lucide-react";

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const { name, description, slug, iconName, iconColor, bgColor, textColor } = category;

  // Function to get the icon component based on iconName
  const getIcon = () => {
    const iconClass = `w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${iconColor || 'text-primary'}`;
    switch(iconName) {
      case 'Lock':
        return <Lock className={iconClass} />;
      case 'Code':
        return <Code className={iconClass} />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className={iconClass} />;
      case 'Megaphone':
        return <Megaphone className={iconClass} />;
      default:
        return <Code className={iconClass} />;
    }
  };

  // Map color classes for dark mode compatibility
  const getBgColor = () => {
    if (!bgColor) return 'bg-primary/10';
    
    if (bgColor.includes('blue')) return bgColor + ' dark:bg-blue-900/20';
    if (bgColor.includes('green')) return bgColor + ' dark:bg-green-900/20';
    if (bgColor.includes('indigo')) return bgColor + ' dark:bg-indigo-900/20';
    if (bgColor.includes('yellow')) return bgColor + ' dark:bg-yellow-900/20';
    if (bgColor.includes('red')) return bgColor + ' dark:bg-red-900/20';
    if (bgColor.includes('pink')) return bgColor + ' dark:bg-pink-900/20';
    
    return bgColor;
  };

  return (
    <Card className="bg-card rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-all h-full border border-border">
      <CardContent className="p-0">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 ${getBgColor()} rounded-lg flex items-center justify-center mb-3 sm:mb-4`}>
          {getIcon()}
        </div>
        <h3 className="text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2 text-foreground">{name}</h3>
        <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 line-clamp-3">{description}</p>
        <Link 
          href={`/courses?category=${slug}`}
          className={`${textColor || 'text-primary'} text-sm sm:text-base font-medium hover:underline flex items-center mt-auto`}
        >
          Explore Courses
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
        </Link>
      </CardContent>
    </Card>
  );
}
