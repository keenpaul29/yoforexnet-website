# YoForex - Expert Advisor Forum & Marketplace Platform

## Overview
YoForex is an EA (Expert Advisor) forum and marketplace platform for algorithmic trading on MT4/MT5. It aims to be the central hub for traders to discuss strategies, share EAs, and find reliable brokers. Key capabilities include real-time components, a sophisticated ranking algorithm, a gold coin economy, a comprehensive forum, a broker directory, and a marketplace for trading tools. The platform is designed for high performance, scalability, and an engaging user experience, leveraging a Next.js-only architecture for optimal SEO and interactivity.

## User Preferences
- Design: Modern, clean interface with gamification elements
- Color Scheme: Professional blues and purples with gold accents for coins
- Layout: Card-based layout with clear hierarchy, responsive design
- Stats Position: Summary statistics (Total Categories/Threads/Posts) must be at top of pages for better visibility
- UI Style: Compact, informative, professional, and simple (15-25% whitespace reduction)
- Reading Experience: Medium-style thread pages with reading progress bar, floating action bar, improved typography
- Performance: Lightweight enough to run on local PC
- **Real-time Updates: DISABLED** - All auto-refresh intervals disabled for performance
- **Background Jobs: DISABLED** - All cron jobs disabled to reduce CPU/memory usage
- MANDATORY: ALWAYS update these files IMMEDIATELY after making ANY code changes:
    1. COMPLETE_PLATFORM_GUIDE.md
    2. API_DOCUMENTATION.md
    3. FRONTEND_ARCHITECTURE.md
    4. API_QUICK_REFERENCE.txt
    5. replit.md

## System Architecture

### Core Systems
- **Real-Time Auto-Refresh System**: DISABLED for performance - all `refetchInterval` settings set to `false` across all components
  - **Manual Refresh Buttons**: User-controlled refresh buttons added to key sections:
    - Platform Statistics (StatsBar)
    - This Week's Highlights (all tabs: New, Trending, Solved)
    - What's Hot section
    - Top Sellers section
  - RefreshButton component with loading states and spinning animation
- **Sophisticated Ranking Algorithm**: Calculates Engagement Score, User Reputation, and Sales Score using various metrics and time decay.
- **Background Job Scheduler**: DISABLED for performance - all `node-cron` jobs commented out in `server/jobs/backgroundJobs.ts`
- **Dashboard Customization UI**: Allows users to toggle, reorder, and select layouts for widgets.
- **Performance Optimizations**:
  - Initial compile time: ~7 seconds (53% faster than before)
  - No background CPU/memory overhead from cron jobs
  - No constant network polling from auto-refresh intervals
  - User-controlled data refresh via manual buttons
  - Lightweight enough to run on local PC

### Forum System
- **Hierarchical Category Tree**: 2-level structure with 59 categories.
- **Thread Management**: Features for creating, editing, pinning, locking, and deleting threads.
- **Interaction**: Supports nested replies with @mentions, accepted answers, and helpful votes.
- **SEO Enhancements**: 
  - Auto-generated slugs, meta descriptions, and view tracking
  - SEO Preview Component showing Google search appearance
  - Primary keyword field with keyword density validation (0.5-3% optimal range)
  - SEO excerpt field (120-160 characters) with character counter
  - Real-time validation and feedback for search optimization

### Coin Economy System
- **Virtual Currency**: "Gold coins" with an exchange rate of 100 coins = $5.50 USD.
- **Earning Methods**: Coins earned through content publishing, replies, backtests, violation reports, daily check-ins, and a referral program.
  - **Activity Tracking**: 0.5 coins per 5 minutes of platform activity (max 500 minutes = 50 coins per day)
  - **Accepted Answer**: 25 coins awarded when your reply is marked as the accepted solution by the thread author
  - **Thread Creation**: Varies by content type and quality
  - **Daily Check-ins**: Streak-based rewards
- **Withdrawal System**: Minimum 1000 coins, 5% fee, supports USDT/BTC/ETH.
- **UI Integration**: Pricing displays both coins and USD equivalents.

### Marketplace System
- **Content Types**: Supports EAs, Indicators, Articles, and Source Code.
- **Publishing Flow**: Multi-step process with validation and file management.
- **Pricing**: Free or coin-based content, with MT4/MT5 platform support.
- **Interaction**: Purchase, review, like, and Q&A systems.

### User & Social System
- **Authentication**: Replit OIDC with PostgreSQL-backed sessions.
- **User Profiles**: Customizable profiles with trading stats.
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
- **Next.js 16 App Router**: Serves pages with Server Components and Client Components.
- **Styling**: Tailwind CSS + shadcn/ui with compact, professional spacing.
- **State Management**: TanStack Query v5.
- **Forms**: React Hook Form + Zod validation.
- **API Communication**: Next.js rewrites client-side `/api/*` to Express, server-side direct fetch.
- **Reading Experience**: Medium-inspired thread pages with progress bars, floating actions, enhanced typography.

### Backend Architecture
- **Server**: Express.js API-only mode.
- **Database**: PostgreSQL (Neon-backed) with Drizzle ORM.
- **Authentication**: Passport.js + Replit OIDC.
- **Jobs**: `node-cron` scheduler.
- **Security**: Rate limiting, input validation, XSS protection.

### Admin Dashboard System
- **Frontend UI**: 20 comprehensive admin sections accessible at `/admin`.
- **Backend Implementation**: 20 new admin tables and 43 working endpoints for CRUD operations across various admin functionalities.
- **Security**: All endpoints require authentication and role-based access checks.

### Educational Content
- **Guides System**: Markdown-based educational guides at `/guides/[slug]`.
- **Available Guides**: Includes "How to Earn Coins" covering earning methods, leveling, and withdrawal.

## Testing & Quality Assurance
- **Integration Tests**: Comprehensive API endpoint smoke tests at `tests/api.test.ts`
- **Test Coverage**: 8 critical endpoints tested (threads, feedback, categories, stats, notifications, brokers, hot content, top sellers)
- **Test Framework**: Node.js native HTTP client with TypeScript
- **Run Tests**: `npx tsx tests/api.test.ts`
- **All Tests**: ✅ Passing (100% success rate)

## External Dependencies
- **Stripe**: For credit/debit card payments.
- **Replit Auth**: OIDC authentication.
- **PostgreSQL**: Neon-backed database.
- **Clearbit Logo API**: Primary broker logo source.
- **Google S2 Favicon API**: Fallback for broker logos.