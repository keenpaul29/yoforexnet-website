import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star, Download, Eye, Coins } from "lucide-react";
import { Link } from "wouter";

interface FeaturedContent {
  id: string;
  type: "ea" | "indicator" | "article";
  title: string;
  description: string;
  imageUrl: string;
  author: string;
  rating: number;
  downloads: number;
  priceCoins: number;
  slug: string;
}

const featuredItems: FeaturedContent[] = [
  {
    id: "1",
    type: "ea",
    title: "Gold Hedger EA 2025 - MT5 No DLL",
    description: "Professional gold trading EA with advanced hedging strategy. No DLL required, works on any broker. Includes 6 months support and free updates.",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop",
    author: "TraderJohn",
    rating: 4.8,
    downloads: 1234,
    priceCoins: 500,
    slug: "gold-hedger-ea-2025-mt5-no-dll"
  },
  {
    id: "2",
    type: "indicator",
    title: "Smart Trend Indicator - Multi-Timeframe",
    description: "Advanced trend detection indicator with multi-timeframe analysis. Perfect for swing traders. Includes custom alerts and dashboard.",
    imageUrl: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&h=400&fit=crop",
    author: "TrendMaster",
    rating: 4.9,
    downloads: 2156,
    priceCoins: 300,
    slug: "smart-trend-indicator-multi-timeframe"
  },
  {
    id: "3",
    type: "article",
    title: "Complete Guide to EA Optimization for Gold Trading",
    description: "Learn professional optimization techniques used by top traders. Covers backtesting, forward testing, and live deployment strategies.",
    imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=400&fit=crop",
    author: "OptimizationPro",
    rating: 5.0,
    downloads: 892,
    priceCoins: 150,
    slug: "complete-guide-ea-optimization-gold-trading"
  }
];

export default function FeaturedCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const next = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
  };

  const prev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + featuredItems.length) % featuredItems.length);
  };

  const current = featuredItems[currentIndex];

  return (
    <Card className="relative overflow-hidden bg-card">
      <div className="relative h-[400px] md:h-[450px]">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${current.imageUrl})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
        </div>

        <div className="relative h-full flex items-center">
          <div className="container max-w-7xl mx-auto px-6">
            <div className="max-w-2xl space-y-6">
              <div className="flex items-center gap-2">
                <Badge variant="default" data-testid={`badge-featured-type-${current.type}`}>
                  {current.type === "ea" ? "Expert Advisor" : current.type === "indicator" ? "Indicator" : "Article"}
                </Badge>
                <Badge variant="outline" data-testid="badge-featured">
                  Featured
                </Badge>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-foreground" data-testid="text-carousel-title">
                {current.title}
              </h2>

              <p className="text-lg text-foreground/90" data-testid="text-carousel-description">
                {current.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-medium" data-testid="text-carousel-rating">{current.rating}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span data-testid="text-carousel-downloads">{current.downloads.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium" data-testid="text-carousel-price">{current.priceCoins} coins</span>
                </div>
                <span className="text-muted-foreground" data-testid="text-carousel-author">by {current.author}</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href={`/content/${current.slug}`} data-testid="link-carousel-view-details">
                  <Button size="lg" data-testid="button-view-details">
                    View Details
                  </Button>
                </Link>
                <Link href="/marketplace" data-testid="link-carousel-browse-all">
                  <Button size="lg" variant="outline" data-testid="button-browse-all">
                    Browse All
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 backdrop-blur hover:bg-background/70"
            onClick={prev}
            data-testid="button-carousel-prev"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 backdrop-blur hover:bg-background/70"
            onClick={next}
            data-testid="button-carousel-next"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {featuredItems.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? "w-8 bg-primary" : "w-2 bg-primary/30"
              }`}
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrentIndex(index);
              }}
              data-testid={`button-carousel-dot-${index}`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
