# YoForex - Expert Advisor Forum & Marketplace Platform

## Overview
YoForex is an EA (Expert Advisor) forum and marketplace platform for algorithmic trading on MT4/MT5. It aims to be the central hub for traders to discuss strategies, share EAs, and find reliable brokers, featuring real-time components, a sophisticated ranking algorithm, a gold coin economy, a comprehensive forum, a broker directory, and a marketplace for trading tools. The platform is designed for high performance, scalability, and an engaging user experience, leveraging a Next.js-only architecture for optimal SEO and interactivity.

## User Preferences
- Design: Modern, clean interface with gamification elements
- Color Scheme: Professional blues and purples with gold accents for coins
- Layout: Card-based layout with clear hierarchy, responsive design
- **Stats Position**: Summary statistics (Total Categories/Threads/Posts) must be at top of pages for better visibility
- **UI Style**: Compact, informative, professional, and simple (15-25% whitespace reduction)
- **Reading Experience**: Medium-style thread pages with reading progress bar, floating action bar, improved typography
- Real-time Updates: Auto-refreshing widgets (10s-60s intervals)
- MANDATORY: ALWAYS update these files IMMEDIATELY after making ANY code changes:
    1. COMPLETE_PLATFORM_GUIDE.md
    2. API_DOCUMENTATION.md
    3. FRONTEND_ARCHITECTURE.md
    4. API_QUICK_REFERENCE.txt
    5. replit.md

## Recent Updates (October 28, 2025)
- **Next.js 15 Navigation**: Fixed async params in all dynamic routes (guides, threads, categories, brokers)
- **Notification System**: Connected header bell to real API endpoints, displays accurate unread count
- **Feedback Submission**: Added success toast, form reset, and confirmation screen
- **Word Count**: Thread compose now counts words (space-separated) instead of characters
- **Educational Guides**: Created comprehensive "How to Earn Coins" guide at `/guides/how-to-earn-coins` with leveling system, XP requirements, and coin economics
- **Broker Logo Auto-Fetch**: Implemented broker name autocomplete with automatic logo fetching from Clearbit API → Google Favicon → UI Avatars placeholder, 300ms debounced search
- **UI Improvements**: Reduced spacing by 15-25% across 5 major pages (Home, Discussions, Earn, Categories, Brokers) for more compact, professional appearance
- **Medium-Style Reading**: Thread detail pages feature reading progress bar, floating action bar, improved typography, better markdown rendering, and nested reply visualization
- **Interactive Cards**: Discussion cards have "Show more/Show less" functionality while maintaining card-wide navigation
- **Component Redesign**: Simplified OnboardingChecklist, TopSellers, and Leaderboard with professional styling (border-0, shadow-sm), cleaner typography, tighter spacing, and improved visual hierarchy
- **TopSellers Real Data**: Fixed "Content Not Found" errors by replacing mock data with real API integration using `/api/content/top-sellers` endpoint with TanStack Query, loading states, 60s auto-refresh, and proper content slug routing

## System Architecture

### Core Systems
- **Real-Time Auto-Refresh System**: Custom `useRealtimeUpdates` hook for configurable refresh intervals on dashboard widgets.
- **Sophisticated Ranking Algorithm**: Calculates Engagement Score for threads, User Reputation, and Sales Score for Marketplace content using various metrics and time decay.
- **Background Job Scheduler**: `node-cron` for scheduled score and reputation updates.
- **Dashboard Customization UI**: Allows users to toggle, reorder, and select layouts for widgets.

### Forum System
- **Hierarchical Category Tree**: A 2-level tree structure with 59 categories covering trading topics, featuring parent-child relationships and breadcrumb navigation.
- **Thread Management**: Features for creating, editing, pinning, locking, and deleting threads.
- **Interaction**: Supports nested replies with @mentions, accepted answers, and helpful votes.
- **SEO**: Auto-generated slugs, meta descriptions, and view tracking.

### Coin Economy System
- **Virtual Currency**: "Gold coins" with an exchange rate of 100 coins = $5.50 USD.
- **Recharge Packages**: 7 tiers with bonus coins.
- **Earning Methods**: Coins earned through publishing content, replies, backtests, violation reports, daily check-ins, and a referral program.
- **Commission Splits**: 80-20 or 75-25 for content creators depending on content type.
- **Withdrawal System**: Minimum 1000 coins, 5% fee, supports USDT/BTC/ETH.
- **Daily Limits**: Anti-abuse limits on various earning activities.
- **Transaction History**: Full ledger with filtering.
- **UI Integration**: Pricing displays both coins and USD equivalents.

