"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";

interface LeaderboardUser {
  rank: number;
  name: string;
  avatar?: string;
  coins: number;
  metric: number;
  trend?: "up" | "down" | "same";
}

interface LeaderboardProps {
  topContributors?: LeaderboardUser[];
  topUploaders?: LeaderboardUser[];
  weeklyStreaks?: LeaderboardUser[];
}

const defaultContributors: LeaderboardUser[] = [
  { rank: 1, name: "ProTrader99", coins: 4520, metric: 234, trend: "up" },
  { rank: 2, name: "GoldScalper", coins: 3890, metric: 198, trend: "up" },
  { rank: 3, name: "DevCoder", coins: 3210, metric: 167, trend: "same" },
  { rank: 4, name: "SwingMaster", coins: 2850, metric: 145, trend: "down" },
  { rank: 5, name: "BTCBreakout", coins: 2340, metric: 122, trend: "up" }
];

const defaultUploaders: LeaderboardUser[] = [
  { rank: 1, name: "EAMaster", coins: 5200, metric: 43, trend: "up" },
  { rank: 2, name: "IndicatorPro", coins: 4100, metric: 38, trend: "up" },
  { rank: 3, name: "CodeWizard", coins: 3600, metric: 31, trend: "same" },
  { rank: 4, name: "SetFilePro", coins: 2900, metric: 27, trend: "up" },
  { rank: 5, name: "BacktestKing", coins: 2400, metric: 22, trend: "down" }
];

const defaultStreaks: LeaderboardUser[] = [
  { rank: 1, name: "DailyTrader", coins: 890, metric: 7, trend: "up" },
  { rank: 2, name: "ConsistentOne", coins: 780, metric: 7, trend: "same" },
  { rank: 3, name: "ActiveMember", coins: 650, metric: 6, trend: "up" },
  { rank: 4, name: "RegularJoe", coins: 540, metric: 5, trend: "up" },
  { rank: 5, name: "ForumFan", coins: 430, metric: 5, trend: "same" }
];

export default function Leaderboard({ 
  topContributors = defaultContributors, 
  topUploaders = defaultUploaders, 
  weeklyStreaks = defaultStreaks 
}: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-primary" />;
    if (rank === 2) return <Award className="h-4 w-4 text-chart-3" />;
    if (rank === 3) return <Award className="h-4 w-4 text-chart-4" />;
    return <span className="text-xs font-semibold text-muted-foreground">#{rank}</span>;
  };

  const getTrendIcon = (trend?: "up" | "down" | "same") => {
    if (trend === "up") return <TrendingUp className="h-3 w-3 text-chart-3" />;
    if (trend === "down") return <TrendingUp className="h-3 w-3 text-destructive rotate-180" />;
    return null;
  };

  const renderLeaderboardList = (users: LeaderboardUser[], metricLabel: string) => (
    <div className="space-y-3">
      {users.map((user) => (
        <div 
          key={user.rank} 
          className="flex items-center gap-3 p-2 rounded-lg hover-elevate" 
          data-testid={`leaderboard-user-${user.rank}`}
        >
          <div className="w-6 flex items-center justify-center">
            {getRankIcon(user.rank)}
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" data-testid={`text-username-${user.rank}`}>
              {user.name}
            </div>
            <div className="text-xs text-muted-foreground" data-testid={`text-metric-${user.rank}`}>
              {user.metric} {metricLabel}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {getTrendIcon(user.trend)}
            <Badge variant="outline" className="text-xs" data-testid={`badge-coins-${user.rank}`}>
              {user.coins}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card data-testid="card-leaderboard">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="contributors" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contributors" className="text-xs" data-testid="tab-contributors">
              Helpful
            </TabsTrigger>
            <TabsTrigger value="uploaders" className="text-xs" data-testid="tab-uploaders">
              Uploads
            </TabsTrigger>
            <TabsTrigger value="streaks" className="text-xs" data-testid="tab-streaks">
              Streaks
            </TabsTrigger>
          </TabsList>
          <TabsContent value="contributors" className="mt-4">
            {renderLeaderboardList(topContributors, "solutions")}
          </TabsContent>
          <TabsContent value="uploaders" className="mt-4">
            {renderLeaderboardList(topUploaders, "uploads")}
          </TabsContent>
          <TabsContent value="streaks" className="mt-4">
            {renderLeaderboardList(weeklyStreaks, "day streak")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
