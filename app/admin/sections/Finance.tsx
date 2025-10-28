"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingDown, TrendingUp, Coins, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function AdminFinance() {
  const [periodFilter, setPeriodFilter] = useState("30d");
  const { toast } = useToast();

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["/api/admin/finance/overview"]
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/admin/finance/transactions", { period: periodFilter }]
  });

  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["/api/admin/finance/withdrawals/pending"]
  });

  const { data: revenueChart, isLoading: chartLoading } = useQuery({
    queryKey: ["/api/admin/finance/revenue-chart", { period: periodFilter }]
  });

  const { data: revenueBySource, isLoading: sourceLoading } = useQuery({
    queryKey: ["/api/admin/finance/revenue-by-source"]
  });

  const approveWithdrawalMutation = useMutation({
    mutationFn: async (withdrawalId: number) => {
      return apiRequest("POST", `/api/admin/finance/withdrawals/${withdrawalId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/finance"] });
      toast({ title: "Withdrawal approved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to approve withdrawal", variant: "destructive" });
    }
  });

  const rejectWithdrawalMutation = useMutation({
    mutationFn: async ({ withdrawalId, reason }: { withdrawalId: number; reason: string }) => {
      return apiRequest("POST", `/api/admin/finance/withdrawals/${withdrawalId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/finance"] });
      toast({ title: "Withdrawal rejected successfully" });
    },
    onError: () => {
      toast({ title: "Failed to reject withdrawal", variant: "destructive" });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">Finance Management</h1>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-48" data-testid="select-period-filter">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-finance-revenue">
                  ${overview?.totalRevenue || 0}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{overview?.revenueGrowth || 0}% vs last period
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-pending-withdrawals">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-pending-withdrawals">
                  ${overview?.pendingWithdrawals || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {overview?.pendingWithdrawalCount || 0} requests
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-total-transactions">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-total-transactions">
                  {overview?.totalTransactions || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {overview?.transactionsToday || 0} today
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-top-earner">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Earner</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-lg font-bold truncate">
                  {overview?.topEarner?.username || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  ${overview?.topEarner?.earnings || 0} earned
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card data-testid="card-revenue-trend">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-64" />
            ) : revenueChart && revenueChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueChart}>
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

        <Card data-testid="card-revenue-by-source">
          <CardHeader>
            <CardTitle>Revenue by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceLoading ? (
              <Skeleton className="h-64" />
            ) : revenueBySource && revenueBySource.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={revenueBySource}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {revenueBySource.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No source data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Withdrawals */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Withdrawals ({withdrawals?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawalsLoading ? (
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
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals && withdrawals.length > 0 ? (
                    withdrawals.map((withdrawal: any) => (
                      <TableRow key={withdrawal.id} data-testid={`withdrawal-row-${withdrawal.id}`}>
                        <TableCell data-testid={`withdrawal-user-${withdrawal.id}`}>
                          {withdrawal.username}
                        </TableCell>
                        <TableCell data-testid={`withdrawal-amount-${withdrawal.id}`}>
                          ${withdrawal.amount || 0}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{withdrawal.method || 'USDT'}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {withdrawal.walletAddress || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(withdrawal.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveWithdrawalMutation.mutate(withdrawal.id)}
                              data-testid={`button-approve-withdrawal-${withdrawal.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectWithdrawalMutation.mutate({ 
                                withdrawalId: withdrawal.id, 
                                reason: "Manual rejection" 
                              })}
                              data-testid={`button-reject-withdrawal-${withdrawal.id}`}
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
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No pending withdrawals
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions ({transactions?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
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
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions && transactions.length > 0 ? (
                    transactions.map((txn: any) => (
                      <TableRow key={txn.id} data-testid={`transaction-row-${txn.id}`}>
                        <TableCell>{txn.username}</TableCell>
                        <TableCell>
                          <Badge variant={txn.type === 'credit' ? 'default' : 'secondary'}>
                            {txn.type}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`transaction-amount-${txn.id}`}>
                          {txn.type === 'credit' ? '+' : '-'}{txn.amount} coins
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {txn.description || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(txn.createdAt), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No transactions found
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
