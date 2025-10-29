/**
 * Dynamic Schema.org JSON-LD Generator
 * 
 * Complies with:
 * - Schema.org v29.3 (Latest 2025 standard)
 * - Google Rich Results Guidelines 2025
 * - JSON-LD 1.0 specification
 * 
 * Features:
 * - Automatic content type detection
 * - Dynamic schema generation based on page context
 * - Type-safe schema builders
 * - Validation-ready output
 */

import { ForumThread, Content, User, ForumCategory } from '@shared/schema';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type SchemaContext = 'https://schema.org';

export interface BaseSchema {
  '@context': SchemaContext;
  '@type': string;
  '@id'?: string;
}

export interface OrganizationSchema extends BaseSchema {
  '@type': 'Organization';
  name: string;
  url: string;
  logo?: string;
  description?: string;
  email?: string;
  telephone?: string;
  address?: PostalAddress;
  sameAs?: string[];
  foundingDate?: string;
}

export interface PostalAddress {
  '@type': 'PostalAddress';
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
}

export interface WebSiteSchema extends BaseSchema {
  '@type': 'WebSite';
  url: string;
  name: string;
  description?: string;
  inLanguage?: string;
  publisher?: { '@id': string };
  potentialAction?: SearchAction;
}

export interface SearchAction {
  '@type': 'SearchAction';
  target: string | EntryPoint;
  'query-input'?: string;
}

export interface EntryPoint {
  '@type': 'EntryPoint';
  urlTemplate: string;
}

export interface BreadcrumbListSchema extends BaseSchema {
  '@type': 'BreadcrumbList';
  itemListElement: ListItem[];
}

export interface ListItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item?: string | { '@id': string; name: string };
}

export interface ArticleSchema extends BaseSchema {
  '@type': 'Article' | 'BlogPosting' | 'NewsArticle';
  headline: string;
  description?: string;
  image?: string | string[];
  datePublished: string;
  dateModified?: string;
  author: Person | Organization;
  publisher: Organization;
  articleBody?: string;
  wordCount?: number;
  commentCount?: number;
  interactionStatistic?: InteractionCounter;
}

export interface Person {
  '@type': 'Person';
  '@id'?: string;
  name: string;
  url?: string;
  image?: string;
}

export interface Organization {
  '@type': 'Organization';
  '@id'?: string;
  name: string;
  url?: string;
  logo?: ImageObject;
}

export interface ImageObject {
  '@type': 'ImageObject';
  url: string;
  width?: number;
  height?: number;
}

export interface InteractionCounter {
  '@type': 'InteractionCounter';
  interactionType: string;
  userInteractionCount: number;
}

export interface ProductSchema extends BaseSchema {
  '@type': 'Product';
  name: string;
  description?: string;
  image?: string | string[];
  brand?: Brand;
  offers?: Offer;
  aggregateRating?: AggregateRating;
  review?: Review[];
  sku?: string;
  gtin?: string;
}

export interface Brand {
  '@type': 'Brand';
  name: string;
}

export interface Offer {
  '@type': 'Offer';
  url?: string;
  priceCurrency: string;
  price: string | number;
  priceValidUntil?: string;
  availability?: string;
  seller?: Organization;
}

export interface AggregateRating {
  '@type': 'AggregateRating';
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}

export interface Review {
  '@type': 'Review';
  reviewRating: Rating;
  author: Person;
  datePublished?: string;
  reviewBody?: string;
}

export interface Rating {
  '@type': 'Rating';
  ratingValue: number;
  bestRating?: number;
  worstRating?: number;
}

export interface FAQPageSchema extends BaseSchema {
  '@type': 'FAQPage';
  mainEntity: Question[];
}

export interface Question {
  '@type': 'Question';
  name: string;
  acceptedAnswer: Answer;
}

export interface Answer {
  '@type': 'Answer';
  text: string;
}

export interface VideoObjectSchema extends BaseSchema {
  '@type': 'VideoObject';
  name: string;
  description?: string;
  thumbnailUrl?: string | string[];
  uploadDate?: string;
  duration?: string;
  contentUrl?: string;
  embedUrl?: string;
  interactionStatistic?: InteractionCounter;
}

