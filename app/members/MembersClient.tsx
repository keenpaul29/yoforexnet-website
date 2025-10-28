"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Users,
  Search,
  Filter,
  Calendar,
  Activity,
  MessageSquare,
  Target,
  Flame,
  Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  const [searchTerm, setSearchTerm] = useState("");

  const { data: topByCoins, isLoading: coinsLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard', 'coins'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard?type=coins&limit=50', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    initialData: initialData.topByCoins,
    refetchInterval: 30000,
  });

  const { data: topByContributions, isLoading: contributionsLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard', 'contributions'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard?type=contributions&limit=50', {
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
      const res = await fetch('/api/leaderboard?type=uploads&limit=50', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    initialData: initialData.topByUploads,
    refetchInterval: 30000,
  });

  // Filter users by search term
  const filterUsers = (users: LeaderboardUser[]) => {
    if (!searchTerm) return users;
    return users.filter(user => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: Crown, color: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" };
    if (rank === 2) return { icon: Medal, color: "bg-gray-400/15 text-gray-700 dark:text-gray-400 border-gray-400/30" };
    if (rank === 3) return { icon: Medal, color: "bg-amber-600/15 text-amber-700 dark:text-amber-400 border-amber-600/30" };
    return { icon: Trophy, color: "bg-primary/10 text-primary border-primary/20" };
  };

  const renderCompactMemberCard = (user: LeaderboardUser, index: number, type: 'coins' | 'contributions' | 'uploads') => {
    const { icon: RankIcon, color } = getRankBadge(index + 1);
    
    const getStatValue = () => {
      if (type === 'coins') return user.totalCoins.toLocaleString();
      if (type === 'contributions') return user.contributionCount?.toLocaleString() || '0';
      if (type === 'uploads') return user.uploadCount?.toLocaleString() || '0';
      return '0';
    };

    const getStatIcon = () => {
      if (type === 'coins') return Coins;
      if (type === 'contributions') return MessageSquare;
      if (type === 'uploads') return Upload;
      return Activity;
    };

    const StatIcon = getStatIcon();

    // Calculate "join time ago" - use suppressHydrationWarning where it's displayed
    const joinedAgo = user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : 'Unknown';

    return (
      <Link key={user.id} href={`/user/${user.username}`} data-testid={`link-user-${user.id}`}>
        <Card className="group hover:border-primary/30 hover-elevate active-elevate-2 cursor-pointer transition-all duration-200 h-full">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Rank Badge */}
              <div className="flex-shrink-0 relative">
                <Badge 
                  variant="outline" 
                  className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center p-0 z-10 ${color}`}
                >
                  {index < 3 ? <RankIcon className="w-3 h-3" /> : <span className="text-[10px] font-bold">{index + 1}</span>}
                </Badge>
                <Avatar className="w-12 h-12 border-2 border-border group-hover:border-primary/30 transition-colors">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              {/* User Info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <h3 
                  className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors" 
                  data-testid={`text-username-${user.id}`}
                >
                  {user.username}
                </h3>
                
                {/* Rank & Level */}
                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted/50">
                    #{index + 1}
                  </Badge>
                  <span className="truncate">
                    Silver {user.rank || 22}
                  </span>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <StatIcon className="w-3 h-3 text-primary" />
                    <span className="font-semibold" data-testid={`stat-value-${user.id}`}>
                      {getStatValue()}
                    </span>
                  </div>
                  <span className="text-border">•</span>
                  <div className="flex items-center gap-1 text-muted-foreground truncate">
                    <Calendar className="w-3 h-3" />
                    <span suppressHydrationWarning className="text-[11px] truncate">{joinedAgo}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  const totalMembers = (topByCoins?.length || 0) + (topByContributions?.length || 0) + (topByUploads?.length || 0);
  const uniqueMembers = new Set([
    ...(topByCoins || []).map(u => u.id),
    ...(topByContributions || []).map(u => u.id),
    ...(topByUploads || []).map(u => u.id)
  ]).size;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Page Header with Stats */}
      <div className="border-b bg-gradient-to-br from-primary/5 to-background">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" data-testid="heading-members">
                <Users className="w-8 h-8 text-primary" />
                Community Members
              </h1>
              <p className="text-muted-foreground">
                Top contributors, traders, and developers in the YoForex community
              </p>
            </div>
          </div>

          {/* Top Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{uniqueMembers}</p>
                    <p className="text-xs text-muted-foreground">Total Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Coins className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="stat-top-earner-coins">
                      {topByCoins?.[0]?.totalCoins.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Top Coins</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="stat-most-active-count">
                      {topByContributions?.[0]?.contributionCount?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Top Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Upload className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="stat-top-publisher-count">
                      {topByUploads?.[0]?.uploadCount?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Top Uploads</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <main className="container max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filter Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-members"
                  />
                </div>
              </div>
              <Badge variant="outline" className="gap-2 px-3 py-2">
                <Filter className="w-3 h-3" />
                Leaderboard View
              </Badge>
            </div>
          </CardContent>
        </Card>

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
              <span className="hidden sm:inline">Most Active</span>
              <span className="sm:hidden">Active</span>
            </TabsTrigger>
            <TabsTrigger value="uploads" className="gap-2" data-testid="tab-uploads">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Top Publishers</span>
              <span className="sm:hidden">Publishers</span>
            </TabsTrigger>
          </TabsList>

          {/* Coins Leaderboard */}
          <TabsContent value="coins" data-testid="content-coins-leaderboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {coinsLoading ? (
                Array(12).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
              ) : filterUsers(topByCoins || []).length > 0 ? (
                filterUsers(topByCoins || []).map((user, index) => 
                  renderCompactMemberCard(user, index, 'coins')
                )
              ) : (
                <div className="col-span-full">
                  <Card className="p-12 text-center">
                    <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No members found</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? 'Try adjusting your search' : 'Start earning coins to appear here!'}
                    </p>
                  </Card>
                </div>
              )}
            </div>
            {filterUsers(topByCoins || []).length > 0 && (
              <Card className="mt-6 bg-muted/30">
                <CardContent className="p-4 text-center text-sm text-muted-foreground">
                  Showing {filterUsers(topByCoins || []).length} member{filterUsers(topByCoins || []).length !== 1 ? 's' : ''}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Contributions Leaderboard */}
          <TabsContent value="contributions" data-testid="content-contributions-leaderboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {contributionsLoading ? (
                Array(12).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
              ) : filterUsers(topByContributions || []).length > 0 ? (
                filterUsers(topByContributions || []).map((user, index) => 
                  renderCompactMemberCard(user, index, 'contributions')
                )
              ) : (
                <div className="col-span-full">
                  <Card className="p-12 text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? 'Try adjusting your search' : 'Start contributing to appear here!'}
                    </p>
                  </Card>
                </div>
              )}
            </div>
            {filterUsers(topByContributions || []).length > 0 && (
              <Card className="mt-6 bg-muted/30">
                <CardContent className="p-4 text-center text-sm text-muted-foreground">
                  Showing {filterUsers(topByContributions || []).length} member{filterUsers(topByContributions || []).length !== 1 ? 's' : ''}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Uploads Leaderboard */}
          <TabsContent value="uploads" data-testid="content-uploads-leaderboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {uploadsLoading ? (
                Array(12).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
              ) : filterUsers(topByUploads || []).length > 0 ? (
                filterUsers(topByUploads || []).map((user, index) => 
                  renderCompactMemberCard(user, index, 'uploads')
                )
              ) : (
                <div className="col-span-full">
                  <Card className="p-12 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No uploads yet</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? 'Try adjusting your search' : 'Publish your first EA to appear here!'}
                    </p>
                  </Card>
                </div>
              )}
            </div>
            {filterUsers(topByUploads || []).length > 0 && (
              <Card className="mt-6 bg-muted/30">
                <CardContent className="p-4 text-center text-sm text-muted-foreground">
                  Showing {filterUsers(topByUploads || []).length} member{filterUsers(topByUploads || []).length !== 1 ? 's' : ''}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <Card className="mt-12 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Trophy className="w-10 h-10 text-primary" />
                <Flame className="w-10 h-10 text-orange-500" />
                <Zap className="w-10 h-10 text-yellow-500" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Climb the Leaderboard</h3>
              <p className="text-muted-foreground mb-6">
                Earn coins, contribute to discussions, and publish quality content to rise through the ranks
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/publish">
                  <Button size="lg" data-testid="button-publish-content">
                    <Upload className="w-4 h-4 mr-2" />
                    Publish Content
                  </Button>
                </Link>
                <Link href="/earn-coins">
                  <Button variant="outline" size="lg" data-testid="button-earn-coins">
                    <Coins className="w-4 h-4 mr-2" />
                    Ways to Earn
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer with Community Stats */}
      <div className="border-t bg-muted/30 mt-12">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{uniqueMembers}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Members</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {(topByCoins || []).reduce((sum, u) => sum + (u.totalCoins || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Total Coins Earned</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {(topByContributions || []).reduce((sum, u) => sum + (u.contributionCount || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Total Contributions</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {(topByUploads || []).reduce((sum, u) => sum + (u.uploadCount || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Total Uploads</p>
            </div>
          </div>
        </div>
      </div>

      <EnhancedFooter />
    </div>
  );
}
