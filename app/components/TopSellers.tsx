"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Coins, TrendingUp, Code, Activity } from "lucide-react";
import Link from "next/link";

interface TopSeller {
  id: string;
  type: "ea" | "indicator";
  title: string;
  author: string;
  rating: number;
  sales: number;
  priceCoins: number;
  revenue: number;
  slug: string;
  postLogoUrl?: string | null;
}

const topSellers: TopSeller[] = [
  {
    id: "1",
    type: "ea",
    title: "Gold Hedger EA 2025",
    author: "TraderJohn",
    rating: 4.8,
    sales: 1234,
    priceCoins: 500,
    revenue: 617000,
    slug: "gold-hedger-ea-2025-mt5-no-dll",
    postLogoUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop"
  },
  {
    id: "2",
    type: "indicator",
    title: "Smart Trend Indicator",
    author: "TrendMaster",
    rating: 4.9,
    sales: 2156,
    priceCoins: 300,
    revenue: 646800,
    slug: "smart-trend-indicator-multi-timeframe",
    postLogoUrl: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=100&h=100&fit=crop"
  },
  {
    id: "3",
    type: "ea",
    title: "XAUUSD M1 Scalper Pro",
    author: "GoldScalper",
    rating: 4.7,
    sales: 892,
    priceCoins: 750,
    revenue: 669000,
    slug: "xauusd-m1-scalper-pro",
    postLogoUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop"
  },
  {
    id: "4",
    type: "indicator",
    title: "Smart Money Dashboard",
    author: "SMCTrader",
    rating: 4.9,
    sales: 1567,
    priceCoins: 400,
    revenue: 626800,
    slug: "smart-money-concepts-dashboard",
    postLogoUrl: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=100&h=100&fit=crop"
  },
  {
    id: "5",
    type: "ea",
    title: "BTCUSD Grid EA",
    author: "CryptoBot",
    rating: 4.6,
    sales: 567,
    priceCoins: 900,
    revenue: 510300,
    slug: "btcusd-high-frequency-grid-ea",
    postLogoUrl: null
  }
];

export default function TopSellers() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top Sellers
          </CardTitle>
          <Link href="/marketplace?sort=sales" data-testid="link-see-all-sellers">
            <Button variant="ghost" size="sm" data-testid="button-see-all-sellers">
              See All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {topSellers.map((item, index) => (
          <Link key={item.id} href={`/content/${item.slug}`} data-testid={`link-seller-${item.id}`}>
            <div className="flex gap-3 p-3 rounded-lg hover-elevate active-elevate-2 cursor-pointer" data-testid={`card-seller-${item.id}`}>
              <div className="flex-shrink-0 relative">
                {item.postLogoUrl ? (
                  <div className="relative w-10 h-10 rounded-md overflow-hidden">
                    <img 
                      src={item.postLogoUrl} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ${
                      index === 0 ? "bg-gradient-to-br from-yellow-500 to-yellow-600" :
                      index === 1 ? "bg-gradient-to-br from-gray-400 to-gray-500" :
                      index === 2 ? "bg-gradient-to-br from-orange-600 to-orange-700" :
                      "bg-gradient-to-br from-blue-500 to-blue-600"
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                ) : (
                  <div className="relative w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                    {item.type === "ea" ? (
                      <Code className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Activity className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ${
                      index === 0 ? "bg-gradient-to-br from-yellow-500 to-yellow-600" :
                      index === 1 ? "bg-gradient-to-br from-gray-400 to-gray-500" :
                      index === 2 ? "bg-gradient-to-br from-orange-600 to-orange-700" :
                      "bg-gradient-to-br from-blue-500 to-blue-600"
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-1 mb-1" data-testid={`text-seller-title-${item.id}`}>
                  {item.title}
                </h4>
                
                <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                  <span className="line-clamp-1" data-testid={`text-seller-author-${item.id}`}>{item.author}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    <span>{item.rating}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-xs font-medium text-yellow-600">
                    <Coins className="w-3 h-3" />
                    <span>{item.priceCoins}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {item.sales} sales
                  </Badge>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
