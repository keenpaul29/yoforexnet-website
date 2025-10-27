"use client";

import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { 
  Trophy, 
  Coins,
  TrendingUp,
  Upload,
  Star,
  Award,
  Crown,
  Medal,
  Target
} from "lucide-react";

interface LeaderboardUser extends User {
  contributionCount?: number;
  uploadCount?: number;
}

interface MembersClientProps {
  initialData: {
    topByCoins: LeaderboardUser[];
    topByContributions: LeaderboardUser[];
    topByUploads: LeaderboardUser[];
  };
}

export default function MembersClient({ initialData }: MembersClientProps) {
  const { data: topByCoins, isLoading: coinsLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard', 'coins'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard?sortBy=coins&limit=50', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    initialData: initialData.topByCoins,
    refetchInterval: 30000, // Update every 30s
  });

  const { data: topByContributions, isLoading: contributionsLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard', 'contributions'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard?sortBy=contributions&limit=50', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    initialData: initialData.topByContributions,
    refetchInterval: 30000,
  });

  const { data: topByUploads, isLoading: uploadsLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard', 'uploads'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard?sortBy=uploads&limit=50', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    initialData: initialData.topByUploads,
    refetchInterval: 30000,
  });

  const renderLeaderboardCard = (user: LeaderboardUser, index: number, type: 'coins' | 'contributions' | 'uploads') => {
    const getRankBadge = (rank: number) => {
      if (rank === 1) return { icon: Crown, variant: "default" as const, color: "text-yellow-500" };
      if (rank === 2) return { icon: Medal, variant: "secondary" as const, color: "text-gray-400" };
      if (rank === 3) return { icon: Medal, variant: "outline" as const, color: "text-orange-600" };
      return { icon: Trophy, variant: "outline" as const, color: "text-muted-foreground" };
    };

    const { icon: RankIcon, variant, color } = getRankBadge(index + 1);
    
    const getStatValue = () => {
      if (type === 'coins') return user.totalCoins.toLocaleString();
      if (type === 'contributions') return user.contributionCount?.toLocaleString() || '0';
      if (type === 'uploads') return user.uploadCount?.toLocaleString() || '0';
      return '0';
    };

    const getStatLabel = () => {
      if (type === 'coins') return 'coins';
      if (type === 'contributions') return 'contributions';
      if (type === 'uploads') return 'uploads';
      return '';
    };

    return (
      <Card key={user.id} className="hover-elevate active-elevate-2" data-testid={`card-member-${user.id}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="relative">
                <Badge variant={variant} className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center p-0 ${color}`}>
                  {index < 3 ? <RankIcon className="w-4 h-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
                </Badge>
                <Avatar className="w-14 h-14">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <Link href={`/user/${user.username}`} data-testid={`link-user-${user.id}`}>
                <h3 className="font-semibold text-lg hover:text-primary" data-testid={`text-username-${user.id}`}>
                  {user.username}
                </h3>
              </Link>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-sm text-muted-foreground">
                  Rank #{user.rank || index + 1}
                </span>
                {index < 10 && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    Top 10
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold" data-testid={`stat-value-${user.id}`}>
                {getStatValue()}
              </p>
              <p className="text-xs text-muted-foreground">{getStatLabel()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-members">Community Members</h1>
          <p className="text-muted-foreground">
            Top contributors, traders, and developers in the YoForex community
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Top Earner
              </CardTitle>
            </CardHeader>
            <CardContent>
              {coinsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-top-earner-coins">
                    {topByCoins?.[0]?.totalCoins.toLocaleString() || 0} coins
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="stat-top-earner-name">
                    {topByCoins?.[0]?.username || 'N/A'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-primary" />
                Most Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contributionsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-most-active-count">
                    {topByContributions?.[0]?.contributionCount?.toLocaleString() || 0} posts
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="stat-most-active-name">
                    {topByContributions?.[0]?.username || 'N/A'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="w-5 h-5 text-chart-3" />
                Top Publisher
              </CardTitle>
            </CardHeader>
            <CardContent>
              {uploadsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-top-publisher-count">
                    {topByUploads?.[0]?.uploadCount?.toLocaleString() || 0} uploads
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="stat-top-publisher-name">
                    {topByUploads?.[0]?.username || 'N/A'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Tabs */}
        <Tabs defaultValue="coins" className="space-y-6">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 gap-2">
            <TabsTrigger value="coins" className="gap-2" data-testid="tab-coins">
              <Coins className="w-4 h-4" />
              <span className="hidden sm:inline">Top by Coins</span>
              <span className="sm:hidden">Coins</span>
            </TabsTrigger>
            <TabsTrigger value="contributions" className="gap-2" data-testid="tab-contributions">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Top Contributors</span>
              <span className="sm:hidden">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="uploads" className="gap-2" data-testid="tab-uploads">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Top Publishers</span>
              <span className="sm:hidden">Uploads</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coins" className="space-y-4" data-testid="content-coins-leaderboard">
            {coinsLoading ? (
              Array(10).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)
            ) : topByCoins && topByCoins.length > 0 ? (
              topByCoins.map((user, index) => renderLeaderboardCard(user, index, 'coins'))
            ) : (
              <Card className="p-12 text-center">
                <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No members yet</h3>
                <p className="text-sm text-muted-foreground">
                  Start earning coins to appear on the leaderboard!
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="contributions" className="space-y-4" data-testid="content-contributions-leaderboard">
            {contributionsLoading ? (
              Array(10).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)
            ) : topByContributions && topByContributions.length > 0 ? (
              topByContributions.map((user, index) => renderLeaderboardCard(user, index, 'contributions'))
            ) : (
              <Card className="p-12 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                <p className="text-sm text-muted-foreground">
                  Start contributing to the community to appear here!
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="uploads" className="space-y-4" data-testid="content-uploads-leaderboard">
            {uploadsLoading ? (
              Array(10).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)
            ) : topByUploads && topByUploads.length > 0 ? (
              topByUploads.map((user, index) => renderLeaderboardCard(user, index, 'uploads'))
            ) : (
              <Card className="p-12 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No uploads yet</h3>
                <p className="text-sm text-muted-foreground">
                  Publish your first EA or indicator to appear here!
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <Card className="mt-12 bg-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-bold mb-2">Want to climb the leaderboard?</h3>
            <p className="text-muted-foreground mb-6">
              Earn coins by contributing to the community, publishing quality content, and helping fellow traders
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/marketplace">
                <Button size="lg" data-testid="button-publish-content">
                  <Upload className="w-4 h-4 mr-2" />
                  Publish Content
                </Button>
              </Link>
              <Link href="/earn-coins">
                <Button variant="outline" size="lg" data-testid="button-earn-coins">
                  <Coins className="w-4 h-4 mr-2" />
                  Learn How to Earn
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <EnhancedFooter />
    </div>
  );
}
