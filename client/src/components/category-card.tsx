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
    switch(iconName) {
      case 'Lock':
        return <Lock className={`w-8 h-8 ${iconColor || 'text-primary'}`} />;
      case 'Code':
        return <Code className={`w-8 h-8 ${iconColor || 'text-secondary'}`} />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className={`w-8 h-8 ${iconColor || 'text-accent'}`} />;
      case 'Megaphone':
        return <Megaphone className={`w-8 h-8 ${iconColor || 'text-yellow-500'}`} />;
      default:
        return <Code className={`w-8 h-8 ${iconColor || 'text-primary'}`} />;
    }
  };

  return (
    <Card className="bg-gray-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className={`w-14 h-14 ${bgColor || 'bg-blue-100'} rounded-lg flex items-center justify-center mb-4`}>
          {getIcon()}
        </div>
        <h3 className="text-xl font-semibold mb-2">{name}</h3>
        <p className="text-gray-600 mb-4 line-clamp-3">{description}</p>
        <Link href={`/courses?category=${slug}`}>
          <a className={`${textColor || 'text-primary'} font-medium hover:underline flex items-center`}>
            Explore Courses
            <ChevronRight className="w-4 h-4 ml-1" />
          </a>
        </Link>
      </CardContent>
    </Card>
  );
}
