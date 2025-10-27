import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { 
  User, 
  UserPlus, 
  UserMinus, 
  MessageSquare, 
  Shield, 
  Star,
  Coins,
  Trophy,
  FileText,
  Youtube,
  Instagram,
  Send,
  TrendingUp
} from "lucide-react";

export default function UserProfilePage() {
  const { username } = useParams();
  const { isAuthenticated } = useAuth();
  const { requireAuth, AuthPrompt } = useAuthPrompt("follow this user");
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("activity");

  // Fetch real user data by username
  const { data: userData } = useQuery({
    queryKey: ['/api/users/username', username],
    enabled: !!username,
  });

  // Fetch user badges (use userData.id when available, otherwise use a mock ID for now)
  const userId = (userData as any)?.id || 'mock-user-id';
  const { data: badges, isError } = useQuery<Array<{ id: string; name: string; description: string }>>({
    queryKey: ['/api/users', userId, 'badges'],
    enabled: !!userId && userId !== 'mock-user-id',
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const mockUser = {
    username: username || "TraderJohn",
    isVerifiedTrader: true,
    totalCoins: 12450,
    weeklyEarned: 340,
    rank: 15,
    reputation: 2890,
    joinedDate: new Date("2024-01-15"),
    followerCount: 234,
    followingCount: 89,
    postsCount: 156,
    uploadsCount: 23,
    youtubeUrl: "https://youtube.com/c/traderjohn",
    instagramHandle: "@traderjohn_fx",
    myfxbookLink: "https://www.myfxbook.com/members/traderjohn/portfolio",
  };

  const mockFollowers = Array.from({ length: 8 }, (_, i) => ({
    id: `follower-${i}`,
    username: `User${i + 1}`,
    reputation: Math.floor(Math.random() * 3000),
    isVerified: Math.random() > 0.7,
  }));

  const mockFollowing = Array.from({ length: 5 }, (_, i) => ({
    id: `following-${i}`,
    username: `TopTrader${i + 1}`,
    reputation: Math.floor(Math.random() * 5000) + 1000,
    isVerified: Math.random() > 0.5,
  }));

  const mockActivity = Array.from({ length: 6 }, (_, i) => ({
    id: `activity-${i}`,
    type: i % 3 === 0 ? "post" : i % 3 === 1 ? "upload" : "comment",
    title: `${i % 3 === 0 ? "New Thread: " : i % 3 === 1 ? "Uploaded: " : "Commented on: "}XAUUSD Trading Strategy ${i + 1}`,
    timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
    category: "Strategy Discussion",
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center mb-6">
                  <Avatar className="w-24 h-24 mb-4">
                    <AvatarFallback className="text-3xl">{mockUser.username[0]}</AvatarFallback>
                  </Avatar>
                  <h1 className="text-2xl font-bold mb-2" data-testid="text-username">
                    {mockUser.username}
                  </h1>
                  {badges && !isError && Array.isArray(badges) && badges.length > 0 && (
                    <div className="mb-3" data-testid="profile-badges">
                      <BadgeDisplay badges={badges} size="md" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span data-testid="text-reputation">{mockUser.reputation} reputation</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <Button 
                    className="w-full" 
                    variant={isFollowing ? "outline" : "default"}
                    onClick={() => requireAuth(() => setIsFollowing(!isFollowing))}
                    data-testid="button-follow-toggle"
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4 mr-2" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline" 
                    onClick={() => requireAuth(() => window.location.href = `/messages?user=${username}`)}
                    data-testid="button-send-message"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center py-4 border-y">
                    <div>
                      <div className="text-2xl font-bold" data-testid="text-posts-count">{mockUser.postsCount}</div>
                      <div className="text-xs text-muted-foreground">Posts</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold" data-testid="text-followers-count">{mockUser.followerCount}</div>
                      <div className="text-xs text-muted-foreground">Followers</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold" data-testid="text-following-count">{mockUser.followingCount}</div>
                      <div className="text-xs text-muted-foreground">Following</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Stats</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Rank</span>
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-primary" />
                          <span className="font-medium" data-testid="text-rank">#{mockUser.rank}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Coins</span>
                        <div className="flex items-center gap-1">
                          <Coins className="w-4 h-4 text-primary" />
                          <span className="font-medium" data-testid="text-coins">{mockUser.totalCoins.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Uploads</span>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span className="font-medium" data-testid="text-uploads">{mockUser.uploadsCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(mockUser.youtubeUrl || mockUser.instagramHandle || mockUser.myfxbookLink) && (
                    <div className="space-y-3 pt-4 border-t">
                      <h3 className="font-semibold text-sm">Social Links</h3>
                      <div className="space-y-2">
                        {mockUser.youtubeUrl && (
                          <a 
                            href={mockUser.youtubeUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm hover:text-primary"
                            data-testid="link-youtube"
                          >
                            <Youtube className="w-4 h-4 text-red-600" />
                            YouTube Channel
                          </a>
                        )}
                        {mockUser.instagramHandle && (
                          <a 
                            href={`https://instagram.com/${mockUser.instagramHandle.replace('@', '')}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm hover:text-primary"
                            data-testid="link-instagram"
                          >
                            <Instagram className="w-4 h-4 text-pink-600" />
                            {mockUser.instagramHandle}
                          </a>
                        )}
                        {mockUser.myfxbookLink && (
                          <a 
                            href={mockUser.myfxbookLink}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm hover:text-primary"
                            data-testid="link-myfxbook"
                          >
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            Myfxbook Profile
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="activity" data-testid="tab-activity">
                      <FileText className="w-4 h-4 mr-2" />
                      Activity
                    </TabsTrigger>
                    <TabsTrigger value="followers" data-testid="tab-followers">
                      <User className="w-4 h-4 mr-2" />
                      Followers
                    </TabsTrigger>
                    <TabsTrigger value="following" data-testid="tab-following">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Following
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab}>
                  <TabsContent value="activity" className="space-y-4">
                    {mockActivity.map((item) => (
                      <div 
                        key={item.id} 
                        className="p-4 border rounded-lg hover-elevate cursor-pointer"
                        data-testid={`activity-${item.id}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{item.title}</h4>
                          <Badge variant="outline">{item.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.timestamp.toLocaleDateString()} • {item.type}
                        </p>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="followers" className="space-y-3">
                    {mockFollowers.map((follower) => (
                      <div 
                        key={follower.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                        data-testid={`follower-${follower.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{follower.username[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{follower.username}</span>
                              {follower.isVerified && (
                                <Badge variant="secondary" className="text-xs">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {follower.reputation} reputation
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" data-testid={`button-view-profile-${follower.id}`}>
                          View Profile
                        </Button>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="following" className="space-y-3">
                    {mockFollowing.map((following) => (
                      <div 
                        key={following.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                        data-testid={`following-${following.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{following.username[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{following.username}</span>
                              {following.isVerified && (
                                <Badge variant="secondary" className="text-xs">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {following.reputation} reputation
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" data-testid={`button-view-profile-${following.id}`}>
                          View Profile
                        </Button>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <EnhancedFooter />
      <AuthPrompt />
    </div>
  );
}