export interface ProfilePageSchema extends BaseSchema {
  '@type': 'ProfilePage';
  mainEntity: Person;
  dateCreated?: string;
  dateModified?: string;
}

export interface PersonSchema extends BaseSchema {
  '@type': 'Person';
  '@id': string;
  name: string;
  url: string;
  image?: string;
  jobTitle?: string;
  description?: string;
  alumniOf?: Organization;
  affiliation?: Organization;
  worksFor?: Organization;
  sameAs?: string[];
  knowsAbout?: string[];
  interactionStatistic?: InteractionCounter[];
}

// ============================================================================
// SITE CONFIGURATION
// ============================================================================

export interface SiteConfig {
  name: string;
  url: string;
  description: string;
  logo: string;
  organizationId: string;
  foundingDate?: string;
  email?: string;
  telephone?: string;
  socialProfiles?: string[];
  searchEndpoint?: string;
}

// Default YoForex configuration
export const SITE_CONFIG: SiteConfig = {
  name: 'YoForex',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://yoforex.com',
  description: 'Global forex trading community platform featuring forum discussions, EA marketplace, broker reviews, and expert insights',
  logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yoforex.com'}/logo.png`,
  organizationId: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yoforex.com'}/#organization`,
  foundingDate: '2024-01-01',
  email: 'contact@yoforex.com',
  socialProfiles: [
    'https://twitter.com/yoforex',
    'https://linkedin.com/company/yoforex',
    'https://facebook.com/yoforex',
  ],
  searchEndpoint: '/search?q={search_term_string}',
};

// ============================================================================
// SCHEMA GENERATORS
// ============================================================================

/**
 * Generate WebSite schema with SearchAction
 * Should be included on all pages (usually in root layout)
 */
