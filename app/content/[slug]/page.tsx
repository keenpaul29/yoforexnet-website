import { Metadata } from 'next';
import ContentDetailClient from './ContentDetailClient';
import type { Content, User as UserType, ContentReview } from '@shared/schema';

// Express API base URL
const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    // Check if slug is UUID format
    const isUUID = slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    const endpoint = isUUID 
      ? `${EXPRESS_URL}/api/content/${slug}`
      : `${EXPRESS_URL}/api/content/slug/${slug}`;

    const res = await fetch(endpoint, { cache: 'no-store' });
    if (!res.ok) {
      return {
        title: 'Content Not Found | YoForex Marketplace',
      };
    }

    const content: Content = await res.json();
    
    // Get cover image
    const images = content.images || [];
    const coverImage = images.find(img => img.isCover) || images[0];
    
    // Create description from content description (first 150 chars)
    const description = content.description 
      ? content.description.substring(0, 150) + (content.description.length > 150 ? '...' : '')
      : `Download ${content.title} - ${content.type} for MT4/MT5`;
    
    // Get tags as keywords
    const tags = content.tags || [];
    const keywords = tags.length > 0 ? tags.join(', ') : 'forex, EA, indicator, MT4, MT5';

    return {
      title: `${content.title} | YoForex Marketplace`,
      description,
      keywords,
      openGraph: {
        title: content.title,
        description,
        images: coverImage?.url ? [{ url: coverImage.url }] : [],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: content.title,
        description,
        images: coverImage?.url ? [coverImage.url] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Content Not Found | YoForex Marketplace',
    };
  }
}

// Main page component (Server Component)
export default async function ContentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Check if slug is UUID format
  const isUUID = slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  const contentEndpoint = isUUID 
    ? `${EXPRESS_URL}/api/content/${slug}`
    : `${EXPRESS_URL}/api/content/slug/${slug}`;

  // Fetch content with error handling that doesn't trigger Next.js 404
  let content: Content | null = null;
  try {
    const contentRes = await fetch(contentEndpoint, { 
      cache: 'no-store',
      // Prevent Next.js from treating this as a 404 route
    });
    if (contentRes.ok) {
      content = await contentRes.json();
    }
  } catch (error) {
    // Swallow error - we'll show custom error card
    content = null;
  }

  // If content not found, return Client Component with null content to show custom error card
  if (!content) {
    return (
      <ContentDetailClient
        slug={slug}
        initialContent={null}
        initialAuthor={null}
        initialReviews={[]}
        initialSimilarContent={[]}
        initialAuthorReleases={[]}
      />
    );
  }

  // Fetch all additional data in parallel
  const [authorRes, reviewsRes, similarContentRes, authorReleasesRes] = await Promise.all([
    // Fetch author
    content.authorId 
      ? fetch(`${EXPRESS_URL}/api/user/${content.authorId}`, { cache: 'no-store' }).catch(() => null)
      : Promise.resolve(null),
    
    // Fetch reviews
    content.id 
      ? fetch(`${EXPRESS_URL}/api/content/${content.id}/reviews`, { cache: 'no-store' }).catch(() => null)
      : Promise.resolve(null),
    
    // Fetch similar content (same category)
    content.category 
      ? fetch(`${EXPRESS_URL}/api/content?category=${content.category}&limit=5`, { cache: 'no-store' }).catch(() => null)
      : Promise.resolve(null),
    
    // Fetch author's other releases
    content.authorId 
      ? fetch(`${EXPRESS_URL}/api/user/${content.authorId}/content`, { cache: 'no-store' }).catch(() => null)
      : Promise.resolve(null),
  ]);

  // Parse responses
  const author = authorRes?.ok ? await authorRes.json() : null;
  const reviews = reviewsRes?.ok ? await reviewsRes.json() : [];
  const similarContent = similarContentRes?.ok ? await similarContentRes.json() : [];
  const authorReleases = authorReleasesRes?.ok ? await authorReleasesRes.json() : [];

  // Pass all data to Client Component
  return (
    <ContentDetailClient
      slug={slug}
      initialContent={content}
      initialAuthor={author}
      initialReviews={reviews}
      initialSimilarContent={similarContent}
      initialAuthorReleases={authorReleases}
    />
  );
}

// Enable dynamic rendering with no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
