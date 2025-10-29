# YoForex - Trading Community Platform

## Overview
YoForex is a comprehensive trading community platform built with Next.js, designed to foster a vibrant community for traders. It features forum discussions, trading journals, an Expert Advisor (EA) marketplace, broker reviews, and a user reputation and badge system, all underpinned by a coin-based economy. The platform aims to provide a rich, interactive environment for traders to share knowledge, access tools, and grow their skills, with robust SEO optimizations for global search visibility.

## Recent Changes (Oct 29, 2025)
- **Footer Navigation Audit**: Completed comprehensive audit of all 18 footer links (Legal, Support, Community, Opportunities sections) - all routes verified working with HTTP 200 status
- **Footer Link Fix**: Changed "Report Abuse" from mailto:abuse@yoforex.net to proper routing via /support page
- **Hydration Error Fix**: Resolved React hydration mismatch by changing dynamic `Date.now()` to static build number in footer version display
- **Route Testing**: All static pages and dynamic guide routes tested and confirmed functional (/terms, /privacy, /support, /feedback, /brokers, /marketplace, /partnerships, /careers, /earn, /guides/*)

## User Preferences
- Prefer clear, concise code
- Minimize file count where possible
- Follow existing patterns and conventions
- Type safety is critical
- **CRITICAL**: User experiences continuous TypeScript compilation errors during Next.js production build (`npm run build`). Always validate ALL TypeScript errors in server/storage.ts are resolved before claiming deployment readiness.

## System Architecture
The platform is built with a modern tech stack:
- **Frontend**: Next.js 16 (App Router), React, TailwindCSS
- **Backend**: Express.js API
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: Replit Auth (OIDC)

**UI/UX Decisions:**
The platform emphasizes a clean, intuitive interface designed for ease of use and engagement, leveraging a responsive design for various devices.

**Technical Implementations:**
- **Dynamic Schema Generation**: Production-ready Schema.org JSON-LD generation system with 10 schema types, automated content type detection, conditional properties, schema relationships, and HTML sanitization. Compliant with Schema.org 2025 and Google Rich Results guidelines.
- **Schema Utilities Library**: Comprehensive utility system (lib/schema-utils.ts) with helper functions for HTML sanitization, URL normalization, ISO 8601 date formatting, required property validation, and content sanitization for valid JSON-LD.
- **Hierarchical URLs**: Utilizes a hierarchical URL structure for improved SEO and content organization, with 301/308 redirects for backward compatibility.
- **Automated Sitemap System**: Production-ready sitemap generation and submission system with 24-hour automation, dynamic XML generation, IndexNow API integration, Google Search Console ping, and comprehensive logging.
- **Type Safety**: Comprehensive TypeScript implementation with strict type checking across the entire codebase.
- **API Connectivity**: A centralized Express API backend (port 3001) is robustly connected to the Next.js frontend (port 5000) using React Query.
- **SEO Optimization**: Enhanced with Google Tag Manager, a dynamic sitemap, Schema.org Breadcrumbs, and comprehensive schema properties for entity relationships.

**Feature Specifications:**
- **Forum System**: Supports discussions, replies, and interaction statistics.
- **Marketplace**: Allows listing and selling of Expert Advisors, indicators, and templates with detailed product schemas.
- **User Profiles**: Comprehensive profiles with reputation scores, badges, social links, and expertise areas.
- **Coin-based Economy**: Rewards users for platform engagement.
- **Broker Directory**: 3-column responsive layout with comprehensive features:
    - **Left Sidebar**: Advanced filters UI (regulation, account types, min deposit, leverage, spread types, platforms, payment methods, special features), broker categories, comparison tool, and quick stats display
    - **Main Content**: Search and filter functionality, broker cards in responsive grid, comparison selection system
    - **Right Sidebar**: Featured broker showcase, trending brokers ranking, recent reviews display, scam alerts system, broker tools (calculators), educational resources, community recommendations, newsletter signup
    - **Note**: Advanced filter UI is implemented but non-functional pending broker schema extension with required fields (regulation types, account types, leverage details, platform info, etc.)
- **Community Members**: 3-column responsive layout with comprehensive leaderboard and member features:
    - **Left Sidebar**: Advanced member filters (by role, activity status, coin range, join date), leaderboard categories (6 types), community stats dashboard, top achievements showcase
    - **Main Content**: Member search, leaderboard tabs (Coins/Active/Publishers), member cards in responsive grid (1/2/3 columns), "Climb the Leaderboard" CTA
    - **Right Sidebar**: Member of the Month spotlight (gradient card with stats and bio), Trending This Week (top 5 with coin changes), Recent Activity feed (6 activities with timestamps), New Members (4 newest with welcome badges)
    - **Safety**: Production-ready with comprehensive guards (array safety, numeric safety, string safety, hydration safety), graceful empty states, SSR-compatible
    - **Note**: Advanced filter UI is implemented but non-functional pending user schema extension with role/activity metadata fields. Working filters: search query.
- **Admin Dashboard**: Provides comprehensive tools for content moderation, marketplace management, finance management, broker management, schema validation, and analytics monitoring.
    - **Admin Marketplace Management System**: Features a comprehensive moderation workflow (approve/reject/feature/soft-delete), advanced search and filtering, pagination, interactive modals, and sales analytics.
    - **Admin Finance Management System**: Includes multi-source revenue tracking, multi-method withdrawal workflow, unified transaction monitoring with CSV export, and detailed revenue analytics.
    - **Admin Broker Management System**: Offers comprehensive moderation for broker directories, auto-flag scam protection, advanced search and filtering, and interactive modals for broker and review management.

## External Dependencies
- **Database**: Neon (PostgreSQL-compatible, serverless)
- **Authentication**: Replit Auth (OIDC)
- **Analytics**: Google Analytics 4, Yandex Webmaster Tools, Bing Webmaster Tools, Seznam Webmaster
- **Tag Management**: Google Tag Manager (via `NEXT_PUBLIC_GTM_ID`)