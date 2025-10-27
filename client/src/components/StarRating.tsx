import { Star, StarHalf } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  showCount?: boolean;
  count?: number;
  size?: "sm" | "md" | "lg";
}

export default function StarRating({ 
  rating, 
  maxRating = 5, 
  showCount = false, 
  count = 0,
  size = "md" 
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };
  
  const iconSize = sizeClasses[size];
  const textSize = size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base";

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= maxRating; i++) {
      if (rating >= i) {
        stars.push(
          <Star key={i} className={`${iconSize} fill-primary text-primary`} />
        );
      } else if (rating >= i - 0.5) {
        stars.push(
          <StarHalf key={i} className={`${iconSize} fill-primary text-primary`} />
        );
      } else {
        stars.push(
          <Star key={i} className={`${iconSize} text-muted`} />
        );
      }
    }
    return stars;
  };

  return (
    <div className="flex items-center gap-1" data-testid="component-star-rating">
      <div className="flex items-center gap-0.5">
        {renderStars()}
      </div>
      {showCount && (
        <span className={`${textSize} text-muted-foreground`}>
          ({count})
        </span>
      )}
    </div>
  );
}
