# YoForex - Expert Advisor Forum & Marketplace Platform

## Overview
YoForex is an EA (Expert Advisor) forum and marketplace platform for algorithmic trading on MT4/MT5. It aims to be the central hub for traders to discuss strategies, share EAs, and find reliable brokers, featuring real-time components, a sophisticated ranking algorithm, a gold coin economy, a comprehensive forum, a broker directory, and a marketplace for trading tools. The platform is designed for high performance, scalability, and an engaging user experience, leveraging a Next.js-only architecture for optimal SEO and interactivity.

## User Preferences
- Design: Modern, clean interface with gamification elements
- Color Scheme: Professional blues and purples with gold accents for coins
- Layout: Card-based layout with clear hierarchy, responsive design
- Real-time Updates: Auto-refreshing widgets (10s-60s intervals)
- MANDATORY: ALWAYS update these files IMMEDIATELY after making ANY code changes:
    1. COMPLETE_PLATFORM_GUIDE.md
    2. API_DOCUMENTATION.md
    3. FRONTEND_ARCHITECTURE.md
    4. API_QUICK_REFERENCE.txt
    5. replit.md

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

### Stats & Leaderboards
- **Global Statistics**: Displays total threads, members, replies, and activity.
- **Leaderboard Categories**: Top Contributors, Top Uploaders, Weekly Streaks.
- **Trending**: "What's Hot" and "Week Highlights" sections.

### Frontend Architecture
- **Next.js 16 App Router**: Serves all pages with Server Components for SSR and Client Components for interactivity.
- **Styling**: Tailwind CSS + shadcn/ui.
- **State Management**: TanStack Query v5.
- **Forms**: React Hook Form + Zod validation.
- **Real-time**: Custom `useRealtimeUpdates` hook.
- **API Communication**: Next.js rewrites client-side `/api/*` to Express, server-side direct fetch.

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

## External Dependencies
- **Stripe**: For credit/debit card payments.
- **Replit Auth**: OIDC authentication.
- **PostgreSQL**: Neon-backed database.