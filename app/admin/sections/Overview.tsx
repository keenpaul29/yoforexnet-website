"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, FileText, DollarSign, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOverview() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/overview/stats"]
  });

  const { data: activityFeed, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/admin/overview/activity-feed"]
  });

  const { data: userGrowth, isLoading: growthLoading } = useQuery({
    queryKey: ["/api/admin/overview/user-growth"]
  });

  const { data: contentTrend, isLoading: trendLoading } = useQuery({
    queryKey: ["/api/admin/overview/content-trend"]
  });

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
              {stats?.users?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats?.users?.new24h || 0} in last 24h
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
              {stats?.content?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats?.content?.new24h || 0} in last 24h
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
              ${stats?.revenue?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +${stats?.revenue?.today || 0} today
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
              {stats?.moderation?.pending || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.moderation?.reports || 0} reports
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
            ) : userGrowth && userGrowth.length > 0 ? (
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
            ) : contentTrend && contentTrend.length > 0 ? (
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
          ) : activityFeed && activityFeed.length > 0 ? (
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
                  {activityFeed.map((activity: any) => (
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
