import { db } from '../../lib/db';
import { content, users } from '../../shared/schema';
import { desc, eq, and, or, ilike, gt, sql, asc } from 'drizzle-orm';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Star, Download, Heart, Coins, Package, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import MarketplaceFilters from './MarketplaceFilters';
import PaginationControls from '../discussions/PaginationControls';

// ISR - Revalidate every 60 seconds
export const revalidate = 60;

const ITEMS_PER_PAGE = 12;

// SEO Metadata
export const metadata: Metadata = {
  title: 'EA Marketplace - Download Expert Advisors & Indicators | YoForex',
  description: 'Browse 1000+ Expert Advisors, indicators, and trading tools. Download free EAs or purchase premium strategies. Verified backtests, user reviews, and live performance data.',
  keywords: ['EA marketplace', 'Expert Advisor download', 'MT4 EA', 'MT5 EA', 'forex indicators', 'trading robots', 'free EA', 'premium EA'],
  openGraph: {
    title: 'EA Marketplace - YoForex',
    description: 'Browse 1000+ Expert Advisors, indicators, and trading tools. Download free EAs or purchase premium strategies.',
    type: 'website',
    url: 'https://yoforex.net/marketplace',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EA Marketplace - YoForex',
    description: 'Browse Expert Advisors, indicators, and trading tools.',
  },
};

// Helper function to get content type label
function getTypeLabel(type: string): string {
  switch (type) {
    case 'ea':
      return 'EA';
    case 'indicator':
      return 'Indicator';
    case 'article':
      return 'Article';
    case 'source_code':
      return 'Source Code';
    default:
      return type;
  }
}

// Helper function to get content type badge variant
function getTypeBadgeColor(type: string) {
  switch (type) {
    case 'ea':
      return 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    case 'indicator':
      return 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    case 'article':
      return 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
    case 'source_code':
      return 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
  }
}

// Helper function to get image URL
function getImageUrl(item: any): string {
  if (item.postLogoUrl) return item.postLogoUrl;
  if (item.imageUrls && item.imageUrls.length > 0) return item.imageUrls[0];
  if (item.imageUrl) return item.imageUrl;
  return 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop';
}

// Helper function to build order by clause based on sort param
function getOrderByClause(sort: string) {
  switch (sort) {
    case 'popular':
      return [desc(content.downloads)];
    case 'rating':
      return [desc(sql`COALESCE(${content.averageRating}, 0)`)];
    case 'price-low':
      return [asc(content.priceCoins)];
    case 'price-high':
      return [desc(content.priceCoins)];
    case 'latest':
    default:
      return [desc(content.createdAt)];
  }
}

