# YoForex - Expert Advisor Forum & Marketplace Platform

## Overview
YoForex is a comprehensive EA (Expert Advisor) forum and marketplace platform for algorithmic trading on MT4/MT5. It aims to be the go-to platform for traders to discuss strategies, share EAs, and find reliable brokers. The platform features real-time components, sophisticated ranking, a gold coin economy, a comprehensive forum, a broker directory, and a marketplace for trading tools. 

**Current Architecture Status**: ✅ **NEXT.JS-ONLY ARCHITECTURE - 100% OPERATIONAL!** React SPA fully removed and archived. Next.js 16 (port 5000) serves all frontend pages with SSR/SSG for SEO. Express (port 3001) runs API-only mode for authentication and data mutations. All 28 pages operational with Server Components for SSR and Client Components for interactivity.

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
- **Real-Time Auto-Refresh System**: Implemented with a custom `useRealtimeUpdates` hook, providing configurable intervals for various dashboard widgets (e.g., StatsBar, Leaderboard, Live Activity Feed). Visual "Updated X ago" indicators are present.
- **Sophisticated Ranking Algorithm**: Calculates Engagement Score for threads (views, replies, likes, bookmarks, shares, downloads, purchases with exponential time decay and author reputation multiplier), User Reputation (threads, replies, likes, best answers, sales, followers, uploads), and Sales Score for Marketplace content.
- **Background Job Scheduler**: Utilizes `node-cron` for scheduled updates of thread scores, user reputation, and top seller scores, with error logging and recovery.
- **Dashboard Customization UI**: Frontend-only implementation allowing users to toggle, reorder, and select layouts for widgets on their dashboard.

### Forum System
- **Hierarchical Category Tree**: 59 total categories (8 main + 51 subcategories) organized in a 2-level tree structure covering comprehensive trading topics:
  - Trading Strategies (12 subcategories: Scalping by pair, Day Trading, Swing, Position, Grid/Martingale, Hedging, Multi-pair)
  - EA Library (11 subcategories: By strategy type, platform, and price range)
  - Indicators & Templates (5 subcategories: Trend, Oscillators, Volume, S/R, Templates)
  - Broker Reviews (6 subcategories: ECN, Market Maker, Low Spread, High Leverage, Regulated, Scam Watch)
  - Coding & Development (5 subcategories: MQL4, MQL5, Python, Backtesting, Freelance)
  - Education & Resources (5 subcategories: Beginners, Technical, Fundamental, Risk, Psychology)
  - Trading Journals (4 subcategories: Live, EA Performance, Backtest, Forward Test)
  - Tools & Services (4 subcategories: VPS, Trade Copiers, Signals, Calculators)
- **Category Tree Features**: Parent-child relationships, breadcrumb navigation, dynamic thread/post counts, hierarchical display component
- **Thread Management**: Features for creating, editing, pinning, locking, and deleting threads.
- **Interaction**: Supports nested replies with @mentions, accepted answers, and helpful votes.
- **SEO**: Auto-generated slugs, meta descriptions, and view tracking.

### Coin Economy System
- **Virtual Currency**: "Gold coins" used for transactions within the platform.
- **Earning Methods**: Daily check-ins, content publishing, helping members, sharing broker reports, and platform contributions.
- **Spending Options**: Purchasing marketplace content and planned premium features.
- **Transaction History**: Full ledger with filtering capabilities.
- **Recharge System**: Integration with Stripe for purchasing coins.

### Marketplace System
- **Content Types**: Supports EAs, Indicators, Articles, and Source Code.
- **Publishing Flow**: Multi-step process with validation, file management, and image galleries.
- **Pricing**: Content can be free or coin-based.
- **Platform Support**: Specifies MT4, MT5, or both.
- **Interaction**: Includes purchase system, review system, like system, and Q&A (reply system).

### User & Social System
- **Authentication**: Replit OIDC with PostgreSQL-backed sessions.
- **User Profiles**: Customizable profiles displaying trading stats.
- **Social Features**: Follow/unfollow system, badge system (16+ achievement badges), automated reputation system, and private messaging.
- **Onboarding**: Interactive checklist for new users.

### Broker Directory
- **Broker Profiles**: Detailed profiles with company info, regulation, and spreads.
- **Community Features**: Review system, scam watch reporting, and community-driven auto-rating.
- **Filtering**: Allows searching by regulation, platform, and spread type.

