import { Metadata } from 'next';
import CategoryDiscussionClient from './CategoryDiscussionClient';
import type { ForumCategory, ForumThread } from '@shared/schema';

// Express API base URL
const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${EXPRESS_URL}/api/categories/${params.slug}`, { cache: 'no-store' });
    if (!res.ok) {
      return {
        title: 'Category Not Found | YoForex',
      };
    }

    const category: ForumCategory = await res.json();
    
    return {
      title: `${category.name} - Forum Discussions | YoForex`,
      description: `Browse ${category.name} discussions, questions, and expert advice on YoForex`,
      keywords: `${category.name}, forex, MT4, MT5, trading strategies`,
      openGraph: {
        title: `${category.name} - Forum Discussions | YoForex`,
        description: `Browse ${category.name} discussions, questions, and expert advice on YoForex`,
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: `${category.name} - Forum Discussions | YoForex`,
        description: `Browse ${category.name} discussions, questions, and expert advice on YoForex`,
      },
    };
  } catch (error) {
    return {
      title: 'Category Not Found | YoForex',
    };
  }
}

// Main page component (Server Component)
export default async function CategoryDiscussionPage({ params }: { params: { slug: string } }) {
  // Fetch category with error handling that doesn't trigger Next.js 404
  let category: ForumCategory | null = null;
  try {
    const categoryRes = await fetch(`${EXPRESS_URL}/api/categories/${params.slug}`, { 
      cache: 'no-store',
    });
    if (categoryRes.ok) {
      category = await categoryRes.json();
    }
  } catch (error) {
    // Swallow error - we'll show custom error card
    category = null;
  }

  // Fetch threads with error handling
  let threads: ForumThread[] = [];
  try {
    const threadsRes = await fetch(`${EXPRESS_URL}/api/categories/${params.slug}/threads`, { 
      cache: 'no-store',
    });
    if (threadsRes.ok) {
      threads = await threadsRes.json();
    }
  } catch (error) {
    // Swallow error - we'll show empty state
    threads = [];
  }

  // Pass all data to Client Component
  return (
    <CategoryDiscussionClient
      slug={params.slug}
      initialCategory={category}
      initialThreads={threads}
    />
  );
}

// Enable dynamic rendering with no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
