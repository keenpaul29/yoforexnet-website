import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp, Eye, Clock, ArrowLeft, MessageSquare, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

type ContentType = 'thread' | 'ea' | 'indicator' | 'article' | 'source_code' | 'broker';

interface HotItem {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  categorySlug: string;
  views: number;
  createdAt: string;
  normalizedScore: number;
  author: {
    id?: string;
    username?: string;
    profileImageUrl?: string;
  };
  // Type-specific fields
  replyCount?: number;
  priceCoins?: number;
  isFree?: boolean;
  purchaseCount?: number;
  reviewCount?: number;
  overallRating?: number;
}

interface HotItemsData {
  items: HotItem[];
  lastUpdated: string;
}

async function getHotItems(): Promise<HotItemsData> {
  const apiUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3001';
  console.log('[API Config] Internal API URL:', apiUrl);
  const url = `${apiUrl}/api/hot?limit=50`;
  console.log('[SSR Fetch] Fetching:', url);
  
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch hot items');
  }

  return res.json();
}

export const metadata = {
  title: "What's Hot - Trending Content | YoForex",
  description: "Discover the hottest trading discussions, EAs, indicators, brokers, and content from the YoForex community.",
};

export default async function HotPage() {
  const data = await getHotItems();
  const hotItems = data.items || [];

  // Get rank badge style based on position - more subtle with transparency
  const getRankStyle = (index: number) => {
    if (index === 0) return "bg-gradient-to-br from-yellow-500/20 to-orange-600/20 text-foreground border border-orange-300/30 dark:border-orange-600/30";
    if (index === 1) return "bg-gradient-to-br from-gray-400/15 to-gray-600/15 text-foreground border border-gray-300/30 dark:border-gray-600/30";
    if (index === 2) return "bg-gradient-to-br from-amber-600/20 to-amber-800/20 text-foreground border border-amber-300/30 dark:border-amber-600/30";
    return "bg-muted/40 text-foreground border border-border/50";
  };

  // Get content type badge and icon
  const getContentTypeInfo = (type: ContentType) => {
    switch (type) {
      case 'thread':
        return { label: 'Discussion', icon: MessageSquare, color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300/30 dark:border-blue-600/30' };
      case 'ea':
        return { label: 'EA', icon: ShoppingCart, color: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-300/30 dark:border-green-600/30' };
      case 'indicator':
        return { label: 'Indicator', icon: TrendingUp, color: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-300/30 dark:border-purple-600/30' };
      case 'article':
        return { label: 'Article', icon: Eye, color: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-300/30 dark:border-indigo-600/30' };
      case 'source_code':
        return { label: 'Code', icon: ShoppingCart, color: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-300/30 dark:border-cyan-600/30' };
      case 'broker':
        return { label: 'Broker', icon: Star, color: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-300/30 dark:border-yellow-600/30' };
      default:
        return { label: 'Content', icon: Eye, color: 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-300/30 dark:border-gray-600/30' };
    }
  };

  // Get link URL based on content type
  const getItemLink = (item: HotItem) => {
    if (item.type === 'thread') return `/thread/${item.slug}`;
    if (item.type === 'broker') return `/brokers/${item.slug}`;
    return `/content/${item.slug}`;
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
          <Flame className="w-8 h-8 text-orange-500/70" />
          <h1 className="text-4xl font-bold text-foreground">
            What's Hot
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Trending content from the last 7 days - discussions, marketplace items, and brokers ranked by engagement
        </p>
      </div>

      {/* Hot Items List */}
      <div className="space-y-3">
        {hotItems.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No hot content at the moment. Check back soon!</p>
          </Card>
        ) : (
          hotItems.map((item, index) => {
            const contentTypeInfo = getContentTypeInfo(item.type);
            const Icon = contentTypeInfo.icon;
            
            return (
              <Link key={item.id} href={getItemLink(item)} data-testid={`link-hot-${item.id}`}>
                <Card className="group hover:border-orange-200/50 dark:hover:border-orange-800/30 hover-elevate active-elevate-2 cursor-pointer transition-all duration-200 overflow-hidden">
                  {/* Subtle gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/3 to-red-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                  
                  <CardContent className="p-4">
                    <div className="relative flex items-start gap-3">
                      {/* Ranking badge - subtle design */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center text-base font-semibold ${getRankStyle(index)} transition-transform group-hover:scale-105`}>
                        {index + 1}
                      </div>

                      {/* Content Column */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Title */}
                        <h3 
                          className="text-lg font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-orange-500/90 dark:group-hover:text-orange-400/80 transition-colors" 
                          data-testid={`text-hot-title-${item.id}`}
                        >
                          {item.title}
                        </h3>
                        
                        {/* Meta information */}
                        <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
                          <span className="truncate max-w-[150px]" data-testid={`text-hot-author-${item.id}`}>
                            by {item.author?.username || "Unknown"}
                          </span>
                          <span className="text-border">•</span>
                          
                          {/* Type-specific stats */}
                          {item.type === 'thread' && item.replyCount !== undefined && (
                            <>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                <span>{item.replyCount} replies</span>
                              </div>
                              <span className="text-border">•</span>
                            </>
                          )}
                          
                          {(item.type === 'ea' || item.type === 'indicator' || item.type === 'article' || item.type === 'source_code') && (
                            <>
                              {!item.isFree && item.priceCoins && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <span className="text-yellow-600 dark:text-yellow-400 font-semibold">🪙 {item.priceCoins} coins</span>
                                  </div>
                                  <span className="text-border">•</span>
                                </>
                              )}
                              {item.isFree && (
                                <>
                                  <Badge variant="secondary" className="text-xs bg-green-500/15 text-green-700 dark:text-green-400">
                                    Free
                                  </Badge>
                                  <span className="text-border">•</span>
                                </>
                              )}
                            </>
                          )}
                          
                          {item.type === 'broker' && item.overallRating !== undefined && (
                            <>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold">{(item.overallRating / 100).toFixed(1)}/5</span>
                                <span className="text-muted-foreground">({item.reviewCount} reviews)</span>
                              </div>
                              <span className="text-border">•</span>
                            </>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span data-testid={`text-hot-views-${item.id}`}>
                              {item.views?.toLocaleString() || 0} views
                            </span>
                          </div>
                          <span className="text-border">•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                        
                        {/* Content Type + Category Tags */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-2 py-0.5 ${contentTypeInfo.color}`}
                          >
                            <Icon className="w-3 h-3 mr-1" />
                            {contentTypeInfo.label}
                          </Badge>
                          
                          <Badge 
                            variant="outline" 
                            className="text-xs px-2 py-0 bg-muted/50 border-border/50 hover:bg-muted transition-colors"
                          >
                            {item.categorySlug}
                          </Badge>
                        </div>
                      </div>

                      {/* Hot Badge - subtle design */}
                      <div className="flex-shrink-0 self-start">
                        <Badge 
                          variant="secondary" 
                          className="text-xs px-2 py-1 bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-300/30 dark:border-orange-600/30"
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Hot
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>

      {/* Stats footer */}
      {hotItems.length > 0 && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Showing {hotItems.length} trending item{hotItems.length !== 1 ? 's' : ''} from the last 7 days
          <br />
          <span className="text-xs">Mixed content: Discussions, EAs, Indicators, Articles, Brokers - ranked by engagement</span>
        </div>
      )}
    </div>
  );
}
