"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, Package, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AddContentDialog from "./AddContentDialog";

interface MarketplaceStats {
  totalItems: number;
  pendingItems: number;
  totalSales: number;
  salesThisWeek: number;
  totalRevenue: number;
  revenueThisWeek: number;
}

interface MarketplaceItem {
  id: number;
  title: string;
  sellerUsername: string;
  coinPrice: number;
  sales: number;
  status: string;
  createdAt: string;
}

interface TopSellingItem {
  id: number;
  title: string;
  sales: number;
  coinPrice: number;
}

interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export default function AdminMarketplace() {
  const { toast } = useToast();

  const { data: statsRaw, isLoading: statsLoading } = useQuery<MarketplaceStats>({
    queryKey: ["/api/admin/marketplace/stats"]
  });

  const stats: MarketplaceStats = statsRaw || {
    totalItems: 0,
    pendingItems: 0,
    totalSales: 0,
    salesThisWeek: 0,
    totalRevenue: 0,
    revenueThisWeek: 0
  };

  const { data: itemsRaw, isLoading: itemsLoading } = useQuery<MarketplaceItem[]>({
    queryKey: ["/api/admin/marketplace/items"]
  });

  const items: MarketplaceItem[] = Array.isArray(itemsRaw) ? itemsRaw : [];

  const { data: topSellingRaw, isLoading: topLoading } = useQuery<TopSellingItem[]>({
    queryKey: ["/api/admin/marketplace/top-selling"]
  });

  const topSelling: TopSellingItem[] = Array.isArray(topSellingRaw) ? topSellingRaw : [];

  const { data: revenueDataRaw, isLoading: revenueLoading } = useQuery<RevenueDataPoint[]>({
    queryKey: ["/api/admin/marketplace/revenue-chart"]
  });

  const revenueData: RevenueDataPoint[] = Array.isArray(revenueDataRaw) ? revenueDataRaw : [];

  const approveItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest("POST", `/api/admin/marketplace/${itemId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace"] });
      toast({ title: "Item approved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to approve item", variant: "destructive" });
    }
  });

  const rejectItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest("POST", `/api/admin/marketplace/${itemId}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace"] });
      toast({ title: "Item rejected successfully" });
    },
    onError: () => {
      toast({ title: "Failed to reject item", variant: "destructive" });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Marketplace Management</h1>
        <AddContentDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-total-items">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-total-items">
                  {stats.totalItems}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingItems} pending approval
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-total-sales">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-total-sales">
                  {stats.totalSales}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{stats.salesThisWeek} this week
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-marketplace-revenue">
                  ${stats.totalRevenue}
                </div>
                <p className="text-xs text-muted-foreground">
                  +${stats.revenueThisWeek} this week
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card data-testid="card-revenue-chart">
        <CardHeader>
          <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueLoading ? (
            <Skeleton className="h-64" />
          ) : revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No revenue data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Selling Items */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Items</CardTitle>
        </CardHeader>
        <CardContent>
          {topLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : topSelling.length > 0 ? (
            <div className="space-y-3">
              {topSelling.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-muted-foreground">#{index + 1}</div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.sales} sales</p>
                    </div>
                  </div>
                  <Badge>{item.coinPrice} coins</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No sales data available</p>
          )}
        </CardContent>
      </Card>

      {/* Marketplace Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Marketplace Items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {itemsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Listed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length > 0 ? (
                    items.map((item) => (
                      <TableRow key={item.id} data-testid={`item-row-${item.id}`}>
                        <TableCell data-testid={`item-title-${item.id}`}>
                          {item.title}
                        </TableCell>
                        <TableCell>{item.sellerUsername}</TableCell>
                        <TableCell>{item.coinPrice} coins</TableCell>
                        <TableCell>{item.sales}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'approved' ? 'default' : 'secondary'}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveItemMutation.mutate(item.id)}
                              disabled={item.status === 'approved'}
                              data-testid={`button-approve-item-${item.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectItemMutation.mutate(item.id)}
                              disabled={item.status === 'rejected'}
                              data-testid={`button-reject-item-${item.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No marketplace items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
