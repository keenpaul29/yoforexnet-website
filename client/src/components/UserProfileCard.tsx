import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, MessageCircle, Upload, Award } from "lucide-react";

interface UserProfileCardProps {
  name: string;
  username: string;
  avatar?: string;
  reputation: number;
  role?: "admin" | "moderator" | "verified";
  stats: {
    posts: number;
    threads: number;
    uploads: number;
    helpful: number;
  };
  joinDate: Date;
}

export default function UserProfileCard({
  name,
  username,
  avatar,
  reputation,
  role,
  stats,
  joinDate
}: UserProfileCardProps) {
  const getRoleBadge = () => {
    if (role === "admin") return <Badge variant="destructive">Admin</Badge>;
    if (role === "moderator") return <Badge variant="secondary">Moderator</Badge>;
    if (role === "verified") return <Badge variant="outline">Verified Trader</Badge>;
    return null;
  };

  return (
    <Card data-testid="card-user-profile">
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatar} />
            <AvatarFallback className="text-xl">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold mb-1" data-testid="text-user-name">{name}</h2>
            <p className="text-sm text-muted-foreground mb-2">@{username}</p>
            
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {getRoleBadge()}
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-medium" data-testid="text-reputation">{reputation.toLocaleString()}</span>
                <span className="text-muted-foreground">reputation</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Member since {joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-lg font-semibold" data-testid="text-post-count">{stats.posts}</div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-lg font-semibold" data-testid="text-upload-count">{stats.uploads}</div>
              <div className="text-xs text-muted-foreground">EAs Uploaded</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-lg font-semibold" data-testid="text-thread-count">{stats.threads}</div>
              <div className="text-xs text-muted-foreground">Threads</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-lg font-semibold" data-testid="text-helpful-count">{stats.helpful}</div>
              <div className="text-xs text-muted-foreground">Helpful</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1" data-testid="button-send-message">Message</Button>
          <Button size="sm" variant="outline" className="flex-1" data-testid="button-view-activity">View Activity</Button>
        </div>
      </CardContent>
    </Card>
  );
}
