import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import type { ForumThread, ForumReply } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ThumbsUp, MessageSquare, CheckCircle2, Eye, Tag, ArrowLeft } from "lucide-react";
import { useState } from "react";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { BadgeDisplay } from "@/components/BadgeDisplay";

export default function ThreadDetailPage() {
  const [match, params] = useRoute("/thread/:slug");
  const { slug } = params || {};
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { requireAuth, AuthPrompt } = useAuthPrompt("reply to this thread");
  const [replyBody, setReplyBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Fetch thread by slug
  const { data: thread, isLoading: threadLoading } = useQuery<ForumThread>({
    queryKey: ["/api/threads/slug", slug],
    enabled: !!slug,
  });

  // Fetch replies
  const { data: replies = [], isLoading: repliesLoading } = useQuery<ForumReply[]>({
    queryKey: ["/api/threads", thread?.id, "replies"],
    enabled: !!thread?.id,
    refetchInterval: 15000, // Real-time updates every 15s
  });

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: (data: { body: string; parentId?: string }) => {
      if (!user?.id) {
        return Promise.reject(new Error("You must be logged in to reply"));
      }
      return apiRequest("POST", `/api/threads/${thread!.id}/replies`, {
        ...data,
        userId: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/threads", thread!.id, "replies"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/threads/slug", slug],
      });
      setReplyBody("");
      setReplyingTo(null);
      toast({ title: "Reply posted successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to post reply",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark reply as helpful
  const markHelpfulMutation = useMutation({
    mutationFn: (replyId: string) =>
      apiRequest("POST", `/api/replies/${replyId}/helpful`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/threads", thread!.id, "replies"],
      });
      toast({ title: "Marked as helpful!" });
    },
  });

  // Mark reply as accepted answer
  const markAcceptedMutation = useMutation({
    mutationFn: (replyId: string) =>
      apiRequest("POST", `/api/replies/${replyId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/threads", thread!.id, "replies"],
      });
      toast({ title: "Marked as accepted answer!" });
    },
  });

  if (!match) return null;

  if (threadLoading) {
    return (
      <div>
        <Header />
        <div className="container mx-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-muted rounded" />
              <div className="h-64 bg-muted rounded" />
            </div>
          </div>
        </div>
        <EnhancedFooter />
      </div>
    );
  }

  if (!thread) {
    return (
      <div>
        <Header />
        <div className="container mx-auto p-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-12 text-center">
                <h2 className="text-2xl font-bold mb-2">Thread not found</h2>
                <p className="text-muted-foreground mb-4">
                  The thread you're looking for doesn't exist.
                </p>
                <Button asChild>
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <EnhancedFooter />
      </div>
    );
  }

  const rootReplies = replies.filter((r) => !r.parentId);

  const handleSubmitReply = () => {
    if (!replyBody.trim()) {
      toast({
        title: "Reply cannot be empty",
        variant: "destructive",
      });
      return;
    }

    createReplyMutation.mutate({
      body: replyBody,
      ...(replyingTo && { parentId: replyingTo }),
    });
  };

  return (
    <div>
      <Header />
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <span>/</span>
            <Link
              href={`/category/${thread.categorySlug}`}
              className="hover:text-foreground"
            >
              {thread.categorySlug}
            </Link>
            <span>/</span>
            <span className="text-foreground">{thread.title}</span>
          </div>

          {/* Thread Header */}
          <Card data-testid={`card-thread-${thread.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-4" data-testid="text-thread-title">
                    {thread.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>
                          {((thread as any).authorUsername?.[0]?.toUpperCase()) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <Link
                        href={`/user/${(thread as any).authorUsername || 'unknown'}`}
                        className="hover:text-foreground font-medium"
                        data-testid="link-author"
                      >
                        {(thread as any).authorUsername || "Unknown"}
                      </Link>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span data-testid="text-views">{thread.views || 0} views</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span data-testid="text-replies">{thread.replyCount || 0} replies</span>
                    </div>
                    <span>•</span>
                    <span data-testid="text-date">
                      {formatDistanceToNow(new Date(thread.createdAt!), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {thread.isPinned && (
                    <Badge variant="secondary" data-testid="badge-pinned">
                      📌 Pinned
                    </Badge>
                  )}
                  <Badge variant="outline" data-testid={`badge-category-${thread.categorySlug}`}>
                    <Tag className="h-3 w-3 mr-1" />
                    {thread.categorySlug}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: thread.body || "" }}
                data-testid="text-thread-body"
              />
            </CardContent>
          </Card>

          {/* Reply Form */}
          <Card data-testid="card-reply-form">
            <CardHeader>
              <h2 className="text-xl font-bold">
                {replyingTo ? "Post a Reply to Comment" : "Post a Reply"}
              </h2>
              {replyingTo && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                  data-testid="button-cancel-reply"
                >
                  Cancel Reply
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Write your reply here..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={5}
                className="mb-4"
                data-testid="input-reply-body"
              />
              <Button
                onClick={() => requireAuth(handleSubmitReply)}
                disabled={createReplyMutation.isPending || !replyBody.trim()}
                data-testid="button-submit-reply"
              >
                {createReplyMutation.isPending ? "Posting..." : "Post Reply"}
              </Button>
            </CardContent>
          </Card>

          {/* Replies List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
            </h2>

            {repliesLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted rounded" />
                ))}
              </div>
            ) : rootReplies.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    No replies yet. Be the first to respond!
                  </p>
                </CardContent>
              </Card>
            ) : (
              rootReplies.map((reply) => (
                <ReplyCard
                  key={reply.id}
                  reply={reply}
                  allReplies={replies}
                  onReply={() => requireAuth(() => setReplyingTo(reply.id))}
                  onMarkHelpful={() => requireAuth(() => markHelpfulMutation.mutate(reply.id))}
                  onMarkAccepted={() => requireAuth(() => markAcceptedMutation.mutate(reply.id))}
                  isAuthor={thread.authorId === user?.id}
                />
              ))
            )}
          </div>
        </div>
      </div>
      <EnhancedFooter />
      <AuthPrompt />
    </div>
  );
}

function ReplyCard({
  reply,
  allReplies,
  onReply,
  onMarkHelpful,
  onMarkAccepted,
  isAuthor,
  depth = 0,
}: {
  reply: ForumReply;
  allReplies: ForumReply[];
  onReply: () => void;
  onMarkHelpful: () => void;
  onMarkAccepted: () => void;
  isAuthor: boolean;
  depth?: number;
}) {
  const children = allReplies.filter((r) => r.parentId === reply.id);

  const { data: badges, isError } = useQuery<Array<{ id: string; name: string; description: string }>>({
    queryKey: ['/api/users', reply.userId, 'badges'],
    enabled: !!reply.userId,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className={depth > 0 ? "ml-8 border-l-2 border-muted pl-4" : ""}>
      <Card
        className={reply.isAccepted ? "border-green-500 dark:border-green-700" : ""}
        data-testid={`card-reply-${reply.id}`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {((reply as any).authorUsername?.[0]?.toUpperCase()) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/user/${(reply as any).authorUsername || 'unknown'}`}
                    className="font-semibold hover:underline"
                    data-testid={`link-reply-author-${reply.id}`}
                  >
                    {(reply as any).authorUsername || "Unknown"}
                  </Link>
                  {badges && !isError && Array.isArray(badges) && badges.length > 0 && <BadgeDisplay badges={badges} size="sm" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(reply.createdAt!), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
            {reply.isAccepted && (
              <Badge variant="default" className="bg-green-600" data-testid={`badge-accepted-${reply.id}`}>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Accepted Answer
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="prose dark:prose-invert max-w-none mb-4"
            dangerouslySetInnerHTML={{ __html: reply.body || "" }}
            data-testid={`text-reply-body-${reply.id}`}
          />

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkHelpful}
              data-testid={`button-helpful-${reply.id}`}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Helpful ({reply.helpful || 0})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReply}
              data-testid={`button-reply-${reply.id}`}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Reply
            </Button>
            {isAuthor && !reply.isAccepted && (
              <Button
                variant="outline"
                size="sm"
                onClick={onMarkAccepted}
                data-testid={`button-accept-${reply.id}`}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark as Answer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Nested children */}
      {children.length > 0 && (
        <div className="mt-4 space-y-4">
          {children.map((child) => (
            <ReplyCard
              key={child.id}
              reply={child}
              allReplies={allReplies}
              onReply={onReply}
              onMarkHelpful={() => {}}
              onMarkAccepted={() => {}}
              isAuthor={isAuthor}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
