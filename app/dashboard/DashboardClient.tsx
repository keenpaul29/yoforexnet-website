"use client";

import { useState } from "react";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  Download,
  Eye,
  Coins,
  FileText,
  ShoppingBag,
  TrendingUp,
  Edit,
  Trash2,
  BarChart3,
  Settings
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import NotificationsWidget from "@/components/dashboard/NotificationsWidget";
import QuickActionsWidget from "@/components/dashboard/QuickActionsWidget";
import ActivityTimelineWidget from "@/components/dashboard/ActivityTimelineWidget";
import EarningsSummaryWidget from "@/components/dashboard/EarningsSummaryWidget";

interface DashboardPreferences {
  enabledWidgets?: string[];
}

interface DashboardMetrics {
  totalRevenue: number;
  totalDownloads: number;
  totalViews: number;
  avgRating: number;
  publishedCount: number;
}

interface RevenueTrendItem {
  date: string;
  revenueCoins: number;
  downloads: number;
}

interface Content {
  id: string;
  type: "ea" | "indicator" | "article" | "source_code";
  title: string;
  slug: string;
  priceCoins: number;
  isFree: boolean;
  status: "pending" | "approved" | "rejected";
  downloads: number;
  views: number;
  averageRating: number | null;
  reviewCount: number;
  createdAt: string;
}

interface Purchase {
  id: string;
  contentId: string;
  buyerId: string;
  sellerId: string;
  priceCoins: number;
  purchasedAt: string;
  content: Content | null;
}

