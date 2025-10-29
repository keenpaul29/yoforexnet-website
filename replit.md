# YoForex - Expert Advisor Forum & Marketplace Platform

## Overview
YoForex is an EA (Expert Advisor) forum and marketplace platform for algorithmic trading on MT4/MT5. Its purpose is to be the central hub for traders to discuss strategies, share EAs, and find reliable brokers. Key capabilities include a sophisticated ranking algorithm, a gold coin economy, a comprehensive forum, a broker directory, and a marketplace for trading tools. The platform is designed for high performance, scalability, and an engaging user experience, leveraging a Next.js-only architecture for optimal SEO and interactivity.

## User Preferences
- Design: Modern, clean interface with gamification elements
- Color Scheme: Professional blues and purples with gold accents for coins
- Layout: Card-based layout with clear hierarchy, responsive design
- Stats Position: Summary statistics (Total Categories/Threads/Posts) must be at top of pages for better visibility
- UI Style: Compact, informative, professional, and simple (15-25% whitespace reduction)
- Reading Experience: Medium-style thread pages with reading progress bar, floating action bar, improved typography
- Performance: Lightweight enough to run on local PC
- Real-time Updates: DISABLED - All auto-refresh intervals disabled for performance
- Background Jobs: DISABLED - All cron jobs disabled to reduce CPU/memory usage
- MANDATORY: ALWAYS update these files IMMEDIATELY after making ANY code changes:
    1. docs/PLATFORM_GUIDE.md
    2. docs/API_REFERENCE.md
    3. docs/ARCHITECTURE.md
    4. docs/API_QUICK_REFERENCE.txt
    5. replit.md
    6. CLIENT_HANDOVER_GUIDE.md (for major changes)

## System Architecture

### Core Systems
- **Real-Time Auto-Refresh System**: Disabled for performance; user-controlled manual refresh buttons are provided.
- **Sophisticated Ranking Algorithm**: Calculates Engagement Score (`views×0.1 + replies×1 + helpfulVotes×2`), User Reputation (`threads×1 + replies×0.5 + helpfulVotes×2`), and Sales Score (`totalSales × priceCoins × 0.1`) with time decay. Level calculation is `Math.floor(totalCoins / 1000)`.
- **Background Job Scheduler**: Disabled for performance.
- **Dashboard Customization UI**: Allows users to toggle, reorder, and select layouts for widgets.
- **Performance Optimizations**: Achieved through disabling real-time updates and background jobs, along with user-controlled data refresh.

### Forum System
- **Hierarchical Category Tree**: 2-level structure with 59 categories.
- **Thread Management**: Supports creation, editing, pinning, locking, and deleting threads.
- **Interaction**: Nested replies with @mentions, accepted answers, and helpful votes.
- **SEO Enhancements**: Auto-generated slugs, meta descriptions, view tracking, SEO preview component, keyword density validation, and excerpt field.

### Coin Economy System
- **Virtual Currency**: "Gold coins" (100 coins = $5.50 USD).
- **Earning Methods**: Content publishing, replies, backtests, violation reports, daily check-ins, referral program, and activity tracking (0.5 coins per 5 minutes of activity, max 50 coins/day). 25 coins for an accepted answer.
- **Withdrawal System**: Minimum 1000 coins, 5% fee, supports USDT/BTC/ETH.
- **UI Integration**: Pricing displays both coins and USD equivalents.

### Marketplace System
- **Content Types**: Supports EAs, Indicators, Articles, and Source Code.
- **Publishing Flow**: Multi-step process with validation and file management.
- **Pricing**: Free or coin-based content, with MT4/MT5 platform support.
- **Interaction**: Purchase, review, like, and Q&A systems.
- **File Storage**: Replit Object Storage (Google Cloud Storage) for persistent EA files and screenshots, with ACL-controlled downloads and database-backed purchaser verification.

### User & Social System
- **Authentication**: Replit OIDC with PostgreSQL-backed sessions.
- **User Profiles**: Customizable with trading stats.
- **Social Features**: Follow/unfollow, badge system, reputation system, private messaging.
- **Onboarding System**: Interactive checklist with 6 milestone-based tasks for earning coins.

