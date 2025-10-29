# YoForex - Trading Community Platform

### Overview
YoForex is a comprehensive trading community platform built with Next.js, designed to foster a vibrant community for traders. It features forum discussions, trading journals, an Expert Advisor (EA) marketplace, broker reviews, and a user reputation and badge system, all underpinned by a coin-based economy. The platform aims to provide a rich, interactive environment for traders to share knowledge, access tools, and grow their skills. It is production-ready with a robust database and extensive SEO optimizations for global search visibility.

### User Preferences
- Prefer clear, concise code
- Minimize file count where possible
- Follow existing patterns and conventions
- Type safety is critical

### System Architecture
The platform is built with a modern tech stack:
- **Frontend**: Next.js 16 (App Router), React, TailwindCSS
- **Backend**: Express.js API
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: Replit Auth (OIDC)

**UI/UX Decisions:**
The platform emphasizes a clean, intuitive interface designed for ease of use and engagement. Key features like forum threads, marketplace listings, and user profiles are presented clearly, leveraging a responsive design for various devices.

**Technical Implementations:**
- **Dynamic Schema Generation**: Production-ready Schema.org JSON-LD generation system with 10 schema types and automated content type detection. Features conditional properties (commentCount, aggregateRating with 5+ review minimum), schema relationships via @id linking, absolute URL validation, HTML sanitization, and graceful error handling. Compliant with Schema.org 2025 and Google Rich Results guidelines.
- **Schema Utilities Library**: Comprehensive utility system (lib/schema-utils.ts) with 9 helper functions including HTML sanitization (prevents double-escaping), URL normalization (handles http, https, protocol-relative, data, mailto, tel URLs), ISO 8601 date formatting, required property validation, and content sanitization for valid JSON-LD.
- **Hierarchical URLs**: All components utilize a hierarchical URL structure (e.g., `/category/path/to/category/content-slug`) for improved SEO and content organization, with 301/308 redirects for backward compatibility.
- **Automated Sitemap System**: Production-ready sitemap generation and submission system with 24-hour automation. Features dynamic XML generation following 2025 standards (loc + lastmod only), IndexNow API integration for Bing/Yandex instant notifications, Google Search Console ping, daily cron job (2 AM), admin dashboard with manual trigger, comprehensive logging to database, and error monitoring. All content types included (categories, threads, marketplace, users, brokers). Status: OPERATIONAL.
- **Type Safety**: Comprehensive TypeScript implementation with strict type checking across the entire codebase, including specific handling for PostgreSQL numeric fields (string conversion) and badge types.
- **API Connectivity**: A centralized Express API backend (port 3001) is robustly connected to the Next.js frontend (port 5000) using React Query for state management and caching.
- **SEO Optimization**: Beyond schema generation and hierarchical URLs, SEO is enhanced with Google Tag Manager, a dynamic sitemap, and Schema.org Breadcrumbs. All schemas include inLanguage property, Person schema @id links, and Organization references for entity relationships.

**Feature Specifications:**
- **Forum System**: Supports discussions, replies, and interaction statistics.
- **Marketplace**: Allows listing and selling of Expert Advisors, indicators, and templates with detailed product schemas including offers and reviews.
- **User Profiles**: Comprehensive profiles with reputation scores, badges, social links, and expertise areas.
- **Coin-based Economy**: Rewards users for platform engagement.
- **Admin Dashboard**: Provides comprehensive tools for content moderation, marketplace management, schema validation, and analytics monitoring.

**Admin Marketplace Management System** (October 2025 - Production Ready):
- **Comprehensive Moderation Workflow**: Full approval/rejection system with audit trails. Admins can approve, reject (with custom reasons), feature, and soft-delete marketplace items. All actions logged to adminActions table with timestamps and admin IDs.
- **Advanced Search & Filtering**: Real-time search with 300ms debounce, category filter (Expert Advisors, Indicators, Scripts, Templates), status filter (Pending, Approved, Rejected), price range filter (Free, Low, Medium, High). Clear filters button to reset all at once.
- **Pagination System**: Full pagination with configurable page sizes (10/20/50/100 items), First/Previous/Next/Last navigation, "Showing X-Y of Z items" display. Automatically resets to page 1 when filters change.
- **Interactive Modals**: View Item Details (full product info, recent purchases, sales metrics), Reject with Reason (dropdown + custom textarea with Zod validation), Feature Item (duration 1-365 days with expiry tracking).
- **Sales Analytics Dashboard**: Real-time statistics (total items, pending items, total sales, sales this week, total revenue, revenue this week), 30-day revenue trend chart, top-selling items leaderboard, top vendors by earnings with item counts.
- **Database Schema**: Extended content table with 8 moderation fields (approvedBy, approvedAt, rejectedBy, rejectedAt, rejectionReason, featured, featuredUntil, deletedAt) and 2 performance indexes (featured, deletedAt).
- **Backend Implementation**: 14 storage methods in IStorage interface (getMarketplaceItems with filters/pagination, approveMarketplaceItem, rejectMarketplaceItem, featureMarketplaceItem, deleteMarketplaceItem, getMarketplaceSales, getMarketplaceRevenue, getRevenueTrend, getTopSellingItems, getTopVendors, getMarketplaceStats, etc.) with full Drizzle ORM queries including LEFT JOINs, aggregations, and soft delete filtering.
- **API Layer**: 16 RESTful endpoints (/api/admin/marketplace/*) with isAuthenticated + isAdmin authorization, Zod validation for all POST requests, rate limiting via adminOperationLimiter, comprehensive error handling (400/403/404/500 status codes).
- **React Query Integration**: Optimized cache invalidation with prefix matching ensuring immediate UI updates after approve/reject/feature actions. All queries properly typed with TypeScript interfaces.
- **UI/UX Best Practices**: Follows 2025 e-commerce admin dashboard patterns with skeleton loading states, responsive design (mobile-friendly), comprehensive data-testid attributes for all interactive elements, clear error messages and toast notifications.

### External Dependencies
- **Database**: Neon (PostgreSQL-compatible, serverless)
- **Authentication**: Replit Auth (OIDC)
- **Analytics**:
    - Google Analytics 4 (G-LWZ81QCJMR)
    - Yandex Webmaster Tools
    - Bing Webmaster Tools
    - Seznam Webmaster
- **Tag Management**: Google Tag Manager (via `NEXT_PUBLIC_GTM_ID`)