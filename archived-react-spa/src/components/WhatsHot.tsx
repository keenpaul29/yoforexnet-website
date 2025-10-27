import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, TrendingUp, Eye } from "lucide-react";
import { Link } from "wouter";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import type { ForumThread } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface HotThreadsData {
  threads: (ForumThread & { author: { id?: string; username?: string; profileImageUrl?: string } })[];
  lastUpdated: string;
}

export default function WhatsHot() {
  // Auto-refresh hot threads every 30 seconds
  const { data, isLoading } = useRealtimeUpdates<HotThreadsData>('/api/threads/hot', { interval: 30000 });

  // Hide component when loading or no threads (prevents empty state trust issue)
  if (isLoading && !data) {
    return null;
  }

  const trendingThreads = data?.threads || [];
  
  if (trendingThreads.length === 0) {
    return null;
  }

  return (
    <Card data-testid="card-whats-hot">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            What's Hot
          </CardTitle>
          <Link href="/categories" data-testid="link-see-all-hot">
            <Button variant="ghost" size="sm" data-testid="button-see-all-hot">
              See All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {trendingThreads.map((thread, index) => (
            <Link key={thread.id} href={`/thread/${thread.slug}`} data-testid={`link-hot-${thread.id}`}>
              <div className="flex items-center gap-2 p-2 rounded-lg hover-elevate active-elevate-2 cursor-pointer" data-testid={`card-hot-${thread.id}`}>
                {/* Ranking badge */}
                <div className="flex-shrink-0 w-7 h-7 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm font-bold">
                  {index + 1}
                </div>

                {/* Content Column - COMPACT */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  {/* Title - REDUCED SIZE to 14px */}
                  <h4 className="text-sm font-semibold text-foreground line-clamp-1 leading-tight" data-testid={`text-hot-title-${thread.id}`}>
                    {thread.title}
                  </h4>
                  
                  {/* Meta Row - SINGLE LINE, SMALL at 12px */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground overflow-hidden">
                    <span className="truncate" data-testid={`text-hot-author-${thread.id}`}>
                      by {thread.author?.username || "Unknown"}
                    </span>
                    <span>•</span>
                    <div className="flex items-center gap-0.5">
                      <Eye className="w-3 h-3" />
                      <span data-testid={`text-hot-views-${thread.id}`}>
                        {thread.views?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                  
                  {/* Time - SMALL at 12px */}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(thread.createdAt!), { addSuffix: true })}
                  </p>
                  
                  {/* Category Tag - COMPACT */}
                  <Badge variant="outline" className="text-xs mt-0.5">
                    {thread.categorySlug}
                  </Badge>
                </div>

                {/* Hot Badge - RIGHT EDGE, COMPACT */}
                <div className="flex-shrink-0">
                  <Badge variant="secondary" className="text-xs">
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