export function generateWebSiteSchema(config: SiteConfig = SITE_CONFIG): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${config.url}/#website`,
    url: config.url,
    name: config.name,
    description: config.description,
    inLanguage: 'en-US',
    publisher: {
      '@id': config.organizationId,
    },
    potentialAction: config.searchEndpoint
      ? {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${config.url}${config.searchEndpoint}`,
          },
          'query-input': 'required name=search_term_string',
        }
      : undefined,
  };
}

/**
 * Generate Organization schema
 * Should be included on homepage and about page
 */
export function generateOrganizationSchema(
  config: SiteConfig = SITE_CONFIG
): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': config.organizationId,
    name: config.name,
    url: config.url,
    logo: config.logo,
    description: config.description,
    email: config.email,
    telephone: config.telephone,
    foundingDate: config.foundingDate,
    sameAs: config.socialProfiles,
  };
}

/**
 * Generate BreadcrumbList schema from path segments
 * @param items Array of breadcrumb items with name and url
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: index < items.length - 1 ? item.url : undefined, // Last item shouldn't have URL
    })),
  };
}

/**
 * Generate Article schema for forum threads
 * Complies with Google Rich Results requirements
 */
export function generateArticleSchema(params: {
  thread: ForumThread;
  author?: User;
  canonicalUrl: string;
  category?: ForumCategory;
}): ArticleSchema {
  const { thread, author, canonicalUrl, category } = params;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': canonicalUrl,
    headline: thread.title,
    description: thread.metaDescription || thread.body?.substring(0, 160) || '',
    image: `${SITE_CONFIG.logo}`, // Thread schema doesn't have featured image
    datePublished: new Date(thread.createdAt).toISOString(),
    dateModified: new Date(thread.updatedAt).toISOString(),
    author: author
      ? {
          '@type': 'Person',
          name: author.username,
          url: `${SITE_CONFIG.url}/user/${author.username}`,
        }
      : {
          '@type': 'Person',
          name: 'YoForex Community',
        },
    publisher: {
      '@type': 'Organization',
      '@id': SITE_CONFIG.organizationId,
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: SITE_CONFIG.logo,
      },
    },
    wordCount: thread.body ? thread.body.split(/\s+/).length : 0,
    commentCount: thread.replyCount || 0,
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/ViewAction',
      userInteractionCount: thread.views || 0,
    },
  };
}

/**
 * Generate Product schema for marketplace items
 * Includes offers and ratings if available
 */
export function generateProductSchema(params: {
  content: Content;
  author?: User;
  canonicalUrl: string;
  averageRating?: number;
  reviewCount?: number;
}): ProductSchema {
  const { content, author, canonicalUrl, averageRating, reviewCount } = params;

  const images = content.images || [];
  const coverImage = images.find((img) => img.isCover) || images[0];

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': canonicalUrl,
    name: content.title,
    description: content.description || '',
    image: coverImage?.url || SITE_CONFIG.logo,
    brand: {
      '@type': 'Brand',
      name: SITE_CONFIG.name,
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'USD',
      price: (content as any).price?.toString() || (content as any).coins?.toString() || '0', // Price or coins
      availability: content.status === 'approved' 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        '@id': SITE_CONFIG.organizationId,
        name: SITE_CONFIG.name,
      },
    },
    aggregateRating:
      averageRating && reviewCount
        ? {
            '@type': 'AggregateRating',
            ratingValue: averageRating,
            reviewCount: reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  };
}

/**
 * Generate comprehensive Person schema for user profiles
 * Follows Schema.org 2025 Person specification
 */
export function generatePersonSchema(params: {
  user: User;
  baseUrl: string;
  reputationScore?: number;
  threadCount?: number;
  replyCount?: number;
  badges?: string[];
}): PersonSchema {
  const { user, baseUrl, reputationScore, threadCount, replyCount, badges } = params;
  
  // Build name from firstName/lastName or fallback to username
  const name = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.username;
  
  // Build sameAs array from social profiles
  const sameAs: string[] = [];
  if (user.youtubeUrl) sameAs.push(user.youtubeUrl);
  if (user.instagramHandle) {
    // Handle both full URLs and handles
    const instaUrl = user.instagramHandle.startsWith('http') 
      ? user.instagramHandle 
      : `https://instagram.com/${user.instagramHandle}`;
    sameAs.push(instaUrl);
  }
  if (user.telegramHandle) {
    // Handle both full URLs and handles
    const telegramUrl = user.telegramHandle.startsWith('http') || user.telegramHandle.startsWith('https://t.me/')
      ? user.telegramHandle
      : `https://t.me/${user.telegramHandle}`;
    sameAs.push(telegramUrl);
  }
  if (user.myfxbookLink) sameAs.push(user.myfxbookLink);
  
  // Build knowsAbout from badges (expertise areas)
  const knowsAbout: string[] = [];
  if (badges && badges.length > 0) {
    // Map badge types to expertise areas
    const badgeToExpertise: Record<string, string> = {
      'EA_EXPERT': 'Expert Advisor Development',
      'TRADER_PRO': 'Forex Trading',
      'HELPFUL_MEMBER': 'Community Support',
      'TOP_CONTRIBUTOR': 'Technical Analysis',
      'VERIFIED_TRADER': 'Live Trading',
      'EARLY_ADOPTER': 'Trading Systems',
      'CONTENT_CREATOR': 'Trading Education'
    };
    badges.forEach(badge => {
      if (badgeToExpertise[badge]) {
        knowsAbout.push(badgeToExpertise[badge]);
      }
    });
  }
  
  // Add default expertise based on user level
  if (!knowsAbout.length) {
    knowsAbout.push('Forex Trading', 'Expert Advisors');
  }
  
  // Build interaction statistics
  const interactionStatistic: InteractionCounter[] = [];
  if (threadCount) {
    interactionStatistic.push({
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/CreateAction',
      userInteractionCount: threadCount,
    });
  }
  if (replyCount) {
    interactionStatistic.push({
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/CommentAction',
      userInteractionCount: replyCount,
    });
  }
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${baseUrl}/user/${user.username}#person`,
    name,
    url: `${baseUrl}/user/${user.username}`,
    image: user.profileImageUrl || `${baseUrl}/default-avatar.png`,
    description: `Forex trader and community member on YoForex with ${reputationScore || 0} reputation points`,
    jobTitle: 'Forex Trader',
    worksFor: {
      '@type': 'Organization',
      '@id': `${baseUrl}#organization`,
      name: 'YoForex Community',
      url: baseUrl,
    },
    ...(sameAs.length > 0 && { sameAs }),
    ...(knowsAbout.length > 0 && { knowsAbout }),
    ...(interactionStatistic.length > 0 && { interactionStatistic }),
  };
}

