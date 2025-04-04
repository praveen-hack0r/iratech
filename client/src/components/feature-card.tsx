import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
}

export function FeatureCard({ 
  title, 
  description, 
  icon: Icon, 
  iconColor, 
  bgColor 
}: FeatureCardProps) {
  return (
    <Card className="bg-card p-3 sm:p-4 md:p-6 rounded-lg border border-border h-full transition-all hover:shadow-md">
      <CardContent className="p-0">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${bgColor} dark:bg-accent/10 rounded-lg flex items-center justify-center mb-2 sm:mb-3 md:mb-4`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
        </div>
        <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-1.5 md:mb-2 text-foreground">{title}</h3>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground line-clamp-4">{description}</p>
      </CardContent>
    </Card>
  );
}
