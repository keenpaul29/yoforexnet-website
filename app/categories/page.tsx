import type { Metadata } from 'next';
import CategoriesClient from './CategoriesClient';
import type { ForumCategory } from '@shared/schema';

// Express API base URL
const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';

// No caching - always fetch fresh data
export const revalidate = 0;

// SEO Metadata as specified in requirements
export const metadata: Metadata = {
  title: 'Forum Categories | YoForex',
  description: 'Browse all forum categories on YoForex. Find discussions about expert advisors, indicators, brokers, trading strategies, and more.',
  keywords: 'forum categories, EA categories, trading topics, forex discussion categories',
  openGraph: {
    title: 'Forum Categories | YoForex',
    description: 'Browse all forum categories on YoForex. Find discussions about expert advisors, indicators, brokers, trading strategies, and more.',
    type: 'website',
    url: 'https://yoforex.net/categories',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Forum Categories | YoForex',
    description: 'Browse all forum categories on YoForex. Find discussions about expert advisors, indicators, brokers, trading strategies, and more.',
  },
};

// Server Component
export default async function CategoriesPage() {
  // Fetch categories from Express API
  let initialCategories: ForumCategory[] = [];
  
  try {
    const res = await fetch(`${EXPRESS_URL}/api/categories`, {
      cache: 'no-store',
    });

    if (res.ok) {
      initialCategories = await res.json();
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    initialCategories = [];
  }

  // Pass data to Client Component
  return <CategoriesClient initialCategories={initialCategories} />;
}
