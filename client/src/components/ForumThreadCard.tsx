import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Eye, TrendingUp, CheckCircle2, Coins, FileText, Activity, BarChart3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ForumThreadCardProps {
  id: string;
  title: string;
  excerpt: string;
  author: {
    name: string;
    avatar?: string;
    reputation: number;
  };
  category: string;
  replyCount: number;
  viewCount: number;
  coinsEarned?: number;
  isAnswered?: boolean;
  isPinned?: boolean;
  hasSetFile?: boolean;
  hasBacktest?: boolean;
  isLiveVerified?: boolean;
  lastActivity: Date;
}

const getCategoryStyles = (category: string) => {
  const categoryLower = category.toLowerCase();
  
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
  
  if (categoryLower.includes('news') || categoryLower.includes('update')) {
    return {
      borderColor: 'border-l-orange-500',
      badgeBg: 'bg-orange-100 dark:bg-orange-950',
      badgeText: 'text-orange-700 dark:text-orange-300',
      badgeBorder: 'border-orange-200 dark:border-orange-800'
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
  
  if (categoryLower.includes('algorithm') || categoryLower.includes('development')) {
    return {
      borderColor: 'border-l-indigo-500',
      badgeBg: 'bg-indigo-100 dark:bg-indigo-950',
      badgeText: 'text-indigo-700 dark:text-indigo-300',
      badgeBorder: 'border-indigo-200 dark:border-indigo-800'
    };
  }
  
  if (categoryLower.includes('backtest')) {
    return {
      borderColor: 'border-l-cyan-500',
      badgeBg: 'bg-cyan-100 dark:bg-cyan-950',
      badgeText: 'text-cyan-700 dark:text-cyan-300',
      badgeBorder: 'border-cyan-200 dark:border-cyan-800'
    };
  }
  
  return {
    borderColor: 'border-l-gray-400',
    badgeBg: 'bg-gray-100 dark:bg-gray-800',
    badgeText: 'text-gray-700 dark:text-gray-300',
    badgeBorder: 'border-gray-200 dark:border-gray-700'
  };
};

export default function ForumThreadCard({
  title,
  excerpt,
  author,
  category,
  replyCount,
  viewCount,
  coinsEarned = 0,
  isAnswered = false,
  isPinned = false,
  hasSetFile = false,
  hasBacktest = false,
  isLiveVerified = false,
  lastActivity
}: ForumThreadCardProps) {
  const categoryStyles = getCategoryStyles(category);
  
  return (
    <Card 
      className={`
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
      data-testid="card-forum-thread"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={author.avatar} />
            <AvatarFallback>{author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {isPinned && (
                <Badge variant="secondary" className="text-xs">Pinned</Badge>
              )}
              <Badge variant="outline" className="text-xs" data-testid="badge-category">{category}</Badge>
              {isAnswered && (
                <div className="flex items-center gap-1 text-xs text-primary">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Solved</span>
                </div>
              )}
              {isLiveVerified && (
                <Badge variant="default" className="text-xs bg-chart-3 hover:bg-chart-3">
                  <Activity className="h-3 w-3 mr-1" />
                  Live Verified
                </Badge>
              )}
              {hasSetFile && (
                <Badge variant="outline" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  Set File
                </Badge>
              )}
              {hasBacktest && (
                <Badge variant="outline" className="text-xs">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Backtest
                </Badge>
              )}
              {coinsEarned > 0 && (
                <div className="flex items-center gap-1 text-xs font-medium text-primary">
                  <Coins className="h-3 w-3" />
                  <span>+{coinsEarned}</span>
                </div>
              )}
            </div>
            
            <h3 className="font-semibold text-base mb-1 line-clamp-1" data-testid="text-thread-title">
              {title}
            </h3>
            
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {excerpt}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span data-testid="text-author">{author.name}</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>{author.reputation}</span>
              </div>
              <span>•</span>
              <span>{formatDistanceToNow(lastActivity, { addSuffix: true })}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1" data-testid="stat-replies">
            <MessageCircle className="h-4 w-4" />
            <span>{replyCount} replies</span>
          </div>
          <div className="flex items-center gap-1" data-testid="stat-views">
            <Eye className="h-4 w-4" />
            <span>{viewCount.toLocaleString()} views</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
