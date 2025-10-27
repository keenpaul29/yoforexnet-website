"use client";

import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import StatsBar from "@/components/StatsBar";
import { CategoryTree } from "@/components/CategoryTree";
import ForumThreadCard from "@/components/ForumThreadCard";
import CoinBalance from "@/components/CoinBalance";
import Leaderboard from "@/components/Leaderboard";
import WeekHighlights from "@/components/WeekHighlights";
import TrustLevel from "@/components/TrustLevel";
import WhatsHot from "@/components/WhatsHot";
import TopSellers from "@/components/TopSellers";
import EnhancedFooter from "@/components/EnhancedFooter";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
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
  ShieldAlert,
  Shield,
  Download,
  CheckCircle
} from "lucide-react";

// Icon mapping for category icons
const iconMap: Record<string, any> = {
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
  ShieldAlert,
};

interface HomeClientProps {
  initialStats?: any;
  initialCategories?: any[];
  initialThreads?: any[];
}

export default function HomeClient({ 
  initialStats, 
  initialCategories, 
  initialThreads 
}: HomeClientProps) {
  // Fetch real categories with 60s auto-refresh (now using tree endpoint)
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories/tree/all'],
    initialData: initialCategories,
    refetchInterval: 60000, // Auto-refresh every 60 seconds
    staleTime: 50000,
  });

  // Fetch real threads with 60s auto-refresh
  const { data: threadsData, isLoading: isLoadingThreads } = useQuery({
    queryKey: ['/api/threads'],
    initialData: initialThreads,
    refetchInterval: 60000, // Auto-refresh every 60 seconds
    staleTime: 50000,
  });

  // Flatten category tree for use in CategoryTree component
  const categories = (categoriesData as any[] || []);

  // Create a map of categorySlug to category name for thread mapping
  const categoryMap = new Map(
    (categoriesData as any[] || []).map((cat: any) => [cat.slug, cat.name])
  );

  // Use real threads data and map category slug to category name
  // Only map threads if both threads and categories are loaded
  const recentThreads = (threadsData && categoriesData) 
    ? (threadsData as any[] || [])
        .slice(0, 8)
        .map((thread: any) => ({
          ...thread,
          category: categoryMap.get(thread.categorySlug) || thread.categorySlug || 'General Discussion',
          // Ensure required fields have defaults
          author: thread.author || { name: 'Anonymous', reputation: 0 },
          excerpt: thread.body?.substring(0, 200) || '',
          viewCount: thread.views || 0,
          coinsEarned: thread.coinsEarned || 0,
          isAnswered: thread.isAnswered || false,
          hasSetFile: thread.hasSetFile || false,
          hasBacktest: thread.hasBacktest || false,
          isLiveVerified: thread.isLiveVerified || false,
          lastActivity: thread.lastActivityAt ? new Date(thread.lastActivityAt) : new Date(),
        }))
    : [];


  return (
    <div className="min-h-screen bg-background">
      <Header />
      <StatsBar />
      
      <main className="container max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          <aside className="lg:col-span-1 space-y-4 sm:space-y-6 order-2 lg:order-1">
            <OnboardingChecklist />
            <CoinBalance />
            <TrustLevel />
          </aside>

          <div className="lg:col-span-2 space-y-6 sm:space-y-8 order-1 lg:order-2">
            <section>
              <WeekHighlights />
            </section>

            <section>
              <div className="mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Forum Categories</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Choose the right category for your discussion</p>
              </div>
              
              <CategoryTree categories={categories} />
            </section>

            <section>
              <div className="mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Recent Discussions</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Latest active threads from the community</p>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                {recentThreads.map((thread) => (
                  <ForumThreadCard key={thread.id} {...thread} />
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-1 space-y-4 sm:space-y-6 order-3">
            <WhatsHot />
            <TopSellers />
            <Leaderboard />
            
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Important Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <a 
                  href="#" 
                  className="flex items-center gap-3 p-2 rounded-lg text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid="link-forum-rules"
                >
                  <BookOpen className="w-4 h-4 text-primary dark:text-primary" />
                  <span>Forum Rules</span>
                </a>
                <a 
                  href="#" 
                  className="flex items-center gap-3 p-2 rounded-lg text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid="link-safe-download"
                >
                  <Download className="w-4 h-4 text-primary dark:text-primary" />
                  <span>Safe Download Guide</span>
                </a>
                <a 
                  href="#" 
                  className="flex items-center gap-3 p-2 rounded-lg text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid="link-verified-brokers"
                >
                  <CheckCircle className="w-4 h-4 text-primary dark:text-primary" />
                  <span>Verified Brokers</span>
                </a>
                <a 
                  href="#" 
                  className="flex items-center gap-3 p-2 rounded-lg text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid="link-ea-coding-rules"
                >
                  <Shield className="w-4 h-4 text-primary dark:text-primary" />
                  <span>EA Coding Rules</span>
                </a>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <EnhancedFooter />
    </div>
  );
}