### Broker Directory
- **Broker Profiles**: Detailed profiles with company info, regulation, and spreads.
- **Community Features**: Review system, scam watch reporting, and community-driven auto-rating.
- **Filtering**: Search by regulation, platform, and spread type.
- **Logo Auto-Fetch**: Multi-tier fallback system for broker logos.
- **Autocomplete**: Real-time broker name search with debouncing.

### Stats & Leaderboards
- **Global Statistics**: Displays total threads, members, replies, and activity.
- **Leaderboard Categories**: Top Contributors, Top Uploaders, Weekly Streaks.
- **Trending**: "What's Hot" and "Week Highlights" sections.

### Frontend Architecture
- **Next.js 16 App Router**: Uses Server and Client Components.
- **Styling**: Tailwind CSS + shadcn/ui.
- **State Management**: TanStack Query v5.
- **Forms**: React Hook Form + Zod validation.
- **API Communication**: Next.js rewrites client-side `/api/*` to Express, server-side direct fetch.
- **Reading Experience**: Medium-inspired thread pages with progress bars, floating actions, enhanced typography.

### Backend Architecture
- **Server**: Express.js API-only mode.
- **Database**: PostgreSQL (Neon-backed) with Drizzle ORM.
- **Authentication**: Passport.js + Replit OIDC.
- **Jobs**: `node-cron` scheduler (currently disabled).
- **Object Storage**: Replit Object Storage (Google Cloud Storage) for persistent file uploads with a service layer and ACL system.
- **Security**: XSS protection (DOMPurify), server-side Zod validation, Helmet security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options), API rate limiting, and file access control using ACL policies.

### Admin Dashboard System
- **Frontend UI**: 20 comprehensive admin sections at `/admin`.
- **Backend Implementation**: 20 new admin tables and 43 working endpoints for CRUD operations.
- **Security**: Requires authentication and role-based access checks.

### Educational Content
- **Guides System**: Markdown-based educational guides at `/guides/[slug]`, including "How to Earn Coins".

## External Dependencies
- **Stripe**: For credit/debit card payments.
- **Replit Auth**: OIDC authentication.
- **Replit Object Storage**: Google Cloud Storage for persistent file uploads (EA files, screenshots).
- **PostgreSQL**: Neon-backed database.
- **Clearbit Logo API**: Primary broker logo source.
- **Google S2 Favicon API**: Fallback for broker logos.

## Recent Updates (October 29, 2025)

### Production Deployment TypeScript Fixes
**Status**: ✅ PRODUCTION READY - 57 Files Fixed, Zero TypeScript Errors

**Deployment Issues Fixed (Oct 29, 2025)**:

All TypeScript compilation errors blocking Next.js production build have been resolved. Total files fixed: **57 files**.

**Critical Patterns Fixed**:

1. **useQuery Missing Type Annotations** (15 files):
   - ❌ WRONG: `useQuery({ queryKey: [...] })` - infers as `{}`
   - ✅ CORRECT: `useQuery<DataType>({ queryKey: [...] })`
   - Files: Dashboard tabs (6), Analytics, Marketing, Settings, Profile pages (2)

2. **apiRequest Function Signature** (10 files):
   - ❌ WRONG: `apiRequest<Type>('/url', { method: 'POST', body: {} })`
   - ✅ CORRECT: `apiRequest('POST', '/url', {})`
   - Pattern: `(method, url, data)` - no generics, no options object
   - Files: Activity tracker, dashboard components, admin sections

3. **useRealtimeUpdates Configuration** (2 files):
   - ❌ WRONG: `useRealtimeUpdates('/api/data', { interval: false })`
   - ✅ CORRECT: `useRealtimeUpdates('/api/data', { enabled: false })`
   - Files: StatsBar.tsx, WhatsHot.tsx

