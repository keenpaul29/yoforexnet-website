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
import { getInternalApiUrl } from '@/lib/api-config';
import { getCategoryByPath } from '@/lib/category-path';
import BreadcrumbSchema from '@/components/BreadcrumbSchema';
import { db } from '../../../../lib/db';
import { forumCategories } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';

// Dynamic imports for components with dynamic route segments
const loadThreadClient = () => import('../../thread/[slug]/ThreadDetailClient');
const loadCategoryClient = () => import('../[slug]/CategoryDiscussionClient');
const loadContentClient = () => import('../../content/[slug]/ContentDetailClient');

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
    const apiUrl = getInternalApiUrl();
    const response = await fetch(`${apiUrl}/api/threads/by-slug/${lastSlug}`);
    if (response.ok) {
      const thread = await response.json();
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
    const apiUrl = getInternalApiUrl();
    const response = await fetch(`${apiUrl}/api/content/by-slug/${lastSlug}`);
    if (response.ok) {
      const content = await response.json();
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
    const apiUrl = getInternalApiUrl();
    const response = await fetch(`${apiUrl}/api/threads/by-slug/${lastSlug}`);
    if (response.ok) {
      thread = await response.json();
    }
  } catch (error) {
    // Not a thread
  }
  
  if (thread) {
    // Render thread detail page with hierarchical breadcrumbs
    const { default: ThreadDetailClient } = await loadThreadClient();
    return <ThreadDetailClient slug={lastSlug} />;
  }
  
  // Try to find marketplace content
  let content = null;
  try {
    const apiUrl = getInternalApiUrl();
    const response = await fetch(`${apiUrl}/api/content/by-slug/${lastSlug}`);
    if (response.ok) {
      content = await response.json();
    }
  } catch (error) {
    // Not content either
  }
  
  if (content) {
    // Redirect to content detail page (or render inline)
    // For now, import and render the content client
    const { default: ContentDetailClient } = await loadContentClient();
    return <ContentDetailClient slug={lastSlug} />;
  }
  
  // Must be a category browsing page
  const fullPath = pathSegments.join('/');
  const category = await getCategoryByPath(fullPath);
  
  if (!category) {
    notFound();
  }
  
  // Build breadcrumb path from category hierarchy
  const breadcrumbPath: { name: string; url: string }[] = [
    { name: 'Home', url: '/' },
  ];
  
  // Walk up the category hierarchy to build breadcrumbs
  const categorySegments = fullPath.split('/');
  for (let i = 0; i < categorySegments.length; i++) {
    const segmentPath = categorySegments.slice(0, i + 1).join('/');
    const segmentSlug = categorySegments[i];
    
    // Fetch category name for this segment
    const [segmentCategory] = await db
      .select()
      .from(forumCategories)
      .where(eq(forumCategories.slug, segmentSlug))
      .limit(1);
    
    if (segmentCategory) {
      breadcrumbPath.push({
        name: segmentCategory.name,
        url: `/category/${segmentPath}`,
      });
    }
  }
  
  // Render category discussion page with breadcrumbs
  const { default: CategoryDiscussionClient } = await loadCategoryClient();
  return (
    <>
      <BreadcrumbSchema path={breadcrumbPath} />
      <CategoryDiscussionClient slug={category.slug} />
    </>
  );
}
