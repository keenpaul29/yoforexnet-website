# Quick Start: Copy React to Next.js

## 🚀 Start Here

### Current Setup
- **React App**: `client/src/*` - Full functional app (24 pages)
- **Next.js App**: `app/*` - Partial (needs completion)
- **Express API**: `server/*` - Running on port 5000
- **Goal**: Copy React → Next.js with 100% identical design for SEO

### Running Both Servers
```bash
# Start both (currently configured)
npm run dev:hybrid

# This runs:
# - Express (port 5000) + React SPA
# - Next.js (port 3000) for SEO pages
```

---

## ✅ Phase 2: Copy Components (START HERE)

### Step 1: Copy Header Component
```bash
# 1. Copy the file
cp client/src/components/Header.tsx app/components/Header.tsx

# 2. Edit app/components/Header.tsx
# Add at the very top:
"use client";

# 3. Update imports - change Wouter to Next.js:
# FROM: import { Link } from "wouter";
# TO:   import Link from "next/link";

# 4. Update API URL:
# Add: const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
# Use it for API calls
```

### Step 2: Copy ThemeContext
```bash
cp client/src/contexts/ThemeContext.tsx app/contexts/ThemeContext.tsx

# Add "use client" at top
# Keep localStorage logic identical
```

### Step 3: Copy Interactive Components

For each component in this order:
1. ForumThreadCard
2. StatsBar
3. WhatsHot
4. TopSellers
5. CategoryCard
6. CoinBalance
7. CreateThreadButton
8. ThemeToggle

**Process**:
```bash
# Copy
cp client/src/components/[ComponentName].tsx app/components/[ComponentName].tsx

# Edit the file:
1. Add "use client" at top
2. Change Wouter imports to Next.js
3. Update API URLs to use EXPRESS_URL
4. Test in browser
```

---

## ✅ Phase 3: Copy Homepage

### Step 1: Create Client Component
```bash
# Create: app/HomeClient.tsx
```

```typescript
"use client";

import { useQuery } from '@tanstack/react-query';
// ... copy all logic from client/src/pages/Home.tsx

export function HomeClient({ initialStats }) {
  // EXACT copy of Home.tsx code
  const { data } = useQuery({
    queryKey: ['/api/stats'],
    initialData: initialStats,
  });
  
  // Same JSX as React version
  return <div>...identical design...</div>;
}
```

### Step 2: Update Server Page
```bash
# Edit: app/page.tsx
```

```typescript
import { HomeClient } from './HomeClient';

export const metadata = {
  title: 'YoForex - Expert Advisor Forum & EA Marketplace',
  description: '...',
};

export default async function HomePage() {
  // Fetch initial data for SEO
  const EXPRESS_URL = process.env.EXPRESS_URL || 'http://localhost:5000';
  const res = await fetch(`${EXPRESS_URL}/api/stats`, {
    cache: 'no-store',
  });
  const initialStats = await res.json();

  return <HomeClient initialStats={initialStats} />;
}
```

### Step 3: Test
```bash
# Open both in browser:
http://localhost:5000/          # React version
http://localhost:3000/          # Next.js version

# Compare side-by-side - must be IDENTICAL
```

---

## ✅ Phase 4: Copy Thread Detail Page

### Create Files:
```bash
mkdir -p app/thread/[slug]
touch app/thread/[slug]/page.tsx
touch app/thread/[slug]/ThreadClient.tsx
```

### ThreadClient.tsx
```typescript
"use client";

// Copy entire ThreadDetailPage.tsx from client/src/pages/
export function ThreadClient({ initialThread, slug }) {
  // EXACT copy of ThreadDetailPage logic
}
```

### page.tsx
```typescript
import { ThreadClient } from './ThreadClient';

export async function generateMetadata({ params }) {
  // Fetch thread for SEO
  const EXPRESS_URL = process.env.EXPRESS_URL || 'http://localhost:5000';
  const res = await fetch(`${EXPRESS_URL}/api/threads/${params.slug}`);
  const thread = await res.json();
  
  return {
    title: thread.title,
    description: thread.metaDescription,
  };
}

export default async function ThreadPage({ params }) {
  const EXPRESS_URL = process.env.EXPRESS_URL || 'http://localhost:5000';
  const res = await fetch(`${EXPRESS_URL}/api/threads/${params.slug}`, {
    cache: 'no-store',
  });
  const initialThread = await res.json();

  return <ThreadClient initialThread={initialThread} slug={params.slug} />;
}
```

