/**
 * Hierarchical Category & Thread Page (Catch-all Route)
 * 
 * Handles both:
 * 1. Category browsing: /category/trading-strategies/scalping-m1-m15
 * 2. Thread pages: /category/trading-strategies/scalping-m1-m15/thread-slug
 * 
 * SEO-optimized with full hierarchical paths for better search engine discovery
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { apiRequest } from '@/lib/api-config';
import { getCategoryByPath } from '@/lib/category-path';
import ThreadDetailClient from '@/app/thread/[slug]/ThreadDetailClient';
import CategoryDiscussionClient from '@/app/category/[slug]/CategoryDiscussionClient';

type Props = {
  params: { path: string[] };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pathSegments = params.path;
  const lastSlug = pathSegments[pathSegments.length - 1];
  const categoryPath = pathSegments.slice(0, -1).join('/');
  
  // Try to find a thread first (most specific)
  try {
    const thread = await apiRequest(`/api/threads/by-slug/${lastSlug}`, {
      method: 'GET',
    });
    
    if (thread) {
      return {
        title: thread.title,
        description: thread.body?.substring(0, 160) || `Discussion about ${thread.title}`,
        keywords: [
          'forex forum',
          'trading discussion',
          thread.title,
          ...categoryPath.split('/'),
        ],
        openGraph: {
          title: thread.title,
          description: thread.body?.substring(0, 160),
          url: `/category/${pathSegments.join('/')}`,
          type: 'article',
        },
      };
    }
  } catch (error) {
    // Not a thread, continue to check if it's a category
  }
  
  // Check if it's a marketplace content item
  try {
    const content = await apiRequest(`/api/content/by-slug/${lastSlug}`, {
      method: 'GET',
    });
    
    if (content) {
      return {
        title: `${content.title} | YoForex Marketplace`,
        description: content.description?.substring(0, 160) || `Download ${content.title}`,
        keywords: ['forex EA', 'trading indicator', content.title],
        openGraph: {
          title: content.title,
          description: content.description?.substring(0, 160),
          url: `/category/${pathSegments.join('/')}`,
          type: 'article',
        },
      };
    }
  } catch (error) {
    // Not content either
  }
  
  // It must be a category page
  const fullPath = pathSegments.join('/');
  const category = await getCategoryByPath(fullPath);
  
  if (!category) {
    return {
      title: 'Category Not Found | YoForex',
    };
  }
  
  return {
    title: `${category.name} | YoForex Forum`,
    description: category.description || `Browse ${category.name} discussions and content`,
    keywords: ['forex forum', category.name, ...categoryPath.split('/')],
    openGraph: {
      title: category.name,
      description: category.description || `Browse ${category.name} discussions`,
      url: `/category/${fullPath}`,
      type: 'website',
    },
  };
}

export default async function HierarchicalCategoryPage({ params }: Props) {
  const pathSegments = params.path;
  const lastSlug = pathSegments[pathSegments.length - 1];
  const categoryPath = pathSegments.slice(0, -1).join('/');
  
  // Try to find a thread first (most specific content)
  let thread = null;
  try {
    thread = await apiRequest(`/api/threads/by-slug/${lastSlug}`, {
      method: 'GET',
    });
  } catch (error) {
    // Not a thread
  }
  
  if (thread) {
    // Render thread detail page with hierarchical breadcrumbs
    return <ThreadDetailClient slug={lastSlug} />;
  }
  
  // Try to find marketplace content
  let content = null;
  try {
    content = await apiRequest(`/api/content/by-slug/${lastSlug}`, {
      method: 'GET',
    });
  } catch (error) {
    // Not content either
  }
  
  if (content) {
    // Redirect to content detail page (or render inline)
    // For now, import and render the content client
    const { default: ContentDetailClient } = await import('@/app/content/[slug]/ContentDetailClient');
    return <ContentDetailClient slug={lastSlug} />;
  }
  
  // Must be a category browsing page
  const fullPath = pathSegments.join('/');
  const category = await getCategoryByPath(fullPath);
  
  if (!category) {
    notFound();
  }
  
  // Render category discussion page
  return <CategoryDiscussionClient slug={category.slug} />;
}