// Main Server Component
export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Parse URL parameters
  const search = searchParams.search as string | undefined;
  const type = searchParams.type as string | undefined;
  const price = searchParams.price as string | undefined;
  const platform = searchParams.platform as string | undefined;
  const sort = (searchParams.sort as string) || 'latest';
  const featured = searchParams.featured === 'true';
  const page = parseInt((searchParams.page as string) || '1', 10);

  // Build dynamic query conditions
  const conditions: any[] = [eq(content.status, 'approved')];

  // Search filter - search in title and description
  if (search && search.trim()) {
    conditions.push(
      or(
        ilike(content.title, `%${search.trim()}%`),
        ilike(content.description, `%${search.trim()}%`)
      )
    );
  }

  // Content type filter
  if (type && type !== 'all') {
    conditions.push(eq(content.type, type as any));
  }

  // Price filter
  if (price === 'free') {
    conditions.push(eq(content.priceCoins, 0));
  } else if (price === 'paid') {
    conditions.push(gt(content.priceCoins, 0));
  }

  // Platform filter
  if (platform && platform !== 'all') {
    conditions.push(eq(content.platform, platform as any));
  }

  // Featured filter
  if (featured) {
    conditions.push(eq(content.isFeatured, true));
  }

  // Build the where clause
  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

  // Get order by clause
  const orderByClause = getOrderByClause(sort);

  // Fetch content items with pagination
  const contentItems: any = await db.query.content.findMany({
    with: {
      author: true,
    },
    where: whereClause,
    orderBy: orderByClause,
    limit: ITEMS_PER_PAGE,
    offset: (page - 1) * ITEMS_PER_PAGE,
  });

  // Get total count for pagination
  const totalCountResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(content)
    .where(whereClause);
  
  const totalItems = totalCountResult[0]?.count || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'EA Marketplace',
    description: 'Browse Expert Advisors, indicators, and trading tools',
    url: 'https://yoforex.net/marketplace',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: totalItems,
      itemListElement: contentItems.slice(0, 20).map((item: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'SoftwareApplication',
          name: item.title,
          applicationCategory: getTypeLabel(item.type),
          offers: {
            '@type': 'Offer',
            price: item.priceCoins === 0 ? '0' : item.priceCoins.toString(),
            priceCurrency: 'COINS',
          },
          aggregateRating: item.averageRating ? {
            '@type': 'AggregateRating',
            ratingValue: item.averageRating,
            ratingCount: item.reviewCount,
          } : undefined,
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
          <h1 className="text-4xl font-bold mb-2" data-testid="heading-marketplace">Marketplace</h1>
          <p className="text-lg text-muted-foreground">
            Discover and download Expert Advisors, Indicators, and Trading Resources
          </p>
        </div>

        {/* Filters Component */}
        <MarketplaceFilters />

        {/* Results Summary */}
        <div className="mb-4 text-sm text-muted-foreground" data-testid="text-results-summary">
          Showing {contentItems.length > 0 ? ((page - 1) * ITEMS_PER_PAGE) + 1 : 0} - {Math.min(page * ITEMS_PER_PAGE, totalItems)} of {totalItems} results
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {contentItems && contentItems.length > 0 ? (
            contentItems.map((item: any) => {
              const authorName = item.author?.firstName && item.author?.lastName
                ? `${item.author.firstName} ${item.author.lastName}`
                : item.author?.username || 'Anonymous';
              const imageUrl = getImageUrl(item);
              const typeBadgeColor = getTypeBadgeColor(item.type);

              return (
                <Link key={item.id} href={`/content/${item.slug}`}>
                  <Card 
                    className="h-full overflow-hidden hover-elevate active-elevate-2 cursor-pointer group"
                    data-testid={`card-content-${item.slug}`}
                  >
                    <CardContent className="p-0">
                      {/* Image */}
                      <div className="aspect-video w-full bg-muted relative overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          data-testid={`img-content-${item.slug}`}
                        />
                        <div className="absolute top-2 right-2">
                          {item.isFeatured && (
                            <Badge variant="default" className="bg-amber-500 hover:bg-amber-600" data-testid={`badge-featured-${item.slug}`}>
                              <Award className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        {/* Type Badge */}
                        <Badge 
                          variant="outline" 
                          className={typeBadgeColor}
                          data-testid={`badge-type-${item.slug}`}
                        >
                          {getTypeLabel(item.type)}
                        </Badge>

                        {/* Title */}
                        <h3 
                          className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors"
                          data-testid={`text-title-${item.slug}`}
                        >
                          {item.title}
                        </h3>

                        {/* Description */}
                        <p 
                          className="text-sm text-muted-foreground line-clamp-2"
                          data-testid={`text-description-${item.slug}`}
                        >
                          {item.description}
                        </p>

                        {/* Author */}
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {authorName[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground" data-testid={`text-author-${item.slug}`}>
                            {authorName}
                          </span>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {item.averageRating && item.averageRating > 0 && (
                            <div className="flex items-center gap-1" data-testid={`text-rating-${item.slug}`}>
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              {item.averageRating.toFixed(1)}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1" data-testid={`text-downloads-${item.slug}`}>
                            <Download className="w-4 h-4" />
                            {(item.downloads || 0).toLocaleString()}
                          </div>

                          <div className="flex items-center gap-1" data-testid={`text-likes-${item.slug}`}>
                            <Heart className="w-4 h-4" />
                            {(item.likes || 0).toLocaleString()}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="pt-3 border-t">
                          {item.priceCoins === 0 ? (
                            <Badge variant="secondary" className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300" data-testid={`badge-price-${item.slug}`}>
                              FREE
                            </Badge>
                          ) : (
                            <div className="flex items-center gap-1.5 font-semibold text-primary" data-testid={`text-price-${item.slug}`}>
                              <Coins className="w-5 h-5" />
                              {item.priceCoins.toLocaleString()} Coins
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full">
              <Card className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No content found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters or search terms
                </p>
              </Card>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <PaginationControls currentPage={page} totalPages={totalPages} basePath="/marketplace" />
        )}

        {/* Stats Summary */}
        {contentItems && contentItems.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-1" data-testid="stat-total-items">
                  {totalItems}
                </div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-1" data-testid="stat-current-page">
                  {contentItems.length}
                </div>
                <div className="text-sm text-muted-foreground">Items on This Page</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-1" data-testid="stat-current-page-num">
                  {page}
                </div>
                <div className="text-sm text-muted-foreground">Current Page</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-1" data-testid="stat-total-pages">
                  {totalPages}
                </div>
                <div className="text-sm text-muted-foreground">Total Pages</div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
