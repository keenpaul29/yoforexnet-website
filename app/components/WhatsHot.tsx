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

  // Get rank badge style based on position - more subtle with transparency
  const getRankStyle = (index: number) => {
    if (index === 0) return "bg-gradient-to-br from-yellow-500/20 to-orange-600/20 text-foreground border border-orange-300/30 dark:border-orange-600/30";
    if (index === 1) return "bg-gradient-to-br from-gray-400/15 to-gray-600/15 text-foreground border border-gray-300/30 dark:border-gray-600/30";
    if (index === 2) return "bg-gradient-to-br from-amber-600/20 to-amber-800/20 text-foreground border border-amber-300/30 dark:border-amber-600/30";
    return "bg-muted/40 text-foreground border border-border/50";
  };

  return (
    <Card className="overflow-hidden" data-testid="card-whats-hot">
      {/* Header with subtle gradient background */}
      <CardHeader className="pb-4 bg-gradient-to-r from-orange-500/5 via-red-500/5 to-pink-500/5 dark:from-orange-500/3 dark:via-red-500/3 dark:to-pink-500/3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2.5 text-xl">
            <Flame className="w-5 h-5 text-orange-500/70" />
            <span className="text-foreground font-semibold">
              What's Hot
            </span>
          </CardTitle>
          <Link href="/hot" data-testid="link-see-all-hot">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-orange-500/80 hover:text-orange-600 dark:text-orange-400/70"
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
              className="group relative flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:border-orange-200/50 dark:hover:border-orange-800/30 hover-elevate active-elevate-2 cursor-pointer transition-all duration-200"
              data-testid={`card-hot-${thread.id}`}
            >
              {/* Subtle gradient overlay on hover */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-500/3 to-red-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              {/* Ranking badge - subtle design */}
              <div className={`relative flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-sm font-semibold ${getRankStyle(index)} transition-transform group-hover:scale-105`}>
                {index + 1}
              </div>

              {/* Content Column */}
              <div className="relative flex-1 min-w-0 space-y-1.5">
                {/* Title */}
                <h4 
                  className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-orange-500/90 dark:group-hover:text-orange-400/80 transition-colors" 
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

              {/* Hot Badge - subtle design */}
              <div className="relative flex-shrink-0 self-start">
                <Badge 
                  variant="secondary" 
                  className="text-xs px-2 py-0.5 bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-300/30 dark:border-orange-600/30"
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
