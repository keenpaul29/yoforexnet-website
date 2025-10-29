"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, FileText, DollarSign, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface OverviewStats {
  users: {
    total: number;
    new24h: number;
  };
  content: {
    total: number;
    new24h: number;
  };
  revenue: {
    total: number;
    today: number;
  };
  moderation: {
    pending: number;
    reports: number;
  };
}

interface ActivityFeedItem {
  id: string;
  adminUsername: string;
  actionType: string;
  targetType: string;
  status: string;
  createdAt: string;
}

interface UserGrowthDataPoint {
  date: string;
  users: number;
}

interface ContentTrendDataPoint {
  date: string;
  count: number;
}

export default function AdminOverview() {
  const { data: statsRaw, isLoading: statsLoading } = useQuery<OverviewStats>({
    queryKey: ["/api/admin/overview/stats"]
  });

  const stats: OverviewStats = statsRaw || {
    users: { total: 0, new24h: 0 },
    content: { total: 0, new24h: 0 },
    revenue: { total: 0, today: 0 },
    moderation: { pending: 0, reports: 0 }
  };

  const { data: activityFeedRaw, isLoading: activityLoading } = useQuery<ActivityFeedItem[]>({
    queryKey: ["/api/admin/overview/activity-feed"]
  });

  const activityFeed: ActivityFeedItem[] = Array.isArray(activityFeedRaw) ? activityFeedRaw : [];

  const { data: userGrowthRaw, isLoading: growthLoading } = useQuery<UserGrowthDataPoint[]>({
    queryKey: ["/api/admin/overview/user-growth"]
  });

  const userGrowth: UserGrowthDataPoint[] = Array.isArray(userGrowthRaw) ? userGrowthRaw : [];

  const { data: contentTrendRaw, isLoading: trendLoading } = useQuery<ContentTrendDataPoint[]>({
    queryKey: ["/api/admin/overview/content-trend"]
  });

  const contentTrend: ContentTrendDataPoint[] = Array.isArray(contentTrendRaw) ? contentTrendRaw : [];

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Overview Dashboard</h1>
      
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-users">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-users">
              {stats.users.total}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats.users.new24h} in last 24h
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-content">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-content">
              {stats.content.total}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats.content.new24h} in last 24h
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              ${stats.revenue.total}
            </div>
            <p className="text-xs text-muted-foreground">
              +${stats.revenue.today} today
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-pending-moderation">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Moderation</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-moderation">
              {stats.moderation.pending}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.moderation.reports} reports
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card data-testid="card-user-growth-chart">
          <CardHeader>
            <CardTitle>User Growth (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {growthLoading ? (
              <Skeleton className="h-64" />
            ) : userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card data-testid="card-content-trend-chart">
          <CardHeader>
            <CardTitle>Content Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <Skeleton className="h-64" />
            ) : contentTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={contentTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card data-testid="card-activity-feed">
        <CardHeader>
          <CardTitle>Recent Admin Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : activityFeed.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityFeed.map((activity) => (
                    <TableRow key={activity.id} data-testid={`activity-${activity.id}`}>
                      <TableCell data-testid={`activity-admin-${activity.id}`}>
                        {activity.adminUsername || 'System'}
                      </TableCell>
                      <TableCell data-testid={`activity-action-${activity.id}`}>
                        {activity.actionType}
                      </TableCell>
                      <TableCell data-testid={`activity-target-${activity.id}`}>
                        {activity.targetType}
                      </TableCell>
                      <TableCell>
                        <Badge variant={activity.status === 'success' ? 'default' : 'destructive'}>
                          {activity.status}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`activity-time-${activity.id}`}>
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
