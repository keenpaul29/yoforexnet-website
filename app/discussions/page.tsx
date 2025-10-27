import { db } from '../../lib/db';
import { forumThreads, forumCategories } from '../../shared/schema';
import { desc, eq, and, or, ilike, asc, count } from 'drizzle-orm';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { Metadata } from 'next';
import { MessageSquare, Eye, CheckCircle, Pin, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import DiscussionFilters from './DiscussionFilters';
import PaginationControls from './PaginationControls';

// ISR - Revalidate every 60 seconds
export const revalidate = 60;

// SEO Metadata
export const metadata: Metadata = {
  title: 'Forum Discussions - YoForex Expert Advisor Community',
  description: 'Browse recent forum discussions about Expert Advisors, MT4/MT5 strategies, backtesting, and algorithmic trading. Join 10,000+ traders sharing knowledge.',
  keywords: ['forex forum', 'EA discussion', 'trading strategies', 'MT4 forum', 'MT5 forum', 'Expert Advisor help', 'algorithmic trading forum'],
  openGraph: {
    title: 'Forum Discussions - YoForex',
    description: 'Browse recent forum discussions about Expert Advisors, MT4/MT5 strategies, and algorithmic trading.',
    type: 'website',
    url: 'https://yoforex.net/discussions',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Forum Discussions - YoForex',
    description: 'Browse recent forum discussions about Expert Advisors and trading strategies.',
  },
};

// Helper function for category color coding
function getCategoryStyles(categorySlug: string) {
  const categoryLower = categorySlug.toLowerCase();
  
  if (categoryLower.includes('strategy') || categoryLower.includes('discussion')) {
    return {
      borderColor: 'border-l-blue-500',
      badgeBg: 'bg-blue-100 dark:bg-blue-950',
      badgeText: 'text-blue-700 dark:text-blue-300',
      badgeBorder: 'border-blue-200 dark:border-blue-800'
    };
  }
  
  if (categoryLower.includes('performance') || categoryLower.includes('report')) {
    return {
      borderColor: 'border-l-green-500',
      badgeBg: 'bg-green-100 dark:bg-green-950',
      badgeText: 'text-green-700 dark:text-green-300',
      badgeBorder: 'border-green-200 dark:border-green-800'
    };
  }
  
  if (categoryLower.includes('ea') || categoryLower.includes('library')) {
    return {
      borderColor: 'border-l-purple-500',
      badgeBg: 'bg-purple-100 dark:bg-purple-950',
      badgeText: 'text-purple-700 dark:text-purple-300',
      badgeBorder: 'border-purple-200 dark:border-purple-800'
    };
  }
  
  if (categoryLower.includes('beginner') || categoryLower.includes('question')) {
    return {
      borderColor: 'border-l-orange-500',
      badgeBg: 'bg-orange-100 dark:bg-orange-950',
      badgeText: 'text-orange-700 dark:text-orange-300',
      badgeBorder: 'border-orange-200 dark:border-orange-800'
    };
  }
  
  if (categoryLower.includes('support') || categoryLower.includes('technical')) {
    return {
      borderColor: 'border-l-red-500',
      badgeBg: 'bg-red-100 dark:bg-red-950',
      badgeText: 'text-red-700 dark:text-red-300',
      badgeBorder: 'border-red-200 dark:border-red-800'
    };
  }
  
  return {
    borderColor: 'border-l-gray-400',
    badgeBg: 'bg-gray-100 dark:bg-gray-800',
    badgeText: 'text-gray-700 dark:text-gray-300',
    badgeBorder: 'border-gray-200 dark:border-gray-700'
  };
}

// Helper function to format category name
function formatCategoryName(slug: string) {
  return slug.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// Main Server Component
export default async function DiscussionsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Parse search parameters
  const search = searchParams.search as string | undefined;
  const category = searchParams.category as string | undefined;
  const sort = (searchParams.sort as string) || 'latest';
  const status = searchParams.status as string | undefined;
  const page = parseInt((searchParams.page as string) || '1', 10);

  const ITEMS_PER_PAGE = 20;
  const offset = (page - 1) * ITEMS_PER_PAGE;

  // Build where conditions
  const conditions = [];

  // Search filter (searches both title and body)
  if (search) {
    conditions.push(
      or(
        ilike(forumThreads.title, `%${search}%`),
        ilike(forumThreads.body, `%${search}%`)
      )
    );
  }

  // Category filter
  if (category) {
    conditions.push(eq(forumThreads.categorySlug, category));
  }

  // Status filters
  if (status === 'solved') {
    conditions.push(eq(forumThreads.isSolved, true));
  } else if (status === 'unsolved') {
    conditions.push(eq(forumThreads.isSolved, false));
  } else if (status === 'pinned') {
    conditions.push(eq(forumThreads.isPinned, true));
  }

  // Always only show approved threads
  conditions.push(eq(forumThreads.status, 'approved'));

  // Build orderBy based on sort parameter
  let orderBy;
  switch (sort) {
    case 'views':
      orderBy = [desc(forumThreads.views)];
      break;
    case 'replies':
      orderBy = [desc(forumThreads.replyCount)];
      break;
    case 'newest':
      orderBy = [desc(forumThreads.createdAt)];
      break;
    case 'latest':
    default:
      orderBy = [desc(forumThreads.lastActivityAt)];
      break;
  }

  // Fetch threads with filters
  const threads: any = await db.query.forumThreads.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      author: true,
    },
    orderBy,
    limit: ITEMS_PER_PAGE,
    offset,
  });

  // Get total count for pagination
  const [{ value: totalCount }] = await db
    .select({ value: count() })
    .from(forumThreads)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Fetch all categories for filter dropdown
  const categories = await db.query.forumCategories.findMany({
    where: eq(forumCategories.isActive, true),
    orderBy: [asc(forumCategories.sortOrder)],
  });

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Forum Discussions',
    description: 'Recent forum discussions about Expert Advisors and trading strategies',
    url: 'https://yoforex.net/discussions',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: threads.length,
      itemListElement: threads.slice(0, 10).map((thread: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'DiscussionForumPosting',
          headline: thread.title,
          url: `https://yoforex.net/thread/${thread.slug}`,
          datePublished: thread.createdAt,
          dateModified: thread.lastActivityAt,
          author: {
            '@type': 'Person',
            name: thread.author?.username || 'Anonymous',
          },
          interactionStatistic: [
            {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/ViewAction',
              userInteractionCount: thread.views,
            },
            {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/CommentAction',
              userInteractionCount: thread.replyCount,
            },
          ],
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
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-discussions">Recent Discussions</h1>
          <p className="text-muted-foreground">
            Browse and filter {totalCount.toLocaleString()} discussions from the community
          </p>
        </div>

        {/* Filters */}
        <DiscussionFilters categories={categories} />

        {/* Results */}
        <div className="space-y-0 mt-6">
          {threads && threads.length > 0 ? (
            threads.map((thread: any) => {
              const categoryStyles = getCategoryStyles(thread.categorySlug);
              const authorName = thread.author?.firstName && thread.author?.lastName
                ? `${thread.author.firstName} ${thread.author.lastName}`
                : thread.author?.username || 'Anonymous';
              const authorInitials = thread.author?.firstName && thread.author?.lastName
                ? `${thread.author.firstName[0]}${thread.author.lastName[0]}`
                : thread.author?.username?.[0]?.toUpperCase() || 'A';

              return (
                <Link key={thread.id} href={`/thread/${thread.slug}`}>
                  <Card 
                    className={`
                      p-6 
                      bg-gray-50 dark:bg-gray-900/50 
                      border border-gray-200 dark:border-gray-800 
                      ${categoryStyles.borderColor} border-l-4 
                      rounded-lg 
                      mb-3 
                      hover:bg-gray-100 dark:hover:bg-gray-900/70 
                      hover:shadow-md 
                      hover:scale-[1.01] 
                      transition-all 
                      cursor-pointer
                      overflow-visible
                    `} 
                    data-testid={`thread-${thread.slug}`}
                  >
                    <div className="flex gap-4">
                      <Avatar className="h-12 w-12 shrink-0" data-testid={`avatar-${thread.slug}`}>
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {authorInitials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2 flex-wrap">
                          <Badge 
                            variant="outline" 
                            className={`${categoryStyles.badgeBg} ${categoryStyles.badgeText} ${categoryStyles.badgeBorder} shrink-0`}
                            data-testid={`badge-category-${thread.slug}`}
                          >
                            {formatCategoryName(thread.categorySlug)}
                          </Badge>
                          
                          {thread.isPinned && (
                            <Badge variant="secondary" className="shrink-0" data-testid={`badge-pinned-${thread.slug}`}>
                              <Pin className="w-3 h-3 mr-1" />
                              Pinned
                            </Badge>
                          )}
                          
                          {thread.isSolved && (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700 shrink-0" data-testid={`badge-solved-${thread.slug}`}>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Solved
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold mb-2 hover:text-primary transition-colors" data-testid={`text-title-${thread.slug}`}>
                          {thread.title}
                        </h3>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3" data-testid={`text-body-${thread.slug}`}>
                          {thread.body}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1.5" data-testid={`text-author-${thread.slug}`}>
                            <span className="font-medium text-foreground">{authorName}</span>
                            {thread.author?.rank && thread.author.rank <= 10 && (
                              <Award className="w-4 h-4 text-amber-500" />
                            )}
                          </div>

                          <div className="flex items-center gap-1" data-testid={`text-views-${thread.slug}`}>
                            <Eye className="w-4 h-4" />
                            {thread.views.toLocaleString()}
                          </div>

                          <div className="flex items-center gap-1" data-testid={`text-replies-${thread.slug}`}>
                            <MessageSquare className="w-4 h-4" />
                            {thread.replyCount} {thread.replyCount === 1 ? 'reply' : 'replies'}
                          </div>

                          <div data-testid={`text-time-${thread.slug}`}>
                            Last active {formatDistanceToNow(new Date(thread.lastActivityAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })
          ) : (
            <Card className="p-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No discussions found</h3>
              <p className="text-muted-foreground mb-6">
                {search || category || status 
                  ? 'Try adjusting your filters to find more discussions.' 
                  : 'Be the first to start a conversation!'}
              </p>
              {!(search || category || status) && (
                <a href={`${process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000'}/publish`}>
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90" data-testid="button-start-discussion">
                    Start a Discussion
                  </button>
                </a>
              )}
            </Card>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <PaginationControls currentPage={page} totalPages={totalPages} basePath="/discussions" />
        )}
      </main>

      <Footer />
    </div>
  );
}
