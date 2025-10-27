# YoForex Deployment Guide - Next.js Smart Hybrid

## Architecture Overview

YoForex uses a **Smart Hybrid** architecture:
- **Next.js 15 (Port 3000)**: SEO-critical pages with Server Components + direct PostgreSQL access
- **Express (Port 5000)**: Authentication, mutations, background jobs, email service

## Environment Variables

### Required for Both Next.js and Express

Create a `.env` file in the root directory (see `.env.example`):

```bash
# Database (shared by both)
DATABASE_URL=postgresql://user:password@host:port/database

# Express Backend URL
EXPRESS_URL=http://localhost:5000
NEXT_PUBLIC_EXPRESS_URL=http://localhost:5000

# Base URL for SEO
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Brevo Email
BREVO_API_KEY=your-api-key
BREVO_FROM_EMAIL=noreply@yourdomain.com
BREVO_SMTP_PASSWORD=your-password

# Session
SESSION_SECRET=generate-secure-random-string

# Replit Auth
REPLIT_CLIENT_ID=your-client-id
REPLIT_CLIENT_SECRET=your-client-secret
REPLIT_ISSUER=https://replit.com

# Callbacks
BASE_URL=http://localhost:5000
```

## Local Development

### Option 1: Run Both Servers (Recommended for Full Testing)

```bash
# Terminal 1: Express Backend
npm run dev

# Terminal 2: Next.js Frontend
npm run dev:next
```

- Express: http://localhost:5000 (auth, mutations, jobs)
- Next.js: http://localhost:3000 (SEO pages)

### Option 2: Express Only (Old React Client)

```bash
npm run dev
```

- Full app: http://localhost:5000

## Production Deployment

### 1. Vercel Deployment (Next.js)

```bash
# Build Next.js
npm run build:next

# Deploy to Vercel
vercel --prod
```

**Environment Variables on Vercel:**
- `DATABASE_URL`
- `NEXT_PUBLIC_EXPRESS_URL` (your Express API URL)
- `NEXT_PUBLIC_BASE_URL` (your domain)

### 2. Express Backend (Railway, Render, etc.)

```bash
# Build Express
npm run build

# Start production
npm start
```

**Environment Variables:**
- All variables from `.env.example`
- `PORT=5000`

## SEO Pages Migrated to Next.js

✅ **Server Components (Direct DB Access)**:
- `/thread/[slug]` - Forum threads
- `/content/[slug]` - Marketplace items
- `/user/[username]` - User profiles
- `/category/[slug]` - Category listings

✅ **Global SEO**:
- `/sitemap.xml` - Auto-generated from database
- `/robots.txt` - Crawl rules

## Performance Features

- **ISR (Incremental Static Regeneration)**: 60s revalidation
- **Static Generation**: Top 100 threads/content pre-rendered
- **Direct DB Access**: 10-30ms queries (no Express hop)
- **Parallel Queries**: React Suspense boundaries

## Monitoring

Check Core Web Vitals:
- LCP target: < 1.0s
- FCP target: < 0.5s
- Lighthouse SEO: 95+

## Troubleshooting

### "Cannot connect to Express API"
- Ensure `NEXT_PUBLIC_EXPRESS_URL` is set correctly
- Check Express is running on port 5000

### "Database connection failed"
- Verify `DATABASE_URL` is correct
- Ensure database allows connections from your IP

### "Authentication not working"
- Check Replit OIDC credentials
- Verify callback URLs match `BASE_URL`

## Next Steps

- [ ] Migrate Homepage to Next.js
- [ ] Add shared navigation layout
- [ ] Implement authentication UI in Next.js
- [ ] Add client-side analytics
