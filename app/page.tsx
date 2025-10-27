import { db } from '../lib/db';
import { forumThreads, content, forumCategories, users } from '../shared/schema';
import { desc, sql } from 'drizzle-orm';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { Metadata } from 'next';
import {
  TrendingUp,
  MessageSquare,
  Users,
  Package,
  Eye,
  Star,
  ChevronRight,
  Flame,
  Award,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// Homepage metadata
export const metadata: Metadata = {
  title: 'YoForex - Expert Advisor Forum & EA Marketplace',
  description: 'Join 10,000+ forex traders. Download free EAs, share strategies, and earn coins. #1 MT4/MT5 EA community with verified backtests and live results.',
  keywords: ['forex forum', 'EA marketplace', 'Expert Advisor', 'MT4', 'MT5', 'forex trading', 'algorithmic trading', 'free EAs', 'trading robots'],
};

// Main Homepage Component (Server Component with parallel queries)
export default async function HomePage() {
  // Parallel data fetching for maximum performance
  const [stats, hotThreads, topContent, categories] = await Promise.all([
    // Global stats
    db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM forum_threads) as total_threads,
        (SELECT COUNT(*) FROM users) as total_members,
        (SELECT COUNT(*) FROM forum_replies) as total_replies,
        (SELECT COUNT(*) FROM content) as total_content
    `),
    
    // Hot threads (top 6 by engagement score)
    db.query.forumThreads.findMany({
      with: {
        author: true,
      },
      orderBy: [desc(forumThreads.engagementScore)],
      limit: 6,
    }),
    
    // Top content (top 6 by sales score)
    db.query.content.findMany({
      with: {
        author: true,
      },
      orderBy: [desc(content.salesScore)],
      limit: 6,
    }),
    
    // All categories
    db.query.forumCategories.findMany(),
  ]);

  const globalStats = stats.rows[0] as any;

  // JSON-LD structured data for homepage
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'YoForex',
    url: 'https://yoforex.net',
    description: 'Expert Advisor forum and marketplace for MT4/MT5 algorithmic trading',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://yoforex.net/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
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

      <main>
        {/* Hero Section */}
        <section className="border-b bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                The #1 Expert Advisor Community
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Download free EAs, share profitable strategies, and earn coins.
                Join {parseInt(globalStats.total_members || '0').toLocaleString()}+ traders building the future of algorithmic trading.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <a href={process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000'}>
                  <Button size="lg" data-testid="button-browse-eas">
                    <Download className="mr-2 h-5 w-5" />
                    Browse Free EAs
                  </Button>
                </a>
                <Link href="/discussions">
                  <Button size="lg" variant="outline" data-testid="button-join-discussions">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Join Discussions
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <div className="text-3xl font-bold" data-testid="text-total-threads">
                    {parseInt(globalStats.total_threads || '0').toLocaleString()}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Discussions</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-primary" />
                  <div className="text-3xl font-bold" data-testid="text-total-content">
                    {parseInt(globalStats.total_content || '0').toLocaleString()}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">EAs & Tools</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div className="text-3xl font-bold" data-testid="text-total-members">
                    {parseInt(globalStats.total_members || '0').toLocaleString()}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div className="text-3xl font-bold" data-testid="text-total-replies">
                    {parseInt(globalStats.total_replies || '0').toLocaleString()}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-7xl mx-auto space-y-12">
            {/* What's Hot - Trending Discussions */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Flame className="h-6 w-6 text-orange-500" />
                    What's Hot
                  </h2>
                  <p className="text-muted-foreground">Trending discussions right now</p>
                </div>
                <Link href="/discussions">
                  <Button variant="ghost" size="sm" data-testid="link-view-all-discussions">
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hotThreads.map((thread: any) => (
                  <Card key={thread.id} className="hover-elevate" data-testid={`card-thread-${thread.id}`}>
                    <CardContent className="p-5">
                      <Link href={`/thread/${thread.slug}`}>
                        <h3 className="font-semibold mb-2 line-clamp-2 hover:text-primary">
                          {thread.title}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-4">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{thread.views || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{thread.replyCount || 0}</span>
                        </div>
                        {thread.author && (
                          <Link
                            href={`/user/${thread.author.username || 'unknown'}`}
                            className="flex items-center gap-1 ml-auto hover:text-foreground"
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs">
                                {thread.author.username?.[0]?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{thread.author.username || 'Unknown'}</span>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Top Content - Marketplace Highlights */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Award className="h-6 w-6 text-yellow-500" />
                    Top Rated Content
                  </h2>
                  <p className="text-muted-foreground">Best EAs and indicators from the community</p>
                </div>
                <a href={`${process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000'}/marketplace`}>
                  <Button variant="ghost" size="sm" data-testid="link-view-marketplace">
                    Browse Marketplace
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topContent.map((item: any) => (
                  <Card key={item.id} className="hover-elevate" data-testid={`card-content-${item.id}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="secondary">{item.type}</Badge>
                        {(item.price || 0) === 0 ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                            Free
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            {item.price || 0} coins
                          </Badge>
                        )}
                      </div>

                      <Link href={`/content/${item.slug}`}>
                        <h3 className="font-semibold mb-2 line-clamp-2 hover:text-primary">
                          {item.title}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{(item.averageRating || 0).toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          <span>{item.downloads || 0}</span>
                        </div>
                        {item.author && (
                          <Link
                            href={`/user/${item.author.username || 'unknown'}`}
                            className="flex items-center gap-1 ml-auto hover:text-foreground"
                          >
                            <span className="text-xs">{item.author.username || 'Unknown'}</span>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Categories Grid */}
            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Forum Categories</h2>
                <p className="text-muted-foreground">Find discussions by topic</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {categories.slice(0, 10).map((category) => (
                  <Link key={category.slug} href={`/category/${category.slug}`}>
                    <Card className="hover-elevate h-full" data-testid={`card-category-${category.slug}`}>
                      <CardContent className="p-4 text-center">
                        <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {category.threadCount || 0} threads
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              <div className="text-center mt-6">
                <Link href="/categories">
                  <Button variant="outline" data-testid="link-view-all-categories">
                    View All Categories
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Enable ISR with 60s revalidation
export const revalidate = 60;
