import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, TrendingUp, CheckCircle2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { ForumThread } from "@shared/schema";

interface HighlightThread {
  id: string;
  title: string;
  category: string;
  author: string;
  replies: number;
  views: number;
  coins?: number;
  isAnswered?: boolean;
  lastActivity: Date;
}

interface WeekHighlightsProps {
  newThreads?: HighlightThread[];
  trendingThreads?: HighlightThread[];
  solvedThreads?: HighlightThread[];
}

const defaultNewThreads: HighlightThread[] = [
  {
    id: "1",
    title: "XAUUSD CPI/NFP handling: disable or reduce lots?",
    category: "Strategy Discussion",
    author: "NewsTrader",
    replies: 12,
    views: 890,
    coins: 23,
    lastActivity: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: "2",
    title: "BTCUSD weekend behavior: do you pause?",
    category: "Performance Reports",
    author: "CryptoWeekend",
    replies: 8,
    views: 456,
    coins: 15,
    lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000)
  },
  {
    id: "3",
    title: "Gold trailing at 1R/2R/3R steps: best size?",
    category: "EA Development (MQL4/5)",
    author: "TrailMaster",
    replies: 6,
    views: 234,
    coins: 12,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000)
  }
];

const defaultTrendingThreads: HighlightThread[] = [
  {
    id: "4",
    title: "EURUSD M5 London session: stable set-files",
    category: "EA Library",
    author: "LondonTrader",
    replies: 89,
    views: 5670,
    coins: 92,
    isAnswered: true,
    lastActivity: new Date(Date.now() - 3 * 60 * 60 * 1000)
  },
  {
    id: "5",
    title: "Gold H1 swing: 1:2 RRR with ATR stop",
    category: "Performance Reports",
    author: "SwingMaster",
    replies: 67,
    views: 4320,
    coins: 78,
    lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000)
  },
  {
    id: "6",
    title: "New to EA trading - where to start?",
    category: "Beginner Questions",
    author: "NewbieTom",
    replies: 134,
    views: 8900,
    coins: 56,
    isAnswered: true,
    lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000)
  }
];

const defaultSolvedThreads: HighlightThread[] = [
  {
    id: "7",
    title: "How to properly backtest an EA in MT4?",
    category: "Technical Support",
    author: "LearningTrader",
    replies: 45,
    views: 3210,
    coins: 41,
    isAnswered: true,
    lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000)
  },
  {
    id: "8",
    title: "Symbol suffix issues (.a, .pro, .ecn) fix?",
    category: "Technical Support",
    author: "SymbolFixer",
    replies: 28,
    views: 1890,
    coins: 34,
    isAnswered: true,
    lastActivity: new Date(Date.now() - 7 * 60 * 60 * 1000)
  },
  {
    id: "9",
    title: "Best scalping settings for EURUSD M5",
    category: "Strategy Discussion",
    author: "ScalpGuru",
    replies: 52,
    views: 2670,
    coins: 48,
    isAnswered: true,
    lastActivity: new Date(Date.now() - 8 * 60 * 60 * 1000)
  }
];