4. **Missing Function Arguments** (1 file):
   - ❌ WRONG: `calculateMonthlyPotential()` - requires activity level
   - ✅ CORRECT: `calculateMonthlyPotential('moderate')`
   - Files: EarnCoinsClient.tsx

5. **Non-Existent Type Imports** (3 files):
   - ❌ WRONG: `import { Badge } from '@shared/schema'` - doesn't exist
   - ✅ CORRECT: Remove unused imports, use inline types
   - Files: ProfileClient.tsx, UserProfileClient.tsx, thread pages

6. **Missing Properties on Types** (2 files):
   - ❌ WRONG: `thread.thumbnailUrl` - property doesn't exist
   - ✅ CORRECT: Remove references or add property to schema
   - Files: Thread metadata, user profile

7. **Possibly Undefined Comparisons** (2 files):
   - ❌ WRONG: `hasChange && stat.change > 0` - TypeScript still sees stat.change as possibly undefined
   - ✅ CORRECT: `hasChange && (stat.change ?? 0) > 0` - Use nullish coalescing for safe comparison
   - Pattern: Always use nullish coalescing when comparing possibly undefined values with numbers
   - Files: StatsCards.tsx, SEOMarketing.tsx

8. **Schema Field Mismatches in Seed Scripts** (1 file):
   - ❌ WRONG: Using `reputation` and `coinBalance` fields that don't exist in schema
   - ✅ CORRECT: Use `reputationScore` and `totalCoins` to match actual database schema
   - ❌ WRONG: `userMap: Map<string, number>` when IDs are varchar (string)
   - ✅ CORRECT: `userMap: Map<string, string>` to match UUID string IDs
   - ❌ WRONG: `authorId` in forumReplies (doesn't exist)
   - ✅ CORRECT: `userId` + `slug` field (required) in forumReplies
   - Pattern: Always verify field names match the actual schema exports
   - Files: seed-complete-platform.ts

**Deployment Configuration Fixes**:

1. **Port Configuration**:
   - ❌ WRONG: Multiple ports (5 ports exposed)
   - ✅ CORRECT: Single port for Autoscale: `localPort: 5000, externalPort: 80`
   - Autoscale/Cloud Run only supports ONE external port

2. **Deployment Settings** (.replit):
   ```toml
   [deployment]
   deploymentTarget = "autoscale"
   build = ["npm", "run", "build"]
   run = ["npm", "run", "start"]
   ```

**Prevention Guidelines**:

When adding new features, ALWAYS:
1. Add type annotations to ALL `useQuery` and `useMutation` hooks
2. Use correct `apiRequest(method, url, data)` signature
3. Check schema exports before importing types
4. Verify property existence on types before accessing
5. Use nullish coalescing (`??`) when comparing possibly undefined values with numbers
6. Verify seed data matches actual schema field names (not assumptions)
7. Check ID types in schema (serial vs varchar/uuid) before creating maps
8. Search for ALL similar patterns when fixing one instance
9. Run `get_latest_lsp_diagnostics` before claiming completion

**Files Fixed by Category**:
- Dashboard Tabs: 6 files (Overview, Earnings, Sales, Analytics, Marketing, Settings)
- Profile Pages: 3 files (ProfileClient, UserProfileClient, StatsCards)
- Thread Pages: 1 file (page.tsx metadata)
- Activity Tracking: 1 file (useActivityTracker hook)
- Earn Coins: 1 file (EarnCoinsClient)
- Components: 2 files (StatsBar, WhatsHot)
- Admin Panels: 18 files (complete type coverage including SEOMarketing)
- Object Storage: 5 files (ACL system integration)
- Type Patterns: 8 files (null/undefined handling)
- API Layer: 8 files (request signatures)
- Utils: 3 files (hooks and helpers)
- **Seed Scripts: 1 file (schema field alignment)**

**Build Verification**:
- ✅ Zero LSP diagnostics
- ✅ Next.js compiles in <1 second
- ✅ Fast Refresh working (<500ms)
- ✅ Production build succeeds
- ✅ All servers running (Express: 3001, Next.js: 5000)