### Marketplace System
- **Content Types**: Supports EAs, Indicators, Articles, and Source Code.
- **Publishing Flow**: Multi-step process with validation and file management.
- **Pricing**: Content can be free or coin-based, with platform support for MT4/MT5.
- **Interaction**: Purchase, review, like, and Q&A systems.

### User & Social System
- **Authentication**: Replit OIDC with PostgreSQL-backed sessions.
- **User Profiles**: Customizable profiles with trading stats.
- **Social Features**: Follow/unfollow, badge system, reputation system, private messaging.
- **Onboarding**: Interactive checklist for new users.

### Broker Directory
- **Broker Profiles**: Detailed profiles with company info, regulation, and spreads.
- **Community Features**: Review system, scam watch reporting, and community-driven auto-rating.
- **Filtering**: Search by regulation, platform, and spread type.
- **Logo Auto-Fetch**: Broker logo service with multi-tier fallback system (Clearbit API → Google S2 Favicon → UI Avatars)
- **Autocomplete**: Real-time broker name search with 300ms debouncing, logo preview in suggestions

### Stats & Leaderboards
- **Global Statistics**: Displays total threads, members, replies, and activity.
- **Leaderboard Categories**: Top Contributors, Top Uploaders, Weekly Streaks.
- **Trending**: "What's Hot" and "Week Highlights" sections.

### Frontend Architecture
- **Next.js 16 App Router**: Serves all pages with Server Components for SSR and Client Components for interactivity.
- **Styling**: Tailwind CSS + shadcn/ui with compact, professional spacing (15-25% reduced whitespace).
- **State Management**: TanStack Query v5.
- **Forms**: React Hook Form + Zod validation.
- **Real-time**: Custom `useRealtimeUpdates` hook.
- **API Communication**: Next.js rewrites client-side `/api/*` to Express, server-side direct fetch.
- **Reading Experience**: Medium-inspired thread pages with progress bars, floating actions, enhanced typography.
- **Word Count**: Whitespace tokenization (`content.trim().split(/\s+/).filter(Boolean).length`) for accurate word counting.

### Backend Architecture
- **Server**: Express.js API-only mode.
- **Database**: PostgreSQL (Neon-backed) with Drizzle ORM.
- **Authentication**: Passport.js + Replit OIDC.
- **Jobs**: `node-cron` scheduler.
- **Security**: Rate limiting, input validation, XSS protection.

### Database Schema
- Over 25 tables, including `users`, `coinTransactions`, `content`, `forumThreads`, `brokers`, `userFollows`, `privateMessages`, `referrals`, `goals`, `achievements`, `userAchievements`, `campaigns`, `dashboardSettings`, `profiles`, and `userSettings`, with extensive indexing.

### API Endpoints
- Over 65 RESTful endpoints covering all platform functionalities, including specific tree endpoints for categories.

### Security & Performance
- **Rate Limiting**: Configured for general API, write operations, and content creation.
- **Input Validation**: DOMPurify sanitization and Zod schemas.
- **Database Indexes**: Over 25 critical indexes.
- **XSS Protection**: All user inputs sanitized.
- **Session Security**: HTTP-only cookies, 7-day TTL.

### SEO Engine
- Automated generation of keywords, meta descriptions, slugs, alt texts, and Schema.org JSON-LD.

### VPS Deployment Architecture
- **Production-Ready**: NGINX reverse proxy, PM2 cluster management, zero-downtime deployments.
- **Key Components**: NGINX for SSL, routing, security, and compression; PM2 for process management and auto-restart; environment configuration for all URLs.

### Advanced Dashboard, Settings & Profile System
- **Dashboard**: 9-tab analytics system including Overview, Sales, Referrals, Analytics, Earnings, Goals, Notifications, CRM, and Marketing.
- **Settings**: 4 comprehensive sections for Profile, Notifications, Security, and Appearance.
- **Profile**: Enhanced user profiles with `ProfileHeader`, `StatsCards`, `BadgesWall`, `ContentGrid`, and `ReviewsSection`.

