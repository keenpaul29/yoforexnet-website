"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, TrendingUp, Eye, Clock } from "lucide-react";
import Link from "next/link";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import type { ForumThread } from "../../shared/schema";
import { formatDistanceToNow } from "date-fns";

interface HotThreadsData {
  threads: (ForumThread & { author: { id?: string; username?: string; profileImageUrl?: string } })[];
  lastUpdated: string;
}

export default function WhatsHot() {
  // Auto-refresh hot threads every 30 seconds - limit to 5 items
  const { data, isLoading } = useRealtimeUpdates<HotThreadsData>('/api/threads/hot?limit=5', { interval: 30000 });

  // Hide component when loading or no threads
  if (isLoading && !data) {
    return null;
  }

  const trendingThreads = data?.threads || [];
  
  if (trendingThreads.length === 0) {
    return null;
  }

  // Get rank badge style based on position
  const getRankStyle = (index: number) => {
    if (index === 0) return "bg-gradient-to-br from-yellow-500 to-orange-600 text-white shadow-lg shadow-orange-500/30";
    if (index === 1) return "bg-gradient-to-br from-gray-400 to-gray-600 text-white shadow-md shadow-gray-500/20";
    if (index === 2) return "bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-md shadow-amber-600/20";
    return "bg-gradient-to-br from-muted to-muted/60 text-foreground border border-border";
  };

  return (
    <Card className="overflow-hidden border-2" data-testid="card-whats-hot">
      {/* Header with gradient background */}
      <CardHeader className="pb-4 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10 dark:from-orange-500/5 dark:via-red-500/5 dark:to-pink-500/5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2.5 text-xl">
            <div className="relative">
              <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
              <div className="absolute inset-0 w-6 h-6 text-orange-400 blur-sm animate-pulse" />
            </div>
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent font-bold">
              What's Hot
            </span>
          </CardTitle>
          <Link href="/hot" data-testid="link-see-all-hot">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/30"
              data-testid="button-see-all-hot"
            >
              See All
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pt-4">
        {trendingThreads.map((thread, index) => (
          <Link key={thread.id} href={`/thread/${thread.slug}`} data-testid={`link-hot-${thread.id}`}>
            <div 
              className="group relative flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:border-orange-300 dark:hover:border-orange-700 hover-elevate active-elevate-2 cursor-pointer transition-all duration-200"
              data-testid={`card-hot-${thread.id}`}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              {/* Ranking badge with gradient */}
              <div className={`relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${getRankStyle(index)} transition-transform group-hover:scale-110`}>
                {index + 1}
              </div>

              {/* Content Column */}
              <div className="relative flex-1 min-w-0 space-y-1.5">
                {/* Title with better typography */}
                <h4 
                  className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" 
                  data-testid={`text-hot-title-${thread.id}`}
                >
                  {thread.title}
                </h4>
                
                {/* Author & Views - cleaner layout */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="truncate max-w-[120px]" data-testid={`text-hot-author-${thread.id}`}>
                    by {thread.author?.username || "Unknown"}
                  </span>
                  <span className="text-border">•</span>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span data-testid={`text-hot-views-${thread.id}`}>
                      {thread.views?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
                
                {/* Bottom row: Time + Category */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(thread.createdAt!), { addSuffix: true })}</span>
                  </div>
                  
                  {/* Category Tag with better styling */}
                  <Badge 
                    variant="outline" 
                    className="text-xs px-2 py-0 bg-muted/50 border-border/50 hover:bg-muted transition-colors"
                  >
                    {thread.categorySlug}
                  </Badge>
                </div>
              </div>

              {/* Hot Badge - refined design */}
              <div className="relative flex-shrink-0 self-start">
                <Badge 
                  variant="secondary" 
                  className="text-xs px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-md hover:shadow-lg transition-shadow"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Hot
                </Badge>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
