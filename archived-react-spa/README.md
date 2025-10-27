# Archived React SPA Code

**Date Archived**: October 27, 2025  
**Reason**: Migrated to Next.js for SSR/SEO benefits

## What's Here

This folder contains the original React SPA code that powered YoForex platform. All functionality has been migrated to Next.js with 100% feature and design parity.

### Original Structure
- `src/` - React SPA source code
  - `pages/` - All 28 React pages
  - `components/` - Reusable React components
  - `contexts/` - React context providers
  - `lib/` - Utilities and helpers
  - `hooks/` - Custom React hooks

## Migration Status

✅ **COMPLETE** - All 28 pages migrated to Next.js

See `MIGRATION_VERIFICATION.md` in the root for detailed comparison.

## Restoration (If Needed)

To restore the hybrid architecture:
1. Copy `src/` back to `client/src/`
2. Update workflow to run `npm run dev:hybrid`
3. Update Express server to serve React SPA
4. Restart the application

## Current Architecture

**Frontend**: Next.js 16 (App Router) at port 3000  
**Backend**: Express.js at port 5000  
**Database**: PostgreSQL (Neon)  
**Auth**: Replit OIDC

## DO NOT USE

This code is archived for backup purposes only. The live platform uses Next.js exclusively.