---

## 🔧 Common Patterns

### Pattern: Copy Any React Page to Next.js

1. **Create directory structure**
```bash
mkdir -p app/your-route
touch app/your-route/page.tsx
touch app/your-route/YourPageClient.tsx
```

2. **YourPageClient.tsx** (Client Component)
```typescript
"use client";

// Copy ENTIRE React page component here
// Just add "use client" at top
// Update imports (Wouter → Next.js)
// Keep ALL logic identical

export function YourPageClient({ initialData }) {
  // Exact copy of React page code
  const { data } = useQuery({
    queryKey: ['/api/endpoint'],
    initialData,
  });
  
  return <div>...same design...</div>;
}
```

3. **page.tsx** (Server Component for SEO)
```typescript
import { YourPageClient } from './YourPageClient';

export const metadata = {
  title: 'Your Page Title',
  description: 'Your description',
};

export default async function YourPage() {
  // Optional: Fetch initial data server-side
  const EXPRESS_URL = process.env.EXPRESS_URL || 'http://localhost:5000';
  const res = await fetch(`${EXPRESS_URL}/api/endpoint`, {
    cache: 'no-store',
  });
  const initialData = await res.json();

  return <YourPageClient initialData={initialData} />;
}
```

4. **Test**: Compare React vs Next.js visually

---

## 🚨 Important Rules

### ✅ DO:
- Copy components exactly (no changes)
- Add `"use client"` for interactive components
- Test each page side-by-side with React
- Keep design 100% identical
- Use Express API for all data (not direct DB)

### ❌ DON'T:
- Change any styling or layout
- Rewrite components from scratch
- Skip the "use client" directive
- Modify React version
- Use direct DB queries (keep Server Components minimal)

---

## 📝 Quick Reference

### Import Changes
```typescript
// React (Wouter)
import { Link, useLocation } from "wouter";

// Next.js
import Link from "next/link";
import { usePathname } from "next/navigation";
```

### Router Params
```typescript
// React (Wouter)
import { useRoute } from "wouter";
const [match, params] = useRoute("/thread/:slug");

// Next.js (Client Component)
import { useParams } from "next/navigation";
const params = useParams();

// Next.js (Server Component)
export default function Page({ params }) {
  const { slug } = params;
}
```

### Environment Variables
```typescript
// React (Vite)
import.meta.env.VITE_API_URL

// Next.js (Client & Server)
process.env.NEXT_PUBLIC_EXPRESS_URL
```

---

## 🧪 Testing Checklist

For each copied page:
- [ ] Open React version (port 5000)
- [ ] Open Next.js version (port 3000)
- [ ] Compare side-by-side
- [ ] Check: Layout identical?
- [ ] Check: Colors identical?
- [ ] Check: Spacing identical?
- [ ] Check: Buttons work?
- [ ] Check: Forms work?
- [ ] Check: API calls work?
- [ ] Check: Theme toggle works?
- [ ] Check: Mobile responsive?
- [ ] Check: No console errors?

---

## 📊 Progress Tracker

Update this as you copy:

**Components** (0/14 copied):
- [ ] Header
- [ ] Footer
- [ ] ThemeContext
- [ ] ForumThreadCard
- [ ] StatsBar
- [ ] WhatsHot
- [ ] TopSellers
- [ ] CategoryCard
- [ ] EACard
- [ ] UserProfileCard
- [ ] CoinBalance
- [ ] CreateThreadButton
- [ ] ThemeToggle
- [ ] Leaderboard

**High-Priority Pages** (0/6 copied):
- [ ] Homepage (/)
- [ ] Thread (/thread/[slug])
- [ ] Content (/content/[slug])
- [ ] User Profile (/user/[username])
- [ ] Category (/category/[slug])
- [ ] Broker (/brokers/[slug])

---

## 🆘 Troubleshooting

**Error: "Cannot use useState in Server Component"**
→ Add `"use client"` at top of file

**Error: "Module not found"**
→ Check import paths use `@/` correctly

**API returns 401**
→ Add `credentials: 'include'` to fetch

**Design doesn't match**
→ Check if you copied ALL classes and styling

**Theme not working**
→ Make sure ThemeContext is wrapped in root layout

---

**Ready?** Start with Phase 2, Step 1: Copy Header component! 🚀
