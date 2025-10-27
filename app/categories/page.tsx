import { db } from '../../lib/db';
import { forumCategories } from '../../shared/schema';
import Link from 'next/link';
import type { Metadata } from 'next';
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
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

// ISR - Revalidate every 60 seconds
export const revalidate = 60;

// SEO Metadata
export const metadata: Metadata = {
  title: 'Forum Categories - Browse All Discussion Topics | YoForex',
  description: 'Explore 15+ forum categories covering EA strategies, backtesting, live trading, broker reviews, MT4/MT5 tips, and more. Join focused discussions with expert traders.',
  keywords: ['forum categories', 'trading discussions', 'EA strategy forum', 'backtest forum', 'broker reviews', 'MT4 forum', 'MT5 forum', 'trading help'],
  openGraph: {
    title: 'Forum Categories - YoForex',
    description: 'Explore 15+ forum categories covering EA strategies, backtesting, live trading, and more.',
    type: 'website',
    url: 'https://yoforex.net/categories',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Forum Categories - YoForex',
    description: 'Explore forum categories covering EA strategies, backtesting, and trading discussions.',
  },
};

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

// Main Server Component
export default async function CategoriesPage() {
  // Server-side data fetching
  const categories = await db.query.forumCategories.findMany({
    orderBy: (forumCategories, { asc }) => [asc(forumCategories.name)],
  });

  // Calculate total stats
  const totalThreads = categories.reduce((sum, cat) => sum + cat.threadCount, 0);
  const totalPosts = categories.reduce((sum, cat) => sum + cat.postCount, 0);

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Forum Categories',
    description: 'Browse all forum categories for Expert Advisor discussions',
    url: 'https://yoforex.net/categories',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: categories.length,
      itemListElement: categories.map((category, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Thing',
          name: category.name,
          description: category.description,
          url: `https://yoforex.net/category/${category.slug}`,
        },
      })),
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />

      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-categories">Forum Categories</h1>
          <p className="text-muted-foreground">
            Browse all discussion categories. Choose the right place for your questions and contributions.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories && categories.length > 0 ? (
            categories.map((category) => {
              const IconComponent = iconMap[category.slug] || MessageSquare;
              
              return (
                <Link key={category.slug} href={`/category/${category.slug}`} data-testid={`link-category-${category.slug}`}>
                  <Card 
                    className="h-full hover-elevate active-elevate-2 cursor-pointer" 
                    data-testid={`card-category-${category.slug}`}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="p-3 rounded-lg bg-primary/10 shrink-0">
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
            })
          ) : (
            <div className="col-span-full">
              <Card className="p-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No categories available</h3>
                <p className="text-muted-foreground">
                  Categories will appear here once they are created.
                </p>
              </Card>
            </div>
          )}
        </div>

        {/* Statistics Summary */}
        {categories && categories.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="stat-total-categories">
                  {categories.length}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Threads</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="stat-total-threads">
                  {totalThreads.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="stat-total-posts">
                  {totalPosts.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Most Active Categories */}
        {categories && categories.length > 3 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Most Active Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...categories]
                .sort((a, b) => b.threadCount - a.threadCount)
                .slice(0, 3)
                .map((category) => {
                  const IconComponent = iconMap[category.slug] || MessageSquare;
                  
                  return (
                    <Link key={`active-${category.slug}`} href={`/category/${category.slug}`}>
                      <Card className="hover-elevate active-elevate-2 cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <IconComponent className="w-5 h-5 text-primary" />
                            </div>
                            <CardTitle className="text-base">{category.name}</CardTitle>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              {category.threadCount}
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {category.postCount}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
