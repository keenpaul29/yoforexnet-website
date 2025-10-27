import { Metadata } from 'next';
import { db } from '../../lib/db';
import { brokers } from '../../shared/schema';
import { desc, eq, and, ilike, gte, asc, sql, SQL } from 'drizzle-orm';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrokerFilters } from './BrokerFilters';
import PaginationControls from '../discussions/PaginationControls';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Best Forex Brokers 2025 - Regulated MT5 Brokers | YoForex',
    description: 'Discover the best forex brokers of 2025. Read verified reviews, compare spreads, and find regulated MT4/MT5 brokers. Community-driven ratings and scam reports.',
    openGraph: {
      title: 'Best Forex Brokers 2025 - Regulated MT5 Brokers',
      description: 'Discover the best forex brokers of 2025. Read verified reviews, compare spreads, and find regulated MT4/MT5 brokers.',
      type: 'website',
    },
  };
}

interface BrokersPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function BrokersPage({ searchParams }: BrokersPageProps) {
  // Parse search params
  const search = searchParams.search as string | undefined;
  const regulation = searchParams.regulation as string | undefined;
  const platform = searchParams.platform as string | undefined;
  const spreadType = searchParams.spreadType as string | undefined;
  const minRating = searchParams.minRating ? parseFloat(searchParams.minRating as string) : undefined;
  const sort = (searchParams.sort as string) || 'rating';
  const page = parseInt((searchParams.page as string) || '1', 10);

  const ITEMS_PER_PAGE = 12;

  // Build dynamic where conditions
  const conditions: SQL[] = [eq(brokers.status, 'approved')];

  if (search) {
    conditions.push(ilike(brokers.name, `%${search}%`));
  }

  if (regulation && regulation !== 'all') {
    conditions.push(eq(brokers.regulation, regulation));
  }

  if (platform && platform !== 'all') {
    conditions.push(eq(brokers.platform, platform));
  }

  if (spreadType && spreadType !== 'all') {
    conditions.push(eq(brokers.spreadType, spreadType));
  }

  if (minRating) {
    conditions.push(gte(brokers.overallRating, minRating));
  }

  // Build where clause
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Determine sort order
  let orderByClause;
  switch (sort) {
    case 'rating':
      orderByClause = [desc(brokers.overallRating), desc(brokers.reviewCount)];
      break;
    case 'name':
      orderByClause = [asc(brokers.name)];
      break;
    case 'spread':
      orderByClause = [asc(brokers.minSpread), desc(brokers.reviewCount)];
      break;
    default:
      orderByClause = [desc(brokers.reviewCount)];
  }

  // Fetch paginated brokers
  const allBrokers = await db
    .select()
    .from(brokers)
    .where(whereClause)
    .orderBy(...orderByClause)
    .limit(ITEMS_PER_PAGE)
    .offset((page - 1) * ITEMS_PER_PAGE);

  // Get total count for pagination
  const [{ count: totalCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(brokers)
    .where(whereClause);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Best Forex Brokers 2025',
    description: 'Community-reviewed forex brokers with verified ratings',
    numberOfItems: totalCount,
    itemListElement: allBrokers.slice(0, 10).map((broker, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'LocalBusiness',
        '@id': `${process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000'}/brokers/${broker.slug}`,
        name: broker.name,
        url: broker.websiteUrl,
        aggregateRating: broker.overallRating
          ? {
              '@type': 'AggregateRating',
              ratingValue: broker.overallRating,
              reviewCount: broker.reviewCount,
              bestRating: 5,
              worstRating: 1,
            }
          : undefined,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Broker Directory</h1>
            <p className="text-lg text-muted-foreground">
              Community-driven broker reviews and ratings. Submit your review and earn +50 gold coins.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {allBrokers.length} of {totalCount} brokers
                    </p>
                    <a href={`${process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000'}/brokers/submit-review`}>
                      <Button data-testid="button-submit-review">
                        Submit Review
                      </Button>
                    </a>
                  </div>
                </CardHeader>
                <CardContent>
                  <BrokerFilters 
                    brokers={allBrokers} 
                    totalCount={totalCount}
                    currentPage={page}
                    totalPages={totalPages}
                  />
                  
                  {totalPages > 1 && (
                    <PaginationControls 
                      currentPage={page} 
                      totalPages={totalPages}
                      basePath="/brokers"
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Why Review Brokers?</h3>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Help the community by sharing your broker experience. Your review helps traders avoid scams and find reliable brokers.
                  </p>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Earn +50 coins per approved review</li>
                    <li>Build your reputation</li>
                    <li>Protect other traders</li>
                    <li>Compare broker features</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Top Features</h3>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                    <div>
                      <p className="font-medium">Verified Reviews</p>
                      <p className="text-muted-foreground">Only real trader experiences</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                    <div>
                      <p className="font-medium">Scam Protection</p>
                      <p className="text-muted-foreground">Community-reported scam alerts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                    <div>
                      <p className="font-medium">Regulation Info</p>
                      <p className="text-muted-foreground">Check broker compliance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
