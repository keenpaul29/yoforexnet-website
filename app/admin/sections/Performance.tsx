"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Activity, Cpu, Database, Trash2 } from "lucide-react";

export default function Performance() {
  const { toast } = useToast();
  const [isSetAlertOpen, setIsSetAlertOpen] = useState(false);
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);

  const { data: systemMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/admin/performance/system-metrics"]
  });

  const { data: responseTimeData, isLoading: responseTimeLoading } = useQuery({
    queryKey: ["/api/admin/performance/response-time"]
  });

  const { data: throughputData, isLoading: throughputLoading } = useQuery({
    queryKey: ["/api/admin/performance/throughput"]
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/admin/performance/alerts"]
  });

  const { data: alertHistory, isLoading: alertHistoryLoading } = useQuery({
    queryKey: ["/api/admin/performance/alert-history"]
  });

  const { data: slowQueries, isLoading: slowQueriesLoading } = useQuery({
    queryKey: ["/api/admin/performance/slow-queries"]
  });

  const { data: dbMetrics, isLoading: dbMetricsLoading } = useQuery({
    queryKey: ["/api/admin/performance/database-metrics"]
  });

  const { data: queryHistogram, isLoading: histogramLoading } = useQuery({
    queryKey: ["/api/admin/performance/query-histogram"]
  });

  const { data: cacheStats, isLoading: cacheStatsLoading } = useQuery({
    queryKey: ["/api/admin/performance/cache-stats"]
  });

  const { data: cachedKeys, isLoading: cachedKeysLoading } = useQuery({
    queryKey: ["/api/admin/performance/cached-keys"]
  });

  const recordMetricMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/performance/record-metric", "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/performance/system-metrics"] });
      toast({ title: "Metric recorded" });
    }
  });

  const setAlertMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/performance/alerts", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/performance/alerts"] });
      toast({ title: "Alert threshold configured" });
      setIsSetAlertOpen(false);
    }
  });

  const clearCacheMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/performance/cache/clear", "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/performance/cache-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/performance/cached-keys"] });
      toast({ title: "Cache cleared successfully" });
      setShowClearCacheDialog(false);
    }
  });

  const handleSetAlert = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setAlertMutation.mutate({
      metricType: formData.get("metricType"),
      threshold: parseFloat(formData.get("threshold") as string),
      condition: formData.get("condition")
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Performance Monitor</h1>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics" data-testid="tab-metrics">Metrics</TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">Alerts</TabsTrigger>
          <TabsTrigger value="database" data-testid="tab-database">Database Performance</TabsTrigger>
          <TabsTrigger value="cache" data-testid="tab-cache">Cache Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">System Metrics</h2>
            <Button
              onClick={() => recordMetricMutation.mutate()}
              disabled={recordMetricMutation.isPending}
              data-testid="button-record-metric"
            >
              <Activity className="w-4 h-4 mr-2" />
              Record Metric
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricsLoading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)
            ) : (
              <>
                <Card data-testid="card-cpu">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                    <Cpu className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-cpu-usage">
                      {systemMetrics?.cpu || 0}%
                    </div>
                  </CardContent>
                </Card>
                <Card data-testid="card-memory">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-memory-usage">
                      {systemMetrics?.memory || 0}%
                    </div>
                  </CardContent>
                </Card>
                <Card data-testid="card-disk">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Disk I/O</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-disk-io">
                      {systemMetrics?.diskIO || 0} MB/s
                    </div>
                  </CardContent>
                </Card>
                <Card data-testid="card-network">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Network</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-network">
                      {systemMetrics?.network || 0} MB/s
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Time (Last 24 Hours)</CardTitle>
              </CardHeader>
              <CardContent>
                {responseTimeLoading ? (
                  <Skeleton className="h-64" />
                ) : responseTimeData && responseTimeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={responseTimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="responseTime" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Throughput (Requests/Second)</CardTitle>
              </CardHeader>
              <CardContent>
                {throughputLoading ? (
                  <Skeleton className="h-64" />
                ) : throughputData && throughputData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={throughputData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="rps" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Performance Alerts</h2>
            <Dialog open={isSetAlertOpen} onOpenChange={setIsSetAlertOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-configure-alert">Configure Alert</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configure Alert Threshold</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSetAlert} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="metricType">Metric Type</Label>
                    <Input id="metricType" name="metricType" required data-testid="input-metric-type" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Threshold Value</Label>
                    <Input id="threshold" name="threshold" type="number" step="0.01" required data-testid="input-threshold" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Input id="condition" name="condition" placeholder="e.g., greater than" required data-testid="input-condition" />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={setAlertMutation.isPending} data-testid="button-submit-alert">
                      {setAlertMutation.isPending ? "Configuring..." : "Configure Alert"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {alertsLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Threshold</TableHead>
                        <TableHead>Current Value</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alerts?.map((alert: any) => (
                        <TableRow key={alert.id}>
                          <TableCell className="font-medium">{alert.metricType}</TableCell>
                          <TableCell>{alert.condition}</TableCell>
                          <TableCell>{alert.threshold}</TableCell>
                          <TableCell>{alert.currentValue}</TableCell>
                          <TableCell>
                            <Badge variant={alert.triggered ? 'destructive' : 'default'}>
                              {alert.triggered ? 'Triggered' : 'OK'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!alerts || alerts.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No alerts configured
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
            </CardHeader>
            <CardContent>
              {alertHistoryLoading ? (
                <Skeleton className="h-64" />
              ) : alertHistory && alertHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={alertHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--destructive))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No alert history
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <h2 className="text-xl font-semibold">Database Performance</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dbMetricsLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)
            ) : (
              <>
                <Card data-testid="card-query-time">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Query Time</CardTitle>
                    <Database className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-query-time">
                      {dbMetrics?.avgQueryTime || 0}ms
                    </div>
                  </CardContent>
                </Card>
                <Card data-testid="card-connections">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-connections">
                      {dbMetrics?.activeConnections || 0} / {dbMetrics?.maxConnections || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card data-testid="card-pool-usage">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pool Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-pool-usage">
                      {dbMetrics?.poolUsage || 0}%
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Slow Queries</CardTitle>
            </CardHeader>
            <CardContent>
              {slowQueriesLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Query</TableHead>
                        <TableHead>Execution Time</TableHead>
                        <TableHead>Calls</TableHead>
                        <TableHead>Last Run</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slowQueries?.map((query: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs max-w-md truncate">{query.query}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{query.executionTime}ms</Badge>
                          </TableCell>
                          <TableCell>{query.callCount}</TableCell>
                          <TableCell>{formatDistanceToNow(new Date(query.lastRun), { addSuffix: true })}</TableCell>
                        </TableRow>
                      ))}
                      {(!slowQueries || slowQueries.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No slow queries detected
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Query Execution Time Histogram</CardTitle>
            </CardHeader>
            <CardContent>
              {histogramLoading ? (
                <Skeleton className="h-64" />
              ) : queryHistogram && queryHistogram.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={queryHistogram}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
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
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Cache Statistics</h2>
            <Button
              variant="destructive"
              onClick={() => setShowClearCacheDialog(true)}
              data-testid="button-clear-cache"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cacheStatsLoading ? (
              [...Array(2)].map((_, i) => <Skeleton key={i} className="h-32" />)
            ) : (
              <>
                <Card data-testid="card-hit-rate">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-hit-rate">
                      {cacheStats?.hitRate || 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {cacheStats?.hits || 0} hits / {cacheStats?.misses || 0} misses
                    </p>
                  </CardContent>
                </Card>
                <Card data-testid="card-cache-size">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cache Size</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-cache-size">
                      {cacheStats?.size || 0} MB
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {cacheStats?.keyCount || 0} keys stored
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Most Cached Keys</CardTitle>
            </CardHeader>
            <CardContent>
              {cachedKeysLoading ? (
                <div className="space-y-2">
                  {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Key</TableHead>
                        <TableHead>Hits</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>TTL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cachedKeys?.map((key: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs max-w-md truncate">{key.key}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{key.hits}</Badge>
                          </TableCell>
                          <TableCell>{key.size} KB</TableCell>
                          <TableCell>{key.ttl}s</TableCell>
                        </TableRow>
                      ))}
                      {(!cachedKeys || cachedKeys.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No cached keys
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <AlertDialog open={showClearCacheDialog} onOpenChange={setShowClearCacheDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Cache</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to clear all cached data? This may temporarily impact performance.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-clear">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => clearCacheMutation.mutate()}
                  data-testid="button-confirm-clear"
                >
                  Clear Cache
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
