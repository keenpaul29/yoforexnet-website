import { db } from '@/lib/db';
import { content, contentReviews, users, contentPurchases } from '../../../shared/schema';
import { eq, and, count as drizzleCount } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Download,
  Star,
  Eye,
  ShoppingCart,
  Tag,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ContentActions } from './ContentActions';
import { ReviewSection } from './ReviewSection';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const item = await db.query.content.findFirst({
    where: eq(content.slug, params.slug),
    with: {
      publisher: true,
    },
  });

  if (!item) {
    return {
      title: 'Content Not Found',
    };
  }

  const description =
    item.meta_description ||
    item.description?.substring(0, 160) ||
    `Download ${item.title} - ${item.type} for MT4/MT5`;

  const price = item.price && item.price > 0 ? `${item.price} coins` : 'Free';

  return {
    title: `${item.title} - ${item.type} | YoForex Marketplace`,
    description,
    keywords: item.focus_keywords?.split(',') || ['forex', 'EA', 'indicator', 'MT4', 'MT5'],
    authors: [{ name: item.publisher?.username || 'YoForex User' }],
    openGraph: {
      title: item.title || '',
      description,
      type: 'product',
      images: item.coverImage ? [{ url: item.coverImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: item.title || '',
      description,
      images: item.coverImage ? [item.coverImage] : [],
    },
    alternates: {
      canonical: `/content/${params.slug}`,
    },
  };
}

// Main Content Page Component (Server Component)
export default async function ContentPage({ params }: { params: { slug: string } }) {
  // Fetch content with publisher and reviews
  const item = await db.query.content.findFirst({
    where: eq(content.slug, params.slug),
    with: {
      publisher: true,
    },
  });

  if (!item) {
    notFound();
  }

  // Fetch reviews
  const reviews = await db.query.contentReviews.findMany({
    where: eq(contentReviews.contentId, item.id),
    with: {
      author: true,
    },
    orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
  });

  // Count total downloads/purchases
  const [purchaseCount] = await db
    .select({ count: drizzleCount() })
    .from(contentPurchases)
    .where(eq(contentPurchases.contentId, item.id));

  const totalPurchases = purchaseCount?.count || 0;

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0;

  // Increment view count (fire-and-forget to Express API)
  try {
    const EXPRESS_URL = process.env.EXPRESS_URL || 'http://localhost:5000';
    fetch(`${EXPRESS_URL}/api/content/${item.id}/view`, {
      method: 'POST',
    }).catch(() => {});
  } catch (e) {
    // Silently fail
  }

  // Generate JSON-LD Product Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.title,
    description: item.description || '',
    image: item.coverImage || '',
    offers: {
      '@type': 'Offer',
      price: item.price || 0,
      priceCurrency: 'COINS',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: reviews.length > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toFixed(1),
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
    author: {
      '@type': 'Person',
      name: item.publisher?.username || 'Anonymous',
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <Header />

      <main className="container mx-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <span>/</span>
            <Link href="/marketplace" className="hover:text-foreground">
              Marketplace
            </Link>
            <span>/</span>
            <Link href={`/marketplace?type=${item.type?.toLowerCase()}`} className="hover:text-foreground">
              {item.type}
            </Link>
            <span>/</span>
            <span className="text-foreground line-clamp-1">{item.title}</span>
          </nav>

          {/* Content Header */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left: Image & Quick Actions */}
            <div className="md:col-span-1">
              <Card>
                <CardContent className="p-0">
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt={item.title || ''}
                      className="w-full h-64 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-64 bg-muted rounded-t-lg flex items-center justify-center">
                      <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    {/* Price */}
                    <div className="text-center">
                      {item.price && item.price > 0 ? (
                        <div className="text-3xl font-bold text-primary">
                          {item.price} <span className="text-lg">coins</span>
                        </div>
                      ) : (
                        <Badge className="text-lg py-2 px-4 bg-green-600">
                          FREE
                        </Badge>
                      )}
                    </div>

                    {/* Client-side Actions */}
                    <ContentActions
                      contentId={item.id}
                      price={item.price || 0}
                      isPurchased={false}
                    />

                    <Separator />

                    {/* Stats */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Downloads</span>
                        <span className="font-semibold">{totalPurchases}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Views</span>
                        <span className="font-semibold">{item.views || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Rating</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">
                            {avgRating.toFixed(1)}
                          </span>
                          <span className="text-muted-foreground">({reviews.length})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Content Details */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h1 className="text-4xl font-bold mb-4">{item.title}</h1>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                        {item.publisher?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <Link
                      href={`/user/${item.publisher?.username || 'unknown'}`}
                      className="hover:text-foreground font-medium"
                    >
                      {item.publisher?.username || 'Unknown'}
                    </Link>
                  </div>
                  <span>•</span>
                  <Badge variant="outline">{item.type}</Badge>
                  <span>•</span>
                  <Badge variant="secondary">
                    {item.platformSupport || 'MT4/MT5'}
                  </Badge>
                  <span>•</span>
                  <time dateTime={item.createdAt?.toISOString()}>
                    {item.createdAt && formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                    })}
                  </time>
                </div>

                {/* Short Description */}
                {item.description && (
                  <p className="text-lg text-muted-foreground mb-6">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Tabs/Sections */}
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-bold">Description</h2>
                </CardHeader>
                <CardContent>
                  <article
                    className="prose prose-slate dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: item.content || item.description || '' }}
                  />
                </CardContent>
              </Card>

              {/* Tags */}
              {item.focus_keywords && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      {item.focus_keywords.split(',').map((tag) => (
                        <Badge key={tag.trim()} variant="outline">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold">
                Reviews ({reviews.length})
              </h2>
            </CardHeader>
            <CardContent>
              <ReviewSection
                contentId={item.id}
                contentSlug={params.slug}
                reviews={reviews}
                averageRating={avgRating}
              />
            </CardContent>
          </Card>

          {/* Back Link */}
          <div className="pt-6">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Enable ISR - 60s revalidation
export const revalidate = 60;

// Generate static params for top content
export async function generateStaticParams() {
  const topContent = await db.query.content.findMany({
    limit: 100,
    orderBy: (content, { desc }) => [desc(content.salesScore)],
  });

  return topContent.map((item) => ({
    slug: item.slug,
  }));
}
