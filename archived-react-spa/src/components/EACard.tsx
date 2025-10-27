import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StarRating from "./StarRating";
import { Download, TrendingUp, Shield } from "lucide-react";

interface EACardProps {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  platform: "MT4" | "MT5" | "Both";
  strategy: string;
  rating: number;
  reviewCount: number;
  downloads: number;
  price: number;
  profitFactor?: number;
  verified?: boolean;
}

export default function EACard({
  name,
  description,
  thumbnail,
  platform,
  strategy,
  rating,
  reviewCount,
  downloads,
  price,
  profitFactor,
  verified = false
}: EACardProps) {
  return (
    <Card className="hover-elevate overflow-hidden group" data-testid={`card-ea-${name.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="p-0">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img 
            src={thumbnail} 
            alt={name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          {verified && (
            <div className="absolute top-2 right-2 bg-primary/90 backdrop-blur rounded-full p-1.5">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-1" data-testid={`text-ea-name`}>{name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" data-testid="badge-platform">{platform}</Badge>
          <Badge variant="outline" data-testid="badge-strategy">{strategy}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <StarRating rating={rating} showCount count={reviewCount} size="sm" />
          {profitFactor && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>PF {profitFactor}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-2xl font-bold" data-testid="text-price">${price}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Download className="h-3 w-3" />
            {downloads.toLocaleString()} downloads
          </span>
        </div>
        <Button size="sm" data-testid="button-view-details">View Details</Button>
      </CardFooter>
    </Card>
  );
}
