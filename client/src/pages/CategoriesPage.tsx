import { useQuery } from "@tanstack/react-query";
import type { ForumCategory } from "@shared/schema";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageSquare, 
  FileText, 
  Users,
  Lightbulb, 
  HelpCircle, 
  TrendingUp, 
  Settings, 
  Code, 
  Award,
  BookOpen,
  Activity,
  Wrench,
  FileCode,
  GraduationCap,
  MessageCircle,
  Trophy,
  BarChart3,
  Rocket,
  ShieldAlert
} from "lucide-react";

// Icon mapping for categories
const iconMap: Record<string, any> = {
  "strategy-discussion": Lightbulb,
  "algorithm-development": Code,
  "backtest-results": TrendingUp,
  "live-trading-reports": BarChart3,
  "signal-services": Activity,
  "mt4-mt5-tips": Settings,
  "broker-discussion": Users,
  "risk-management": ShieldAlert,
  "market-analysis": TrendingUp,
  "indicator-library": Activity,
  "ea-reviews": Award,
  "troubleshooting": Wrench,
  "trading-psychology": GraduationCap,
  "news-updates": FileText,
  "commercial-trials": Rocket,
};

export default function CategoriesPage() {
  const { data: categories, isLoading } = useQuery<ForumCategory[]>({
    queryKey: ['/api/categories'],
    refetchInterval: 30000, // Real-time updates every 30s
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(15).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-categories">Forum Categories</h1>
          <p className="text-muted-foreground">
            Browse all discussion categories. Choose the right place for your questions and contributions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories?.map((category) => {
            const IconComponent = iconMap[category.slug] || MessageSquare;
            
            return (
              <Link key={category.slug} href={`/category/${category.slug}`} data-testid={`link-category-${category.slug}`}>
                <Card className="h-full hover-elevate active-elevate-2 cursor-pointer" data-testid={`card-category-${category.slug}`}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-lg bg-primary/10`}>
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base mb-1" data-testid={`text-category-name-${category.slug}`}>
                          {category.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs" data-testid={`badge-threads-${category.slug}`}>
                            <MessageSquare className="w-3 h-3 mr-1" />
                            {category.threadCount} threads
                          </Badge>
                          <Badge variant="outline" className="text-xs" data-testid={`badge-posts-${category.slug}`}>
                            <FileText className="w-3 h-3 mr-1" />
                            {category.postCount} posts
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm" data-testid={`text-category-description-${category.slug}`}>
                      {category.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Statistics Summary */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold" data-testid="stat-total-categories">
                {categories?.length || 0}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Threads</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold" data-testid="stat-total-threads">
                {(categories?.reduce((sum, cat) => sum + cat.threadCount, 0) ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold" data-testid="stat-total-posts">
                {(categories?.reduce((sum, cat) => sum + cat.postCount, 0) ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <EnhancedFooter />
    </div>
  );
}
