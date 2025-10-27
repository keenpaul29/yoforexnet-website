/**
 * Centralized API Configuration
 * 
 * This module provides runtime URL resolution for API calls across the application.
 * It eliminates hardcoded localhost URLs and uses environment variables for flexibility.
 * 
 * Architecture:
 * - Development: Next.js (3000) + Express (3001)
 * - Production VPS: NGINX proxy (80/443) → Next.js (3000) + Express (3001)
 * - Production Replit: Single Next.js server (5000) with API routes
 */

/**
 * Environment variable validation
 * Ensures required configuration is present at runtime
 */
function validateEnv() {
  const required = {
    // Server-side only (Node.js env vars)
    EXPRESS_URL: process.env.EXPRESS_URL,
    
    // Client-side (NEXT_PUBLIC_* accessible in browser)
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  };

  const missing: string[] = [];

  if (typeof window === 'undefined') {
    // Server-side: require EXPRESS_URL
    if (!required.EXPRESS_URL) {
      missing.push('EXPRESS_URL');
    }
  }

  if (missing.length > 0) {
    console.warn(
      `⚠️  Missing environment variables: ${missing.join(', ')}\n` +
      `   Using fallback URLs for development.\n` +
      `   Set these variables for production deployment.`
    );
  }
}

// Run validation on module load
validateEnv();

/**
 * Get the API base URL for client-side requests
 * 
 * @returns API base URL accessible from the browser
 * 
 * Usage in client components:
 * ```typescript
 * const apiUrl = getApiBaseUrl();
 * fetch(`${apiUrl}/api/stats`);
 * ```
 */
export function getApiBaseUrl(): string {
  // Client-side: use relative URLs (NGINX/Next.js rewrites handle routing)
  if (typeof window !== 'undefined') {
    return '';
  }

  // Server-side: direct to Express API
  // In production VPS: http://localhost:3001 (internal communication)
  // In production Replit: https://yourdomain.com (external URL)
  return process.env.EXPRESS_URL || 'http://localhost:3001';
}

/**
 * Get the internal API URL for server-side requests
 * 
 * @returns Internal API URL for server-to-server communication
 * 
 * Usage in server components:
 * ```typescript
 * const apiUrl = getInternalApiUrl();
 * const response = await fetch(`${apiUrl}/api/stats`);
 * ```
 */
export function getInternalApiUrl(): string {
  // Server-side only
  if (typeof window !== 'undefined') {
    throw new Error('getInternalApiUrl() can only be called server-side');
  }

  // Direct to Express API (internal communication)
  return process.env.EXPRESS_URL || 'http://localhost:3001';
}

/**
 * Get the public site URL
 * 
 * @returns Public-facing site URL (for SEO, OG tags, etc.)
 * 
 * Usage:
 * ```typescript
 * const siteUrl = getSiteUrl();
 * const canonical = `${siteUrl}/thread/${slug}`;
 * ```
 */
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL ||
    'http://localhost:3000'
  );
}

/**
 * Build a full API URL with path
 * 
 * @param path - API endpoint path (e.g., '/api/stats')
 * @returns Full API URL
 * 
 * Usage:
 * ```typescript
 * const url = buildApiUrl('/api/stats');
 * const response = await fetch(url);
 * ```
 */
export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
}

/**
 * Configuration object for easy access
 */
export const apiConfig = {
  /**
   * API base URL (client or server appropriate)
   */
  baseUrl: getApiBaseUrl(),

  /**
   * Public site URL
   */
  siteUrl: getSiteUrl(),

  /**
   * Whether we're in production mode
   */
  isProduction: process.env.NODE_ENV === 'production',

  /**
   * Whether we're in development mode
   */
  isDevelopment: process.env.NODE_ENV === 'development',

  /**
   * Express API URL (server-side only)
   */
  get expressUrl(): string {
    if (typeof window !== 'undefined') {
      throw new Error('expressUrl is only available server-side');
    }
    return getInternalApiUrl();
  },
} as const;

/**
 * Type-safe environment variable access
 */
export const env = {
  // Server-side only
  EXPRESS_URL: process.env.EXPRESS_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,

  // Public (client-accessible)
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_EXPRESS_URL: process.env.NEXT_PUBLIC_EXPRESS_URL,

  // Node environment
  NODE_ENV: process.env.NODE_ENV,
} as const;

// Export helper for debugging
export function debugConfig() {
  if (typeof window === 'undefined') {
    console.log('🔧 API Configuration (Server-side):');
    console.log('  - Express URL:', env.EXPRESS_URL || 'NOT SET (using fallback)');
    console.log('  - Site URL:', getSiteUrl());
    console.log('  - API Base:', getApiBaseUrl());
  } else {
    console.log('🔧 API Configuration (Client-side):');
    console.log('  - Site URL:', env.NEXT_PUBLIC_SITE_URL || 'NOT SET');
    console.log('  - API Base:', getApiBaseUrl());
  }
}