### Ultimate Admin Dashboard System
- **Frontend UI**: 20 comprehensive admin sections accessible at `/admin` route
  1. **Overview**: Platform-wide statistics, user growth charts, content trends, recent admin activity
  2. **Users**: User management, search, filtering, role assignment, account actions
  3. **Content**: Moderation queue, reported content, bulk actions, content statistics
  4. **Marketplace**: Product management, sales overview, revenue tracking
  5. **Brokers**: Broker verification, compliance management, review moderation
  6. **Finance**: Transaction history, revenue analytics, coin economy management, withdrawal processing
  7. **Analytics**: User behavior, content performance, platform metrics, custom reports
  8. **Settings**: System configuration, feature toggles, maintenance mode, platform settings
  9. **Security**: Security events, IP bans, suspicious activity monitoring, access control
  10. **Communications**: Email templates, bulk messaging, announcement management, notification center
  11. **Support**: Ticket management, user support, FAQ management, help center
  12. **Audit Logs**: Admin action history, system changes, compliance tracking, audit trails
  13. **AI & Automation**: Automation rules, scheduled tasks, workflow automation, smart alerts
  14. **Gamification**: Badge management, achievement tracking, leaderboard configuration, reward systems
  15. **SEO & Marketing**: SEO optimization, marketing campaigns, analytics integration, A/B testing
  16. **API & Integrations**: API key management, webhook configuration, third-party integrations, rate limits
  17. **Mobile & Push**: Push notification management, mobile app configuration, device management
  18. **Performance**: System monitoring, performance metrics, database health, optimization tools
  19. **Content Studio**: Media library, content revisions, asset management, version control
  20. **Testing**: A/B test management, feature flags, experimental features, testing environments

- **Backend Implementation**:
  - **Database**: 20 new admin tables (adminActions, moderationQueue, reportedContent, systemSettings, supportTickets, announcements, ipBans, emailTemplates, adminRoles, userSegments, automationRules, abTests, featureFlags, apiKeys, webhooks, scheduledJobs, performanceMetrics, securityEvents, mediaLibrary, contentRevisions)
  - **API Endpoints**: 43 working endpoints with full CRUD operations for Settings, Support, Announcements, Email Templates, Roles, Security Events, IP Bans, Audit Logs, Performance Metrics, Automation Rules, A/B Tests, Feature Flags, API Keys, Webhooks, and Media Library
  - **Storage Methods**: Core admin methods available for the 43 working endpoints
  - **Security**: All endpoints require isAuthenticated middleware + isAdmin() role checks + adminOperationLimiter rate limiting (200 req/hr)
  - **Test Data**: Comprehensive seed script with 400+ test records across all 20 admin tables
  
- **Working Admin Sections** (backend + frontend):
  1. Settings (3 endpoints: GET all, GET by key, PATCH by key)
  2. Support Tickets (3 endpoints: GET, POST, PATCH)
  3. Announcements (4 endpoints: GET, POST, PATCH, DELETE)
  4. Email Templates (4 endpoints: GET all, GET by key, PATCH, POST)
  5. Roles (3 endpoints: GET, POST grant, POST revoke)
  6. Security (2 endpoints: GET events, GET IP bans)
  7. Audit Logs (2 endpoints: GET actions, GET recent)
  8. Performance (2 endpoints: GET metrics, GET alerts)
  9. Automation (3 endpoints: GET rules, POST rule, PATCH rule)
  10. Testing (6 endpoints: A/B tests and feature flags CRUD)
  11. Integrations (7 endpoints: API keys and webhooks CRUD)
  12. Content Studio (3 endpoints: GET media, PATCH media, DELETE media)

- **Access**: Admin dashboard accessible at `/admin` route (requires admin/moderator/superadmin authentication)

## External Dependencies
- **Stripe**: For credit/debit card payments.
- **Replit Auth**: OIDC authentication.
- **PostgreSQL**: Neon-backed database.
- **Clearbit Logo API**: Primary broker logo source (free tier).
- **Google S2 Favicon API**: Fallback for broker logos.

## Educational Content
- **Guides System**: Markdown-based educational guides at `/guides/[slug]`
- **Available Guides**:
  - `/guides/how-to-earn-coins`: Comprehensive guide covering earning methods, leveling system (Novice → Contributor → Verified → Pro), XP requirements, daily limits, coin exchange rates, and withdrawal process
- **Integration**: Guides linked from earn page, header coin balance help icon