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