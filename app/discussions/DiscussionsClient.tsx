"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Eye, CheckCircle, TrendingUp, Award, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Thread = {
  id: string;
  title: string;
  body: string;
  slug: string;
  categorySlug: string;
  authorId: string;
  views: number;
  replyCount: number;
  isPinned: boolean;
  isLocked?: boolean;
  createdAt: string;
  lastActivityAt: string;
  author?: {
    username: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    rank?: number;
  };
};

interface DiscussionsClientProps {
  initialThreads: Thread[];
}

export default function DiscussionsClient({ initialThreads }: DiscussionsClientProps) {
  const { isAuthenticated, login } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("latest");

  // Use React Query with initialData and queryFn for refetching
  const { data: threads, isLoading } = useQuery<Thread[]>({
    queryKey: ['/api/forum/threads'],
    initialData: initialThreads,
    queryFn: async () => {
      const res = await fetch('/api/forum/threads?sort=latest&limit=50', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch threads');
      return res.json();
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Extract unique categories from threads
  const categories = useMemo(() => {
    if (!threads) return [];
    const uniqueCategories = new Set(threads.map(t => t.categorySlug));
    return Array.from(uniqueCategories);
  }, [threads]);

  // Filter and sort threads client-side
  const filteredThreads = useMemo(() => {
    if (!threads) return [];

    let filtered = [...threads];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(thread => 
        thread.title.toLowerCase().includes(query) || 
        thread.body.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(thread => thread.categorySlug === categoryFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
      case 'views':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'replies':
        filtered.sort((a, b) => b.replyCount - a.replyCount);
        break;
      case 'latest':
      default:
        filtered.sort((a, b) => 
          new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
        );
        break;
    }

    // Pinned threads always at top
    const pinned = filtered.filter(t => t.isPinned);
    const regular = filtered.filter(t => !t.isPinned);
    return [...pinned, ...regular];
  }, [threads, searchQuery, categoryFilter, sortBy]);

  const getCategoryStyles = (categorySlug: string) => {
    const categoryLower = categorySlug.toLowerCase();
    
    if (categoryLower.includes('strategy') || categoryLower.includes('discussion')) {
      return {
        borderColor: 'border-l-blue-500',
        badgeBg: 'bg-blue-100 dark:bg-blue-950',
        badgeText: 'text-blue-700 dark:text-blue-300',
        badgeBorder: 'border-blue-200 dark:border-blue-800'
      };
    }
    
    if (categoryLower.includes('performance') || categoryLower.includes('report')) {
      return {
        borderColor: 'border-l-green-500',
        badgeBg: 'bg-green-100 dark:bg-green-950',
        badgeText: 'text-green-700 dark:text-green-300',
        badgeBorder: 'border-green-200 dark:border-green-800'
      };
    }
    
    if (categoryLower.includes('ea') || categoryLower.includes('library')) {
      return {
        borderColor: 'border-l-purple-500',
        badgeBg: 'bg-purple-100 dark:bg-purple-950',
        badgeText: 'text-purple-700 dark:text-purple-300',
        badgeBorder: 'border-purple-200 dark:border-purple-800'
      };
    }
    
    if (categoryLower.includes('beginner') || categoryLower.includes('question')) {
      return {
        borderColor: 'border-l-orange-500',
        badgeBg: 'bg-orange-100 dark:bg-orange-950',
        badgeText: 'text-orange-700 dark:text-orange-300',
        badgeBorder: 'border-orange-200 dark:border-orange-800'
      };
    }
    
    if (categoryLower.includes('support') || categoryLower.includes('technical')) {
      return {
        borderColor: 'border-l-red-500',
        badgeBg: 'bg-red-100 dark:bg-red-950',
        badgeText: 'text-red-700 dark:text-red-300',
        badgeBorder: 'border-red-200 dark:border-red-800'
      };
    }
    
    return {
      borderColor: 'border-l-gray-400',
      badgeBg: 'bg-gray-100 dark:bg-gray-800',
      badgeText: 'text-gray-700 dark:text-gray-300',
      badgeBorder: 'border-gray-200 dark:border-gray-700'
    };
  };

  const formatCategoryName = (slug: string) => {
    return slug.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleNewThread = () => {
    if (!isAuthenticated) {
      login();
    } else {
      window.location.href = '/publish';
    }
  };

  if (isLoading) {
    return (
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="container max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-discussions">Recent Discussions</h1>
          <p className="text-muted-foreground">
            Latest active threads from the community
          </p>
        </div>
        <Button onClick={handleNewThread} data-testid="button-new-thread">
          <Plus className="w-4 h-4 mr-2" />
          New Thread
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search discussions..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-discussions"
            />
          </div>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger data-testid="select-category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {formatCategoryName(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest Activity</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="replies">Most Replies</SelectItem>
              <SelectItem value="views">Most Views</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Thread List */}
      <div className="space-y-0">
        {filteredThreads && filteredThreads.length > 0 ? (
          filteredThreads.map(thread => {
            const categoryStyles = getCategoryStyles(thread.categorySlug);
            return (
              <Link key={thread.id} href={`/thread/${thread.slug}`}>
                <Card 
                  className={`
                    p-6 
                    bg-gray-50 dark:bg-gray-900/50 
                    border border-gray-200 dark:border-gray-800 
                    ${categoryStyles.borderColor} border-l-4 
                    rounded-lg 
                    mb-3 
                    hover:bg-gray-100 dark:hover:bg-gray-900/70 
                    hover:shadow-md 
                    hover:scale-[1.01] 
                    transition-all 
                    cursor-pointer
                    overflow-visible
                  `} 
                  data-testid={`thread-${thread.slug}`}
                >
                  <div className="flex gap-4">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={thread.author?.profileImageUrl} />
                      <AvatarFallback>
                        {thread.author?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {thread.isPinned && (
                          <Badge variant="secondary" className="shrink-0" data-testid={`badge-pinned-${thread.slug}`}>
                            Pinned
                          </Badge>
                        )}
                        {thread.isLocked && (
                          <Badge variant="secondary" className="shrink-0" data-testid={`badge-locked-${thread.slug}`}>
                            Locked
                          </Badge>
                        )}
                        <Badge variant="outline" className="shrink-0" data-testid={`badge-category-${thread.slug}`}>
                          {formatCategoryName(thread.categorySlug)}
                        </Badge>
                        {thread.replyCount > 20 && (
                          <Badge variant="outline" className="shrink-0">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Solved
                          </Badge>
                        )}
                        {thread.views > 2000 && (
                          <Badge variant="outline" className="shrink-0">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                      </div>

                      <h2 className="text-lg font-semibold mb-2 line-clamp-2" data-testid={`text-thread-title-${thread.slug}`}>
                        {thread.title}
                      </h2>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {thread.body.substring(0, 200)}...
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1" data-testid={`text-author-${thread.slug}`}>
                          <span className="font-medium">
                            {thread.author?.username || 'Unknown'}
                          </span>
                          {thread.author?.rank && thread.author.rank <= 20 && (
                            <Award className="w-3 h-3 text-yellow-600" />
                          )}
                        </div>

                        <div className="flex items-center gap-1" data-testid={`text-replies-${thread.slug}`}>
                          <MessageSquare className="w-4 h-4" />
                          <span>{thread.replyCount} replies</span>
                        </div>

                        <div className="flex items-center gap-1" data-testid={`text-views-${thread.slug}`}>
                          <Eye className="w-4 h-4" />
                          <span>{thread.views.toLocaleString()} views</span>
                        </div>

                        <div className="flex items-center gap-1" data-testid={`text-time-${thread.slug}`}>
                          <span>
                            {formatDistanceToNow(new Date(thread.lastActivityAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })
        ) : (
          <Card className="p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No discussions found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || categoryFilter !== "all" 
                ? 'Try adjusting your filters to find more discussions.'
                : 'Be the first to start a conversation!'}
            </p>
            <Button onClick={handleNewThread} data-testid="button-start-discussion">
              <Plus className="w-4 h-4 mr-2" />
              Start a Discussion
            </Button>
          </Card>
        )}
      </div>
    </main>
  );
}