export default function DashboardClient() {
  const [activeTab, setActiveTab] = useState("published");
  const { user } = useAuth();

  const { data: preferences } = useQuery<DashboardPreferences>({
    queryKey: ['/api/dashboard/preferences'],
  });

  const { data: publishedContent = [], isLoading: isLoadingPublished } = useQuery<Content[]>({
    queryKey: ['/api/me/content'],
  });

  const { data: purchasedContent = [], isLoading: isLoadingPurchased } = useQuery<Purchase[]>({
    queryKey: ['/api/me/purchases'],
  });

  const { data: metrics, isLoading: isLoadingMetrics } = useQuery<DashboardMetrics>({
    queryKey: ['/api/me/dashboard-metrics'],
  });

  const { data: revenueTrend = [], isLoading: isLoadingTrend } = useQuery<RevenueTrendItem[]>({
    queryKey: ['/api/me/revenue-trend'],
  });

  const isWidgetEnabled = (widgetId: string) => {
    if (!preferences) {
      return ['notifications', 'quick-actions', 'activity-timeline', 'earnings-summary'].includes(widgetId);
    }
    return preferences.enabledWidgets?.includes(widgetId) || false;
  };

  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case 'notifications':
        return isWidgetEnabled('notifications') ? <NotificationsWidget key="notifications" /> : null;
      case 'quick-actions':
        return isWidgetEnabled('quick-actions') ? <QuickActionsWidget key="quick-actions" /> : null;
      case 'activity-timeline':
        return isWidgetEnabled('activity-timeline') ? <ActivityTimelineWidget key="activity-timeline" /> : null;
      case 'earnings-summary':
        return isWidgetEnabled('earnings-summary') ? <EarningsSummaryWidget key="earnings-summary" /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
            <p className="text-lg text-muted-foreground">
              Manage your published content and track your earnings
            </p>
          </div>
          <Link href="/dashboard/settings" data-testid="link-customize-dashboard">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Customize Widgets
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {renderWidget('notifications')}
          {renderWidget('quick-actions')}
          {renderWidget('activity-timeline')}
          {renderWidget('earnings-summary')}
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTrend ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenueCoins" stroke="#f59e0b" fill="#fef3c7" name="Revenue (coins)" />
                  <Area type="monotone" dataKey="downloads" stroke="#3b82f6" fill="#dbeafe" name="Downloads" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoadingMetrics ? (
            <>
              <Skeleton className="h-[120px]" />
              <Skeleton className="h-[120px]" />
              <Skeleton className="h-[120px]" />
              <Skeleton className="h-[120px]" />
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-600" />
                    <span className="text-2xl font-bold" data-testid="text-total-revenue">
                      {metrics?.totalRevenue?.toLocaleString() || 0}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    From {metrics?.publishedCount || 0} published items
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Downloads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    <span className="text-2xl font-bold" data-testid="text-total-downloads">
                      {metrics?.totalDownloads?.toLocaleString() || 0}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Across all your content
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    <span className="text-2xl font-bold" data-testid="text-total-views">
                      {metrics?.totalViews?.toLocaleString() || 0}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Page views this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    <span className="text-2xl font-bold" data-testid="text-avg-rating">
                      {metrics?.avgRating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Based on your content
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="published" data-testid="tab-published">
                    <FileText className="w-4 h-4 mr-2" />
                    Published ({publishedContent.length})
                  </TabsTrigger>
                  <TabsTrigger value="purchased" data-testid="tab-purchased">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Purchased ({purchasedContent.length})
                  </TabsTrigger>
                </TabsList>
                <Link href="/publish" data-testid="link-publish-new">
                  <Button data-testid="button-publish-new">
                    <FileText className="w-4 h-4 mr-2" />
                    Publish New
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <TabsContent value="published">
              <CardContent>
                {isLoadingPublished ? (
                  <div className="space-y-4">
                    <Skeleton className="h-[150px] w-full" />
                    <Skeleton className="h-[150px] w-full" />
                    <Skeleton className="h-[150px] w-full" />
                  </div>
                ) : publishedContent.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No published content yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start sharing your trading expertise with the community
                    </p>
                    <Link href="/publish">
                      <Button>
                        <FileText className="w-4 h-4 mr-2" />
                        Publish Your First Content
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {publishedContent.map((item) => (
                      <Card key={item.id} className="hover-elevate" data-testid={`card-published-${item.id}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">
                                  {item.type === "ea" ? "EA" : item.type === "indicator" ? "Indicator" : item.type === "article" ? "Article" : "Source Code"}
                                </Badge>
                                <Badge variant={item.status === "approved" ? "default" : item.status === "pending" ? "secondary" : "destructive"}>
                                  {item.status}
                                </Badge>
                              </div>
                              <Link href={`/content/${item.slug}`} data-testid={`link-published-${item.id}`}>
                                <h3 className="text-lg font-semibold hover:underline mb-2" data-testid={`text-published-title-${item.id}`}>
                                  {item.title}
                                </h3>
                              </Link>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Downloads</p>
                                  <p className="font-medium">{item.downloads.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Views</p>
                                  <p className="font-medium">{item.views.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Rating</p>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                    <span className="font-medium">{item.averageRating?.toFixed(1) || '0.0'}</span>
                                    <span className="text-muted-foreground">({item.reviewCount})</span>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Price</p>
                                  <div className="flex items-center gap-1">
                                    <Coins className="w-4 h-4 text-yellow-600" />
                                    <span className="font-medium">{item.priceCoins.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" data-testid={`button-edit-${item.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" data-testid={`button-stats-${item.id}`}>
                                <BarChart3 className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" data-testid={`button-delete-${item.id}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </TabsContent>

            <TabsContent value="purchased">
              <CardContent>
                {isLoadingPurchased ? (
                  <div className="space-y-4">
                    <Skeleton className="h-[120px] w-full" />
                    <Skeleton className="h-[120px] w-full" />
                    <Skeleton className="h-[120px] w-full" />
                  </div>
                ) : purchasedContent.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Explore the marketplace to find trading tools and resources
                    </p>
                    <Link href="/marketplace">
                      <Button>
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Browse Marketplace
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchasedContent.map((purchase) => {
                      const item = purchase.content;
                      if (!item) return null;
                      
                      return (
                        <Card key={purchase.id} className="hover-elevate" data-testid={`card-purchased-${purchase.id}`}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">
                                    {item.type === "ea" ? "EA" : item.type === "indicator" ? "Indicator" : item.type === "article" ? "Article" : "Source Code"}
                                  </Badge>
                                  {item.isFree ? (
                                    <Badge variant="secondary">FREE</Badge>
                                  ) : (
                                    <div className="flex items-center gap-1 text-sm">
                                      <Coins className="w-3 h-3 text-yellow-600" />
                                      <span>{item.priceCoins} coins</span>
                                    </div>
                                  )}
                                </div>
                                <Link href={`/content/${item.slug}`} data-testid={`link-purchased-${purchase.id}`}>
                                  <h3 className="text-lg font-semibold hover:underline mb-2" data-testid={`text-purchased-title-${purchase.id}`}>
                                    {item.title}
                                  </h3>
                                </Link>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                    <span>{item.averageRating?.toFixed(1) || '0.0'}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Download className="w-4 h-4" />
                                    <span>{item.downloads.toLocaleString()} downloads</span>
                                  </div>
                                  <span>Purchased {new Date(purchase.purchasedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Link href={`/content/${item.slug}`} data-testid={`link-download-${purchase.id}`}>
                                  <Button variant="outline" size="sm" data-testid={`button-download-${purchase.id}`}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </main>

      <EnhancedFooter />
    </div>
  );
}
