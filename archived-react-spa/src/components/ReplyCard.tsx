import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, MessageCircle, TrendingUp, CheckCircle2, Coins } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface ReplyCardProps {
  id: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    reputation: number;
    role?: "admin" | "moderator" | "verified";
  };
  createdAt: Date;
  upvotes: number;
  coinsEarned?: number;
  isAnswer?: boolean;
}

export default function ReplyCard({
  content,
  author,
  createdAt,
  upvotes,
  coinsEarned = 0,
  isAnswer = false
}: ReplyCardProps) {
  const [votes, setVotes] = useState(upvotes);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = () => {
    if (hasVoted) {
      setVotes(votes - 1);
      setHasVoted(false);
    } else {
      setVotes(votes + 1);
      setHasVoted(true);
    }
  };

  const getRoleBadge = () => {
    if (author.role === "admin") return <Badge variant="destructive" className="text-xs">Admin</Badge>;
    if (author.role === "moderator") return <Badge variant="secondary" className="text-xs">Mod</Badge>;
    if (author.role === "verified") return <Badge variant="outline" className="text-xs">Verified</Badge>;
    return null;
  };

  return (
    <Card className={isAnswer ? "border-primary" : ""} data-testid="card-reply">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${hasVoted ? 'text-primary' : ''}`}
              onClick={handleVote}
              data-testid="button-upvote"
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium" data-testid="text-vote-count">{votes}</span>
            {coinsEarned > 0 && (
              <div className="flex flex-col items-center gap-1 mt-2">
                <Coins className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">+{coinsEarned}</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={author.avatar} />
                <AvatarFallback>{author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium text-sm" data-testid="text-reply-author">{author.name}</span>
                  {getRoleBadge()}
                  {isAnswer && (
                    <div className="flex items-center gap-1 text-xs text-primary">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Accepted Answer</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>{author.reputation}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(createdAt, { addSuffix: true })}
                </span>
              </div>
            </div>

            <div className="prose prose-sm max-w-none mb-3">
              <p className="text-sm leading-relaxed">{content}</p>
            </div>

            <Button variant="ghost" size="sm" className="h-8" data-testid="button-reply">
              <MessageCircle className="h-3 w-3 mr-1" />
              Reply
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
