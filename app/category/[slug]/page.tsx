import { db } from '@/lib/db';
import { forumThreads, forumCategories } from '../../../shared/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  Eye,
  TrendingUp,
  ArrowLeft,
  Calendar,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = await db.query.forumCategories.findFirst({
    where: eq(forumCategories.slug, params.slug),
  });

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  const description = category.description || `Discussions about ${category.name} on YoForex`;

  return {
    title: `${category.name} - YoForex Forum`,
    description,
    keywords: ['forex', 'trading', 'EA', 'expert advisor', category.name || ''],
    openGraph: {
      title: `${category.name} - YoForex Forum`,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${category.name} - YoForex Forum`,
      description,
    },
    alternates: {
      canonical: `/category/${params.slug}`,
    },
  };
}

// Main Category Page Component (Server Component)
export default async function CategoryPage({ params }: { params: { slug: string } }) {
  // Fetch category
  const category = await db.query.forumCategories.findFirst({
    where: eq(forumCategories.slug, params.slug),
  });

  if (!category) {
    notFound();
  }

  // Fetch threads in this category
  const threads = await db.query.forumThreads.findMany({
    where: eq(forumThreads.categorySlug, params.slug),
    with: {
      author: true,
    },
    orderBy: [
      desc(forumThreads.isPinned),
      desc(forumThreads.engagementScore),
    ],
    limit: 50,
  });

  // Generate JSON-LD CollectionPage Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description || `Discussions about ${category.name}`,
    url: `/category/${params.slug}`,
    numberOfItems: threads.length,
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
            <Link href="/categories" className="hover:text-foreground">
              Categories
            </Link>
            <span>/</span>
            <span className="text-foreground">{category.name}</span>
          </nav>

          {/* Category Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-3">{category.name}</h1>
                  {category.description && (
                    <p className="text-lg text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {threads.length} threads
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Threads List */}
          <div className="space-y-3">
            {threads.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-2xl font-bold mb-2">No threads yet</h2>
                  <p className="text-muted-foreground mb-6">
                    Be the first to start a discussion in this category!
                  </p>
                  <Button asChild>
                    <Link href="/discussions">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Browse All Discussions
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              threads.map((thread) => (
                <Card key={thread.id} className="hover-elevate">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Author Avatar */}
                      <Avatar className="h-10 w-10 mt-1">
                        <AvatarFallback>
                          {thread.author?.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      {/* Thread Info */}
                      <div className="flex-1 min-w-0">
                        {/* Title & Badges */}
                        <div className="flex items-start gap-3 mb-2">
                          <Link
                            href={`/thread/${thread.slug}`}
                            className="text-xl font-semibold hover:text-primary flex-1"
                          >
                            {thread.title}
                          </Link>
                          <div className="flex gap-2 flex-shrink-0">
                            {thread.isPinned && (
                              <Badge variant="secondary">Pinned</Badge>
                            )}
                            {thread.isLocked && (
                              <Badge variant="outline">Locked</Badge>
                            )}
                          </div>
                        </div>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <Link
                            href={`/user/${thread.author?.username || 'unknown'}`}
                            className="hover:text-foreground font-medium"
                          >
                            {thread.author?.username || 'Unknown'}
                          </Link>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{thread.views || 0} views</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{thread.replyCount || 0} replies</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <time dateTime={thread.createdAt?.toISOString()}>
                              {thread.createdAt && formatDistanceToNow(new Date(thread.createdAt), {
                                addSuffix: true,
                              })}
                            </time>
                          </div>
                        </div>

                        {/* Preview (if available) */}
                        {thread.content && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {thread.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Back Link */}
          <div className="pt-6">
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to All Categories
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

// Generate static params for all categories
export async function generateStaticParams() {
  const categories = await db.query.forumCategories.findMany();

  return categories.map((category) => ({
    slug: category.slug,
  }));
}