### Stats & Leaderboards
- **Global Statistics**: Displays total threads, members, replies, and activity.
- **Real-time Updates**: Auto-refreshes every 30 seconds.
- **Leaderboard Categories**: Top Contributors, Top Uploaders, Weekly Streaks.
- **Trending**: "What's Hot" and "Week Highlights" sections based on algorithms.

### Frontend Architecture
- **Next.js-Only**: Next.js 16 App Router (app/*) serving all pages on port 5000 (user-facing).
- **React SPA**: Archived to `archived-react-spa/` directory, no longer active.
- **Styling**: Tailwind CSS + shadcn/ui components.
- **Routing**: Next.js App Router with next/link for client-side navigation.
- **State Management**: TanStack Query v5 (React Query) with API proxy via Next.js rewrites.
- **Forms**: React Hook Form + Zod validation.
- **Real-time**: Custom `useRealtimeUpdates` hook for polling.
- **API Communication**: 
  - Client-side: Relative URLs (/api/*) rewritten by Next.js to Express (localhost:3001)
  - Server-side: Direct fetch to Express (http://localhost:3001)
- **Architecture Pattern**: Next.js Server Components fetch initial data from Express API and hydrate Client Components for interactivity.
- **Operational Pages (28/28)**: 
  - SEO-Critical (7): Homepage (/), ThreadDetail (/thread/[slug]), ContentDetail (/content/[slug]), UserProfile (/user/[username]), CategoryDiscussion (/category/[slug]), BrokerProfile (/brokers/[slug]), Marketplace (/marketplace)
  - High-Traffic (5): Discussions (/discussions), Categories (/categories), BrokerDirectory (/brokers), Members (/members), Leaderboard (/leaderboard)
  - Authenticated (9): Dashboard (/dashboard), Settings (/settings), Recharge (/recharge), Transactions (/transactions), Publish (/publish), Messages (/messages), Notifications (/notifications), Withdrawals (/withdrawals), WithdrawalHistory (/withdrawals/history)
  - Additional (7): EarnCoins (/earn), SubmitBrokerReview (/brokers/submit-review), SubmitFeedback (/feedback), ContactSupport (/support), APIDocumentation (/api-docs), DashboardSettings (/dashboard/settings)

### Backend Architecture
- **Server**: Express.js API-only mode on port 3001 (internal, for authentication and mutations).
- **Database**: PostgreSQL (Neon-backed) with Drizzle ORM.
- **Authentication**: Passport.js + Replit OIDC.
- **Session Store**: PostgreSQL sessions table.
- **Jobs**: `node-cron` scheduler.
- **Security**: Rate limiting, input validation, XSS protection.
- **API Proxy**: Next.js rewrites /api/* requests from client to Express on port 3001.

### Database Schema
- Over 25 tables, including `users`, `coinTransactions`, `content`, `forumThreads`, `brokers`, `userFollows`, and `privateMessages`, with extensive indexing for performance.

### API Endpoints
- Over 65 RESTful endpoints covering authentication, coins, marketplace, forum threads/replies, categories (including tree endpoints: /api/categories/tree/all, /api/categories/:slug/subcategories, /api/categories/:slug/breadcrumb), social features, stats, leaderboards, badges, onboarding, broker directory, and global search.

### Security & Performance
- **Rate Limiting**: Configured for general API, write operations, coin operations, content creation, and reviews/ratings.
- **Input Validation**: DOMPurify sanitization and Zod schemas.
- **Database Indexes**: Over 25 critical indexes for speed.
- **XSS Protection**: All user inputs sanitized.
- **Session Security**: HTTP-only cookies, 7-day TTL.

### SEO Engine
- Automated generation of focus keywords, meta descriptions, SEO slugs, alt texts, and Schema.org JSON-LD structured data for all content.

### Additional Features
- **IP-based Geo-locale Detection**: Middleware for automatic locale detection based on IP geolocation (feature-flagged OFF by default, enable with `GEOLOCALE_ENABLED='true'`)
- **AI Crawler Policy**: Public llms.txt file defining allowed/disallowed paths and usage guidelines for AI crawlers
- **Seed Data**: 60 realistic forum threads across all categories for testing and demonstration

## External Dependencies
- **Stripe**: For credit/debit card payments (integrated).
- **Replit Auth**: OIDC authentication (integrated).
- **PostgreSQL**: Neon-backed database (configured).