export default function WeekHighlights({ 
  newThreads = defaultNewThreads, 
  trendingThreads = defaultTrendingThreads, 
  solvedThreads = defaultSolvedThreads 
}: WeekHighlightsProps) {
  const [, navigate] = useLocation();

  // Fetch real trending threads from API
  const { data: trendingData } = useQuery<ForumThread[]>({
    queryKey: ['/api/threads', { sortBy: 'trending', limit: 3 }],
    queryFn: async () => {
      const res = await fetch('/api/threads?sortBy=trending&limit=3');
      if (!res.ok) throw new Error('Failed to fetch trending threads');
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch newest threads
  const { data: newData } = useQuery<ForumThread[]>({
    queryKey: ['/api/threads', { sortBy: 'newest', limit: 3 }],
    queryFn: async () => {
      const res = await fetch('/api/threads?sortBy=newest&limit=3');
      if (!res.ok) throw new Error('Failed to fetch newest threads');
      return res.json();
    },
    refetchInterval: 60000,
  });

  // Fetch solved threads (answered)
  const { data: solvedData } = useQuery<ForumThread[]>({
    queryKey: ['/api/threads', { sortBy: 'answered', limit: 3 }],
    queryFn: async () => {
      const res = await fetch('/api/threads?sortBy=answered&limit=3');
      if (!res.ok) throw new Error('Failed to fetch answered threads');
      return res.json();
    },
    refetchInterval: 60000,
  });

  // Store full thread data for navigation
  const threadsWithSlug = new Map<string, ForumThread>();
  
  newData?.forEach(thread => threadsWithSlug.set(thread.id, thread));
  trendingData?.forEach(thread => threadsWithSlug.set(thread.id, thread));
  solvedData?.forEach(thread => threadsWithSlug.set(thread.id, thread));

  // Convert API thread data to HighlightThread format
  const convertToHighlightThread = (thread: ForumThread): HighlightThread => {
    // Safely handle lastActivityAt - use createdAt as fallback
    let lastActivity: Date;
    try {
      lastActivity = thread.lastActivityAt 
        ? new Date(thread.lastActivityAt) 
        : new Date(thread.createdAt);
      // Check if date is valid
      if (isNaN(lastActivity.getTime())) {
        lastActivity = new Date(thread.createdAt);
      }
    } catch {
      lastActivity = new Date(thread.createdAt);
    }

    return {
      id: thread.id,
      title: thread.title,
      category: thread.categorySlug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      author: thread.authorId, // Will show authorId until we have user names
      replies: thread.replyCount,
      views: thread.views,
      coins: 0, // Not tracked in current schema
      isAnswered: false, // TODO: Check if thread has accepted replies
      lastActivity
    };
  };

  // Use real API data if available AND not empty, fallback to defaults
  const displayNewThreads = newData && newData.length > 0 ? newData.map(convertToHighlightThread) : newThreads;
  const displayTrendingThreads = trendingData && trendingData.length > 0 ? trendingData.map(convertToHighlightThread) : trendingThreads;
  const displaySolvedThreads = solvedData && solvedData.length > 0 ? solvedData.map(convertToHighlightThread) : solvedThreads;

  const handleThreadClick = (thread: HighlightThread) => {
    // Try to get the slug from the full thread data
    const fullThread = threadsWithSlug.get(thread.id);
    if (fullThread?.slug) {
      navigate(`/thread/${fullThread.slug}`);
    } else {
      // Fallback to ID-based navigation (will need backend support)
      navigate(`/thread/${thread.id}`);
    }
  };

  const renderThreadList = (threads: HighlightThread[]) => (
    <div className="space-y-3">
      {threads.map((thread) => (
        <div 
          key={thread.id} 
          className="flex items-start gap-3 p-3 rounded-lg hover-elevate active-elevate-2 cursor-pointer" 
          data-testid={`highlight-thread-${thread.id}`}
          onClick={() => handleThreadClick(thread)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className="text-xs" data-testid={`badge-category-${thread.id}`}>
                {thread.category}
              </Badge>
              {thread.isAnswered && (
                <div className="flex items-center gap-1 text-xs text-primary" data-testid={`badge-solved-${thread.id}`}>
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Solved</span>
                </div>
              )}
            </div>
            <h4 className="text-sm font-medium line-clamp-1 mb-1" data-testid={`text-title-${thread.id}`}>
              {thread.title}
            </h4>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span data-testid={`text-author-${thread.id}`}>{thread.author}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                <span data-testid={`text-replies-${thread.id}`}>{thread.replies}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span data-testid={`text-views-${thread.id}`}>{thread.views.toLocaleString()}</span>
              </div>
              <span>•</span>
              <span>{formatDistanceToNow(thread.lastActivity, { addSuffix: true })}</span>
            </div>
          </div>
          {thread.coins && thread.coins > 0 && (
            <Badge variant="secondary" className="text-xs" data-testid={`badge-coins-${thread.id}`}>
              +{thread.coins}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Card data-testid="card-week-highlights">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">This Week's Highlights</h3>
        </div>
        
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="new" data-testid="tab-new">New</TabsTrigger>
            <TabsTrigger value="trending" data-testid="tab-trending">Trending</TabsTrigger>
            <TabsTrigger value="solved" data-testid="tab-solved">Solved</TabsTrigger>
          </TabsList>
          <TabsContent value="new" className="mt-4">
            {renderThreadList(displayNewThreads)}
          </TabsContent>
          <TabsContent value="trending" className="mt-4">
            {renderThreadList(displayTrendingThreads)}
          </TabsContent>
          <TabsContent value="solved" className="mt-4">
            {renderThreadList(displaySolvedThreads)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