/**
 * Generate ProfilePage schema for user profiles (legacy)
 * Use generatePersonSchema for comprehensive Person schema
 */
export function generateProfilePageSchema(params: {
  user: User;
  canonicalUrl: string;
}): ProfilePageSchema {
  const { user, canonicalUrl } = params;

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': canonicalUrl,
    mainEntity: {
      '@type': 'Person',
      '@id': `${canonicalUrl}#person`,
      name: user.username,
      url: canonicalUrl,
      image: user.profileImageUrl || undefined,
    },
    dateCreated: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
  };
}

/**
 * Generate FAQPage schema from Q&A content
 */
export function generateFAQSchema(
  questions: Array<{ question: string; answer: string }>
): FAQPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

/**
 * Generate VideoObject schema
 */
export function generateVideoSchema(params: {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  uploadDate?: string;
  duration?: string;
  embedUrl?: string;
  views?: number;
}): VideoObjectSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: params.title,
    description: params.description,
    thumbnailUrl: params.thumbnailUrl,
    uploadDate: params.uploadDate,
    duration: params.duration, // Format: PT#M#S (e.g., PT2M30S)
    embedUrl: params.embedUrl,
    interactionStatistic: params.views
      ? {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/WatchAction',
          userInteractionCount: params.views,
        }
      : undefined,
  };
}

// ============================================================================
// COMBINED SCHEMA BUILDERS
// ============================================================================

/**
 * Generate complete homepage schema using @graph
 * Includes WebSite + Organization
 */
export function generateHomepageSchema(config: SiteConfig = SITE_CONFIG) {
  return {
    '@context': 'https://schema.org',
    '@graph': [generateOrganizationSchema(config), generateWebSiteSchema(config)],
  };
}

/**
 * Generate schema for inner pages with breadcrumbs
 */
export function generatePageWithBreadcrumbsSchema(
  breadcrumbItems: Array<{ name: string; url: string }>,
  config: SiteConfig = SITE_CONFIG
) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      generateBreadcrumbSchema(breadcrumbItems),
      {
        '@type': 'Organization',
        '@id': config.organizationId,
        name: config.name,
        url: config.url,
        logo: config.logo,
      },
    ],
  };
}

// ============================================================================
// CONTENT TYPE DETECTION
// ============================================================================

export type ContentType =
  | 'homepage'
  | 'article'
  | 'product'
  | 'category'
  | 'profile'
  | 'faq'
  | 'video'
  | 'generic';

/**
 * Detect content type based on path and data
 */
export function detectContentType(pathname: string): ContentType {
  if (pathname === '/') return 'homepage';
  if (pathname.startsWith('/thread/') || pathname.startsWith('/discussions/'))
    return 'article';
  if (pathname.startsWith('/content/') || pathname.startsWith('/marketplace/'))
    return 'product';
  if (pathname.startsWith('/category/')) return 'category';
  if (pathname.startsWith('/user/')) return 'profile';
  if (pathname.startsWith('/faq')) return 'faq';

  return 'generic';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert schema object to JSON-LD script tag
 */
export function schemaToScriptTag(schema: any): string {
  return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
}

/**
 * Validate schema structure (basic validation)
 * For production, use Google Rich Results Test API
 */
export function validateSchema(schema: BaseSchema): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!schema['@context']) {
    errors.push('Missing @context property');
  }

  if (!schema['@type']) {
    errors.push('Missing @type property');
  }

  if (schema['@context'] !== 'https://schema.org') {
    errors.push('Invalid @context - must be "https://schema.org"');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate validation URL for Google Rich Results Test
 */
export function getRichResultsTestUrl(pageUrl: string): string {
  return `https://search.google.com/test/rich-results?url=${encodeURIComponent(pageUrl)}`;
}

/**
 * Generate validation URL for Schema.org Validator
 */
export function getSchemaValidatorUrl(pageUrl: string): string {
  return `https://validator.schema.org/#url=${encodeURIComponent(pageUrl)}`;
}
