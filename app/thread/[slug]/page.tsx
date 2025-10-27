import { db } from '@/lib/db';
import { forumThreads, forumReplies, users } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Eye, MessageSquare, ArrowLeft, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { ReplySection } from './ReplySection';

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const thread = await db.query.forumThreads.findFirst({
    where: eq(forumThreads.slug, params.slug),
    with: {
      author: true,
    },
  });

  if (!thread) {
    return {
      title: 'Thread Not Found',
    };
  }

  const description = thread.meta_description || thread.content?.substring(0, 160) || `Discussion about ${thread.title}`;

  return {
    title: `${thread.title} - YoForex Forum`,
    description,
    keywords: thread.focus_keywords?.split(',') || ['forex', 'trading', 'EA', 'expert advisor'],
    authors: [{ name: thread.author?.username || 'YoForex User' }],
    openGraph: {
      title: thread.title || '',
      description,
      type: 'article',
      publishedTime: thread.createdAt?.toISOString(),
      authors: [thread.author?.username || 'YoForex User'],
      images: thread.cover_image ? [{ url: thread.cover_image }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: thread.title || '',
      description,
      images: thread.cover_image ? [thread.cover_image] : [],
    },
    alternates: {
      canonical: `/thread/${params.slug}`,
    },
  };
}

// Main Thread Page Component (Server Component)
export default async function ThreadPage({ params }: { params: { slug: string } }) {
  // Fetch thread with author and category
  const thread = await db.query.forumThreads.findFirst({
    where: eq(forumThreads.slug, params.slug),
    with: {
      author: true,
    },
  });

  if (!thread) {
    notFound();
  }

  // Fetch all replies with nested structure
  const allReplies = await db.query.forumReplies.findMany({
    where: eq(forumReplies.threadId, thread.id),
    with: {
      author: true,
    },
    orderBy: (replies, { asc }) => [asc(replies.createdAt)],
  });

  // Increment view count (fire-and-forget to Express API)
  try {
    const EXPRESS_URL = process.env.EXPRESS_URL || 'http://localhost:5000';
    fetch(`${EXPRESS_URL}/api/threads/${thread.id}/view`, {
      method: 'POST',
    }).catch(() => {});
  } catch (e) {
    // Silently fail if Express is not available
  }

  // Generate JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: thread.title,
    text: thread.content || '',
    datePublished: thread.createdAt?.toISOString(),
    dateModified: thread.updatedAt?.toISOString(),
    author: {
      '@type': 'Person',
      name: thread.author?.username || 'Anonymous',
    },
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: thread.replyCount || 0,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ViewAction',
        userInteractionCount: thread.views || 0,
      },
    ],
    ...(thread.cover_image && {
      image: thread.cover_image,
    }),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />

      <main className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <span>/</span>
            {thread.categorySlug && (
              <>
                <Link
                  href={`/category/${thread.categorySlug}`}
                  className="hover:text-foreground"
                >
                  {thread.categorySlug}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-foreground line-clamp-1">{thread.title}</span>
          </nav>

          {/* Thread Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-bold mb-4 break-words">
                    {thread.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>
                          {thread.author?.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <Link
                        href={`/user/${thread.author?.username || 'unknown'}`}
                        className="hover:text-foreground font-medium"
                      >
                        {thread.author?.username || 'Unknown'}
                      </Link>
                    </div>
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
                    <time dateTime={thread.createdAt?.toISOString()}>
                      {thread.createdAt && formatDistanceToNow(new Date(thread.createdAt), {
                        addSuffix: true,
                      })}
                    </time>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {thread.isPinned && (
                    <Badge variant="secondary">
                      Pinned
                    </Badge>
                  )}
                  {thread.isLocked && (
                    <Badge variant="outline">
                      Locked
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6">
              {/* Thread Content */}
              <article
                className="prose prose-slate dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: thread.content || '' }}
              />

              {/* Tags */}
              {thread.focus_keywords && (
                <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {thread.focus_keywords.split(',').map((tag) => (
                    <Badge key={tag.trim()} variant="outline" className="text-xs">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Replies Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              {thread.replyCount || 0} {thread.replyCount === 1 ? 'Reply' : 'Replies'}
            </h2>

            {/* Client Component for Replies (interactive) */}
            <ReplySection
              threadId={thread.id}
              threadSlug={params.slug}
              replies={allReplies}
              isLocked={thread.isLocked || false}
              threadAuthorId={thread.authorId || ''}
            />
          </div>

          {/* Back to Forum Link */}
          <div className="pt-6">
            <Link
              href="/discussions"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to All Discussions
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Enable Incremental Static Regeneration (ISR)
// Page will be regenerated every 60 seconds when requested
export const revalidate = 60;

// Generate static params for top threads (pre-render at build time)
export async function generateStaticParams() {
  const topThreads = await db.query.forumThreads.findMany({
    limit: 100,
    orderBy: (threads, { desc }) => [desc(threads.views)],
  });

  return topThreads.map((thread) => ({
    slug: thread.slug,
  }));
}
