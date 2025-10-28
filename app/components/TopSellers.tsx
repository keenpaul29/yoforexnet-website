"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Star, Coins, TrendingUp } from "lucide-react";
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
  const getRankBadge = (index: number) => {
    const badges = [
      { bg: "bg-amber-500", text: "text-white" },
      { bg: "bg-slate-400", text: "text-white" },
      { bg: "bg-orange-600", text: "text-white" },
      { bg: "bg-blue-500", text: "text-white" },
      { bg: "bg-indigo-500", text: "text-white" },
    ];
    const badge = badges[index] || badges[4];
    return (
      <div className={`absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center ${badge.bg} ${badge.text} text-[10px] font-bold shadow-sm`}>
        {index + 1}
      </div>
    );
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Top Sellers
          </CardTitle>
          <Link href="/marketplace?sort=sales" data-testid="link-see-all-sellers">
            <Button variant="ghost" size="sm" className="h-7 text-xs" data-testid="button-see-all-sellers">
              See All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {topSellers.map((item, index) => (
          <Link key={item.id} href={`/content/${item.slug}`} data-testid={`link-seller-${item.id}`}>
            <div className="flex items-center gap-3 py-2 px-2.5 rounded-lg hover-elevate active-elevate-2 cursor-pointer" data-testid={`card-seller-${item.id}`}>
              <div className="flex-shrink-0 relative">
                <Avatar className="w-10 h-10 rounded-md">
                  <AvatarImage src={item.postLogoUrl || undefined} alt={item.title} />
                  <AvatarFallback className="rounded-md bg-muted text-muted-foreground text-xs">
                    {item.title.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {getRankBadge(index)}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-1" data-testid={`text-seller-title-${item.id}`}>
                  {item.title}
                </h4>
                
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground line-clamp-1" data-testid={`text-seller-author-${item.id}`}>
                    {item.author}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span className="text-xs text-foreground font-medium">{item.rating}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                  <Coins className="w-3 h-3" />
                  <span>{item.priceCoins}</span>
                </div>
                <Badge variant="secondary" className="text-[11px] h-5 px-1.5 font-normal">
                  <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                  {item.sales} sales
                </Badge>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
