"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Bell, Smartphone } from "lucide-react";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

export default function Mobile() {
  const { toast } = useToast();
  const [targetType, setTargetType] = useState("all");

  const { data: notificationHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/admin/mobile/notification-history"]
  });

  const { data: appVersions, isLoading: versionsLoading } = useQuery({
    queryKey: ["/api/admin/mobile/app-versions"]
  });

  const { data: versionDistribution, isLoading: versionDistLoading } = useQuery({
    queryKey: ["/api/admin/mobile/version-distribution"]
  });

  const { data: deviceTypes, isLoading: deviceTypesLoading } = useQuery({
    queryKey: ["/api/admin/mobile/device-types"]
  });

  const { data: osDistribution, isLoading: osDistLoading } = useQuery({
    queryKey: ["/api/admin/mobile/os-distribution"]
  });

  const { data: browserDistribution, isLoading: browserDistLoading } = useQuery({
    queryKey: ["/api/admin/mobile/browser-distribution"]
  });

  const { data: screenResolutions, isLoading: resolutionsLoading } = useQuery({
    queryKey: ["/api/admin/mobile/screen-resolutions"]
  });

  const sendNotificationMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/mobile/send-notification", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mobile/notification-history"] });
      toast({ title: "Notification sent successfully" });
    }
  });

  const toggleForceUpdateMutation = useMutation({
    mutationFn: ({ id, forceUpdate }: { id: string; forceUpdate: boolean }) => 
      apiRequest(`/api/admin/mobile/app-versions/${id}/force-update`, "PATCH", { forceUpdate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mobile/app-versions"] });
      toast({ title: "Force update setting updated" });
    }
  });

  const handleSendNotification = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    sendNotificationMutation.mutate({
      title: formData.get("title"),
      body: formData.get("body"),
      targetType,
      targetValue: formData.get("targetValue")
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mobile & Push Notifications</h1>

      <Tabs defaultValue="push" className="space-y-4">
        <TabsList>
          <TabsTrigger value="push" data-testid="tab-push">Push Notifications</TabsTrigger>
          <TabsTrigger value="versions" data-testid="tab-versions">App Versions</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-device-analytics">Device Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="push" className="space-y-4">
          <h2 className="text-xl font-semibold">Send Push Notification</h2>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Notification Title</Label>
                  <Input id="title" name="title" required data-testid="input-notification-title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Notification Body</Label>
                  <Textarea id="body" name="body" rows={3} required data-testid="textarea-notification-body" />
                </div>
                <div className="space-y-2">
                  <Label>Target</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="target-all"
                        checked={targetType === "all"}
                        onCheckedChange={() => setTargetType("all")}
                        data-testid="checkbox-target-all"
                      />
                      <Label htmlFor="target-all" className="cursor-pointer">All Users</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="target-segments"
                        checked={targetType === "segments"}
                        onCheckedChange={() => setTargetType("segments")}
                        data-testid="checkbox-target-segments"
                      />
                      <Label htmlFor="target-segments" className="cursor-pointer">Specific Segments</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="target-users"
                        checked={targetType === "users"}
                        onCheckedChange={() => setTargetType("users")}
                        data-testid="checkbox-target-users"
                      />
                      <Label htmlFor="target-users" className="cursor-pointer">Specific User IDs</Label>
                    </div>
                  </div>
                </div>
                {(targetType === "segments" || targetType === "users") && (
                  <div className="space-y-2">
                    <Label htmlFor="targetValue">
                      {targetType === "segments" ? "Segment Names (comma-separated)" : "User IDs (comma-separated)"}
                    </Label>
                    <Input
                      id="targetValue"
                      name="targetValue"
                      placeholder={targetType === "segments" ? "premium, active-traders" : "user-123, user-456"}
                      data-testid="input-target-value"
                    />
                  </div>
                )}
                <Button type="submit" disabled={sendNotificationMutation.isPending} data-testid="button-send-notification">
                  <Bell className="w-4 h-4 mr-2" />
                  {sendNotificationMutation.isPending ? "Sending..." : "Send Notification"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Delivered</TableHead>
                        <TableHead>Opened</TableHead>
                        <TableHead>CTR</TableHead>
                        <TableHead>Sent At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notificationHistory?.map((notification: any) => (
                        <TableRow key={notification.id}>
                          <TableCell className="font-medium max-w-xs truncate">{notification.title}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{notification.targetType}</Badge>
                          </TableCell>
                          <TableCell>{notification.deliveredCount || 0}</TableCell>
                          <TableCell>{notification.openedCount || 0}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {notification.ctr || 0}%
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDistanceToNow(new Date(notification.sentAt), { addSuffix: true })}</TableCell>
                        </TableRow>
                      ))}
                      {(!notificationHistory || notificationHistory.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No notifications sent yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          <h2 className="text-xl font-semibold">App Versions</h2>

          <Card>
            <CardContent className="p-0">
              {versionsLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Version</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Release Date</TableHead>
                        <TableHead>Users</TableHead>
                        <TableHead>Force Update</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appVersions?.map((version: any) => (
                        <TableRow key={version.id} data-testid={`version-${version.id}`}>
                          <TableCell className="font-medium">{version.version}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{version.platform}</Badge>
                          </TableCell>
                          <TableCell>{new Date(version.releaseDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{version.userCount || 0} users</Badge>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={version.forceUpdate}
                              onCheckedChange={(checked) => 
                                toggleForceUpdateMutation.mutate({ id: version.id, forceUpdate: checked })
                              }
                              data-testid={`switch-force-update-${version.id}`}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!appVersions || appVersions.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No app versions found
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
              <CardTitle>User Distribution by Version</CardTitle>
            </CardHeader>
            <CardContent>
              {versionDistLoading ? (
                <Skeleton className="h-64" />
              ) : versionDistribution && versionDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={versionDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `v${entry.version}: ${entry.percentage}%`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="count"
                    >
                      {versionDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <h2 className="text-xl font-semibold">Device Analytics</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
              </CardHeader>
              <CardContent>
                {deviceTypesLoading ? (
                  <Skeleton className="h-64" />
                ) : deviceTypes && deviceTypes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={deviceTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.percentage}%`}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {deviceTypes.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
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
                <CardTitle>OS Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {osDistLoading ? (
                  <Skeleton className="h-64" />
                ) : osDistribution && osDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={osDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
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

            <Card>
              <CardHeader>
                <CardTitle>Browser Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {browserDistLoading ? (
                  <Skeleton className="h-64" />
                ) : browserDistribution && browserDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={browserDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
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

            <Card>
              <CardHeader>
                <CardTitle>Screen Resolutions</CardTitle>
              </CardHeader>
              <CardContent>
                {resolutionsLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8" />)}
                  </div>
                ) : screenResolutions && screenResolutions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Resolution</TableHead>
                          <TableHead>Users</TableHead>
                          <TableHead>Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {screenResolutions.map((resolution: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{resolution.resolution}</TableCell>
                            <TableCell>{resolution.count}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{resolution.percentage}%</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
