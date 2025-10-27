import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '../../../lib/db';
import { brokers, brokerReviews, users } from '../../../shared/schema';
import { eq, desc } from 'drizzle-orm';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, TrendingUp, ExternalLink } from 'lucide-react';
import { StarRating } from '@/components/ui/star-rating';
import { ReviewTabs } from './ReviewTabs';

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const topBrokers = await db
    .select({ slug: brokers.slug })
    .from(brokers)
    .where(eq(brokers.status, 'approved'))
    .orderBy(desc(brokers.reviewCount))
    .limit(10);

  return topBrokers.map((broker) => ({
    slug: broker.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  const broker = await db.query.brokers.findFirst({
    where: eq(brokers.slug, slug),
  });

  if (!broker) {
    return {
      title: 'Broker Not Found',
    };
  }

  return {
    title: `${broker.name} Review 2025 - Is ${broker.name} Regulated? | YoForex`,
    description: `Read verified ${broker.name} reviews from real traders. Check regulation status, spreads, and scam reports. ${broker.reviewCount} community reviews.`,
    openGraph: {
      title: `${broker.name} Review 2025 - Is ${broker.name} Regulated?`,
      description: `Read verified ${broker.name} reviews from real traders. ${broker.reviewCount} community reviews.`,
      type: 'website',
    },
  };
}

export default async function BrokerProfilePage({ params }: PageProps) {
  const { slug } = await params;

  const broker = await db.query.brokers.findFirst({
    where: eq(brokers.slug, slug),
  });

  if (!broker) {
    notFound();
  }

  const reviews = await db
    .select({
      id: brokerReviews.id,
      rating: brokerReviews.rating,
      reviewTitle: brokerReviews.reviewTitle,
      reviewBody: brokerReviews.reviewBody,
      isScamReport: brokerReviews.isScamReport,
      datePosted: brokerReviews.datePosted,
      user: {
        username: users.username,
        reputationScore: users.reputationScore,
      },
    })
    .from(brokerReviews)
    .innerJoin(users, eq(brokerReviews.userId, users.id))
    .where(eq(brokerReviews.brokerId, broker.id))
    .orderBy(desc(brokerReviews.datePosted));

  const relatedBrokers = await db
    .select()
    .from(brokers)
    .where(eq(brokers.status, 'approved'))
    .orderBy(desc(brokers.reviewCount))
    .limit(4);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: broker.name,
    url: broker.websiteUrl,
    description: `${broker.name} - ${broker.regulationSummary || 'Forex broker'}`,
    aggregateRating: broker.overallRating
      ? {
          '@type': 'AggregateRating',
          ratingValue: broker.overallRating,
          reviewCount: broker.reviewCount,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'International',
    },
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
            <Link href="/brokers">
              <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-to-directory">
                ← Back to Directory
              </Button>
            </Link>

            <Card>
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    {broker.logoUrl ? (
                      <img 
                        src={broker.logoUrl} 
                        alt={broker.name} 
                        className="w-full h-full object-cover rounded-md" 
                      />
                    ) : (
                      <TrendingUp className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold" data-testid="text-broker-name">
                        {broker.name}
                      </h1>
                      {broker.isVerified && (
                        <Badge 
                          variant="default" 
                          className="flex items-center gap-1" 
                          data-testid="badge-verified"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                      {broker.scamReportCount > 10 && (
                        <Badge 
                          variant="destructive" 
                          className="flex items-center gap-1" 
                          data-testid="badge-scam-alert"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          High Scam Reports
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div data-testid="rating-stars">
                        {broker.overallRating ? (
                          <StarRating rating={broker.overallRating} />
                        ) : (
                          <span className="text-sm text-muted-foreground">No ratings yet</span>
                        )}
                      </div>
                      {broker.overallRating && (
                        <span className="font-semibold" data-testid="text-rating">
                          {broker.overallRating.toFixed(1)}
                        </span>
                      )}
                      <span className="text-muted-foreground" data-testid="text-review-count">
                        ({broker.reviewCount} reviews)
                      </span>
                      {broker.scamReportCount > 0 && (
                        <span className="text-destructive text-sm" data-testid="text-scam-count">
                          {broker.scamReportCount} scam reports
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      {broker.yearFounded && (
                        <p className="text-sm" data-testid="text-founded">
                          <strong>Founded:</strong> {broker.yearFounded}
                        </p>
                      )}
                      <p className="text-sm" data-testid="text-regulation">
                        <strong>Regulation:</strong> {broker.regulationSummary || 'No regulation information available'}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      {broker.websiteUrl && (
                        <Button asChild data-testid="button-visit-website">
                          <a href={broker.websiteUrl} target="_blank" rel="noopener noreferrer">
                            Visit Website <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <a href={`${process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000'}/brokers/submit-review`}>
                        <Button variant="outline" data-testid="button-write-review">
                          Write a Review
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-medium">{broker.name}</p>
                    </div>
                    {broker.yearFounded && (
                      <div>
                        <p className="text-muted-foreground">Year Founded</p>
                        <p className="font-medium">{broker.yearFounded}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Regulation</p>
                      <p className="font-medium">{broker.regulationSummary || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Verification Status</p>
                      <p className="font-medium">{broker.isVerified ? 'Verified' : 'Not Verified'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Community Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewTabs reviews={reviews} scamReportCount={broker.scamReportCount} />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Overall Rating</span>
                    <span className="font-semibold">
                      {broker.overallRating ? `${broker.overallRating.toFixed(1)}/5.0` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Reviews</span>
                    <span className="font-semibold">{broker.reviewCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Scam Reports</span>
                    <span className={`font-semibold ${broker.scamReportCount > 5 ? 'text-destructive' : ''}`}>
                      {broker.scamReportCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Verified</span>
                    <span className="font-semibold">{broker.isVerified ? 'Yes' : 'No'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Related Brokers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedBrokers
                    .filter((b) => b.id !== broker.id)
                    .slice(0, 3)
                    .map((relatedBroker) => (
                      <Link 
                        key={relatedBroker.id} 
                        href={`/brokers/${relatedBroker.slug}`}
                        data-testid={`link-related-${relatedBroker.slug}`}
                      >
                        <div className="p-3 rounded-md border hover-elevate cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              {relatedBroker.logoUrl ? (
                                <img 
                                  src={relatedBroker.logoUrl} 
                                  alt={relatedBroker.name} 
                                  className="w-full h-full object-cover rounded" 
                                />
                              ) : (
                                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{relatedBroker.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {relatedBroker.reviewCount} reviews
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
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
