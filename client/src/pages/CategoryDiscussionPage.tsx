import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import type { ForumThread, ForumCategory } from "@shared/schema";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import ForumThreadCard from "@/components/ForumThreadCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import { 
  MessageSquare, 
  FileText,
  Plus,
  TrendingUp,
  Clock,
  Star
} from "lucide-react";

export default function CategoryDiscussionPage() {
  const [match, params] = useRoute("/category/:slug");
  const { requireAuth, AuthPrompt, isAuthenticated } = useAuthPrompt("create a thread");

  const { data: category, isLoading: categoryLoading } = useQuery<ForumCategory>({
    queryKey: ['/api/categories', params?.slug],
    enabled: !!params?.slug,
  });

  const { data: threads, isLoading: threadsLoading } = useQuery<ForumThread[]>({
    queryKey: ['/api/categories', params?.slug, 'threads'],
    enabled: !!params?.slug,
    refetchInterval: 15000, // Real-time updates every 15s
  });

  const isLoading = categoryLoading || threadsLoading;

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-2">Category Not Found</h2>
          <p className="text-muted-foreground mb-4">The category you're looking for doesn't exist.</p>
          <Link href="/categories">
            <Button>Browse Categories</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-24 w-full mb-8" />
          <div className="space-y-4">
            {Array(8).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {/* Category Header */}
        <Card className="mb-8" data-testid="card-category-header">
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <CardTitle className="text-2xl" data-testid="heading-category-name">
                    {category?.name}
                  </CardTitle>
                  <Badge variant="secondary" data-testid="badge-active-status">
                    Active
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4" data-testid="text-category-description">
                  {category?.description}
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span data-testid="stat-thread-count">
                      <strong>{(category?.threadCount ?? 0).toLocaleString()}</strong> threads
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span data-testid="stat-post-count">
                      <strong>{(category?.postCount ?? 0).toLocaleString()}</strong> posts
                    </span>
                  </div>
                </div>
              </div>
              <Button 
                size="default" 
                data-testid="button-create-thread"
                onClick={() => requireAuth(() => {
                  // Navigate to publish page for thread creation
                  window.location.href = '/publish';
                })}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Thread
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Filter/Sort Options */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" data-testid="filter-latest">
              <Clock className="w-4 h-4 mr-2" />
              Latest
            </Button>
            <Button variant="ghost" size="sm" data-testid="filter-trending">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </Button>
            <Button variant="ghost" size="sm" data-testid="filter-answered">
              <Star className="w-4 h-4 mr-2" />
              Answered
            </Button>
          </div>
          <p className="text-sm text-muted-foreground" data-testid="text-thread-count">
            Showing {threads?.length || 0} threads
          </p>
        </div>

        {/* Thread List */}
        <div className="space-y-4">
          {threads && threads.length > 0 ? (
            threads.map((thread) => (
              <Link key={thread.id} href={`/thread/${thread.slug}`} data-testid={`link-thread-${thread.id}`}>
                <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid={`card-thread-${thread.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-lg" data-testid={`text-thread-title-${thread.id}`}>
                            {thread.title}
                          </h3>
                          {thread.isPinned && (
                            <Badge variant="secondary" data-testid={`badge-pinned-${thread.id}`}>
                              Pinned
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-thread-description-${thread.id}`}>
                          {thread.metaDescription}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            <span data-testid={`stat-reply-count-${thread.id}`}>{thread.replyCount} replies</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span data-testid={`stat-view-count-${thread.id}`}>{thread.views} views</span>
                          </span>
                          <span data-testid={`text-last-activity-${thread.id}`}>
                            Last activity: {new Date(thread.lastActivityAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="p-12 text-center" data-testid="card-no-threads">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No threads yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Be the first to start a discussion in this category!
              </p>
              <Button data-testid="button-create-first-thread">
                <Plus className="w-4 h-4 mr-2" />
                Create First Thread
              </Button>
            </Card>
          )}
        </div>

        {/* Pagination Placeholder */}
        {threads && threads.length > 20 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button variant="outline" size="sm" disabled data-testid="button-prev-page">
              Previous
            </Button>
            <Button variant="outline" size="sm" data-testid="button-page-1">1</Button>
            <Button variant="ghost" size="sm" data-testid="button-page-2">2</Button>
            <Button variant="ghost" size="sm" data-testid="button-page-3">3</Button>
            <Button variant="outline" size="sm" data-testid="button-next-page">
              Next
            </Button>
          </div>
        )}
      </main>

      <EnhancedFooter />
      <AuthPrompt />
    </div>
  );
}
