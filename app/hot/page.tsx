import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp, Eye, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface ForumThread {
  id: string;
  title: string;
  slug: string;
  categorySlug: string;
  views: number;
  createdAt: string;
  engagementScore: number;
  author: {
    id?: string;
    username?: string;
    profileImageUrl?: string;
  };
}

interface HotThreadsData {
  threads: ForumThread[];
  lastUpdated: string;
}

async function getHotThreads(): Promise<HotThreadsData> {
  const apiUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001';
  console.log('[API Config] Internal API URL:', apiUrl);
  const url = `${apiUrl}/api/threads/hot?limit=50`;
  console.log('[SSR Fetch] Fetching:', url);
  
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch hot threads');
  }

  return res.json();
}

export const metadata = {
  title: "What's Hot - Trending Discussions | YoForex",
  description: "Discover the hottest trading discussions, strategies, and insights from the YoForex community.",
};

export default async function HotPage() {
  const data = await getHotThreads();
  const trendingThreads = data.threads || [];

  // Get rank badge style based on position
  const getRankStyle = (index: number) => {
    if (index === 0) return "bg-gradient-to-br from-yellow-500 to-orange-600 text-white shadow-lg shadow-orange-500/30";
    if (index === 1) return "bg-gradient-to-br from-gray-400 to-gray-600 text-white shadow-md shadow-gray-500/20";
    if (index === 2) return "bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-md shadow-amber-600/20";
    return "bg-gradient-to-br from-muted to-muted/60 text-foreground border border-border";
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Back button */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
            <div className="absolute inset-0 w-8 h-8 text-orange-400 blur-sm animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            What's Hot
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Trending discussions from the last 7 days, ranked by engagement
        </p>
      </div>

      {/* Hot Threads List */}
      <div className="space-y-3">
        {trendingThreads.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No hot threads at the moment. Check back soon!</p>
          </Card>
        ) : (
          trendingThreads.map((thread, index) => (
            <Link key={thread.id} href={`/thread/${thread.slug}`} data-testid={`link-hot-${thread.id}`}>
              <Card className="group hover:border-orange-300 dark:hover:border-orange-700 hover-elevate active-elevate-2 cursor-pointer transition-all duration-200 overflow-hidden">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                
                <CardContent className="p-4">
                  <div className="relative flex items-start gap-3">
                    {/* Ranking badge with gradient */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold ${getRankStyle(index)} transition-transform group-hover:scale-110`}>
                      {index + 1}
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Title */}
                      <h3 
                        className="text-lg font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" 
                        data-testid={`text-hot-title-${thread.id}`}
                      >
                        {thread.title}
                      </h3>
                      
                      {/* Meta information */}
                      <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
                        <span className="truncate max-w-[150px]" data-testid={`text-hot-author-${thread.id}`}>
                          by {thread.author?.username || "Unknown"}
                        </span>
                        <span className="text-border">•</span>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span data-testid={`text-hot-views-${thread.id}`}>
                            {thread.views?.toLocaleString() || 0} views
                          </span>
                        </div>
                        <span className="text-border">•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                      
                      {/* Category Tag */}
                      <div>
                        <Badge 
                          variant="outline" 
                          className="text-xs px-2 py-0 bg-muted/50 border-border/50 hover:bg-muted transition-colors"
                        >
                          {thread.categorySlug}
                        </Badge>
                      </div>
                    </div>

                    {/* Hot Badge */}
                    <div className="flex-shrink-0 self-start">
                      <Badge 
                        variant="secondary" 
                        className="text-xs px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-md hover:shadow-lg transition-shadow"
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Hot
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Stats footer */}
      {trendingThreads.length > 0 && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Showing {trendingThreads.length} trending discussion{trendingThreads.length !== 1 ? 's' : ''} from the last 7 days
        </div>
      )}
    </div>
  );
}
