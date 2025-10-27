import { useState } from "react";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import NotificationsWidget from "@/components/dashboard/NotificationsWidget";
import QuickActionsWidget from "@/components/dashboard/QuickActionsWidget";
import ActivityTimelineWidget from "@/components/dashboard/ActivityTimelineWidget";
import EarningsSummaryWidget from "@/components/dashboard/EarningsSummaryWidget";

interface ContentItem {
  id: string;
  type: "ea" | "indicator" | "article" | "source_code";
  title: string;
  slug: string;
  priceCoins: number;
  isFree: boolean;
  status: "published" | "pending" | "rejected";
  downloads: number;
  views: number;
  rating: number;
  reviewCount: number;
  revenue: number;
  publishedAt: Date;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("published");

  const { data: preferences } = useQuery({
    queryKey: ['/api/dashboard/preferences'],
  });

  const isWidgetEnabled = (widgetId: string) => {
    if (!preferences) {
      // Default enabled widgets
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

  const publishedContent: ContentItem[] = [
    {
      id: "1",
      type: "ea",
      title: "Gold Hedger EA 2025 - MT5 No DLL",
      slug: "gold-hedger-ea-2025-mt5-no-dll",
      priceCoins: 500,
      isFree: false,
      status: "published",
      downloads: 1234,
      views: 5432,
      rating: 4.8,
      reviewCount: 234,
      revenue: 524250,
      publishedAt: new Date("2024-01-15")
    },
    {
      id: "2",
      type: "indicator",
      title: "Smart Trend Indicator - Multi-Timeframe",
      slug: "smart-trend-indicator-multi-timeframe",
      priceCoins: 300,
      isFree: false,
      status: "published",
      downloads: 2156,
      views: 6789,
      rating: 4.9,
      reviewCount: 189,
      revenue: 549780,
      publishedAt: new Date("2024-02-20")
    },
    {
      id: "3",
      type: "article",
      title: "Complete Guide to EA Optimization",
      slug: "complete-guide-ea-optimization",
      priceCoins: 150,
      isFree: false,
      status: "published",
      downloads: 892,
      views: 3210,
      rating: 5.0,
      reviewCount: 67,
      revenue: 113730,
      publishedAt: new Date("2024-03-10")
    }
  ];

  const purchasedContent: ContentItem[] = [
    {
      id: "4",
      type: "ea",
      title: "XAUUSD M1 Scalper Pro",
      slug: "xauusd-m1-scalper-pro",
      priceCoins: 750,
      isFree: false,
      status: "published",
      downloads: 892,
      views: 4321,
      rating: 4.7,
      reviewCount: 156,
      revenue: 0,
      publishedAt: new Date("2024-09-15")
    },
    {
      id: "5",
      type: "source_code",
      title: "Grid Trading EA Source Code",
      slug: "grid-trading-ea-source-code",
      priceCoins: 0,
      isFree: true,
      status: "published",
      downloads: 567,
      views: 2890,
      rating: 4.6,
      reviewCount: 89,
      revenue: 0,
      publishedAt: new Date("2024-08-20")
    }
  ];

  const totalRevenue = publishedContent.reduce((sum, item) => sum + item.revenue, 0);
  const totalDownloads = publishedContent.reduce((sum, item) => sum + item.downloads, 0);
  const totalViews = publishedContent.reduce((sum, item) => sum + item.views, 0);
  const avgRating = publishedContent.reduce((sum, item) => sum + item.rating, 0) / publishedContent.length;

  return (
    <div className="min-h-screen bg-background">
      <Header userCoins={2450} />
      
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
            <p className="text-lg text-muted-foreground">
              Manage your published content and track your earnings
            </p>
          </div>
          <Link href="/dashboard/customize" data-testid="link-customize-dashboard">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Customize Widgets
            </Button>
          </Link>
        </div>

        {/* Dashboard Widgets Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {renderWidget('notifications')}
          {renderWidget('quick-actions')}
          {renderWidget('activity-timeline')}
          {renderWidget('earnings-summary')}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  {totalRevenue.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                From {publishedContent.length} published items
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
                  {totalDownloads.toLocaleString()}
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
                  {totalViews.toLocaleString()}
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
                  {avgRating.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Based on {publishedContent.reduce((sum, item) => sum + item.reviewCount, 0)} reviews
              </p>
            </CardContent>
          </Card>
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
                              <Badge variant={item.status === "published" ? "default" : item.status === "pending" ? "secondary" : "destructive"}>
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
                                  <span className="font-medium">{item.rating}</span>
                                  <span className="text-muted-foreground">({item.reviewCount})</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Revenue</p>
                                <div className="flex items-center gap-1">
                                  <Coins className="w-4 h-4 text-yellow-600" />
                                  <span className="font-medium">{item.revenue.toLocaleString()}</span>
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
              </CardContent>
            </TabsContent>

            <TabsContent value="purchased">
              <CardContent>
                <div className="space-y-4">
                  {purchasedContent.map((item) => (
                    <Card key={item.id} className="hover-elevate" data-testid={`card-purchased-${item.id}`}>
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
                            <Link href={`/content/${item.slug}`} data-testid={`link-purchased-${item.id}`}>
                              <h3 className="text-lg font-semibold hover:underline mb-2" data-testid={`text-purchased-title-${item.id}`}>
                                {item.title}
                              </h3>
                            </Link>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                <span>{item.rating}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Download className="w-4 h-4" />
                                <span>{item.downloads.toLocaleString()} downloads</span>
                              </div>
                              <span>Purchased {item.publishedAt.toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/content/${item.slug}`} data-testid={`link-download-${item.id}`}>
                              <Button variant="outline" size="sm" data-testid={`button-download-${item.id}`}>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </main>

      <EnhancedFooter />
    </div>
  );
}
