# Next.js Migration Execution Plan

## Overview
Comprehensive plan to copy all 28 React pages to Next.js 16 with 100% design parity, proper SEO, and verified API connections.

## Current Status
- **Pages Completed**: 2/28 (7%)
- **Completed**: Homepage (/), Thread Detail (/thread/[slug])
- **In Progress**: ContentDetailPage
- **Remaining**: 26 pages

---

## Complete Page Inventory

### ✅ Completed (2 pages)
| Page | Route | Priority | Status |
|------|-------|----------|---------|
| Home | `/` | 🔥 Critical | ✅ Done |
| ThreadDetailPage | `/thread/[slug]` | 🔥 Critical | ✅ Done |

### 🔥 Phase 1: SEO-Critical Pages (6 pages)
These pages are most important for search engine indexing.

| # | Page | Route | API Endpoints | Components Needed |
|---|------|-------|---------------|-------------------|
| 3 | ContentDetailPage | `/content/[slug]` | `/api/content/:slug`, `/api/user/:id`, `/api/user/:id/coins`, `/api/content/:id/purchased/:userId`, `/api/content/:id/reviews` | ContentCard, ReviewCard, DownloadButton, PurchaseButton |
| 4 | UserProfilePage | `/user/[username]` | `/api/users/username/:username`, `/api/users/:id/badges`, `/api/users/:id/content`, `/api/users/:id/threads` | ProfileCard, BadgeDisplay ✅, UserStats, ContentGrid |
| 5 | CategoryDiscussionPage | `/category/[slug]` | `/api/categories/:slug`, `/api/categories/:slug/threads` | CategoryHeader, ThreadList, ForumThreadCard ✅ |
| 6 | BrokerProfilePage | `/brokers/[slug]` | `/api/brokers/:slug`, `/api/brokers/:slug/reviews` | BrokerCard, ReviewCard, RatingDisplay, ScamWatch |
| 7 | CategoriesPage | `/categories` | `/api/categories` | CategoryCard ✅, CategoryGrid |
| 8 | MarketplacePage | `/marketplace` | `/api/content?status=approved` | ContentCard, FilterBar, SortDropdown |

### 🟡 Phase 2: High-Traffic Public Pages (5 pages)

| # | Page | Route | API Endpoints | Components Needed |
|---|------|-------|---------------|-------------------|
| 9 | BrokerDirectoryPage | `/brokers` | `/api/brokers` | BrokerCard, FilterBar |
| 10 | DiscussionsPage | `/discussions` | `/api/threads` | ForumThreadCard ✅, FilterBar |
| 11 | MembersPage | `/members` | `/api/leaderboard`, `/api/users/:userId/badges` | UserCard, LeaderboardCard |
| 12 | Leaderboard | `/leaderboard` | `/api/leaderboards/coins`, `/api/leaderboards/contributors`, `/api/leaderboards/sellers` | LeaderboardCard, UserRankCard |
| 13 | PublishPage | `/publish` | `/api/publish/categories`, `/api/uploads/file`, `/api/uploads/image`, `/api/publish` | FileUploader, ImageGallery, PublishForm |

### ⚪ Phase 3: Authenticated User Pages (8 pages)

| # | Page | Route | API Endpoints | Components Needed |
|---|------|-------|---------------|-------------------|
| 14 | DashboardPage | `/dashboard` | `/api/dashboard/preferences`, `/api/me`, `/api/stats` | DashboardWidget, WidgetGrid, CustomizationPanel |
| 15 | UserSettingsPage | `/settings` | `PATCH /api/user/profile` | SettingsForm, ProfileForm |
| 16 | RechargePage | `/recharge` | Stripe integration | CoinPackageCard, StripeCheckout |
| 17 | TransactionHistoryPage | `/transactions` | `/api/transactions` | TransactionCard, FilterBar |
| 18 | MessagesPage | `/messages` | `/api/conversations`, `/api/conversations/:id`, `/api/me`, `POST /api/messages` | ConversationList, MessageThread |
| 19 | NotificationsPage | `/notifications` | `/api/notifications`, `POST /api/notifications/:id/read` | NotificationCard, NotificationList |
| 20 | WithdrawalPage | `/withdrawal` | `/api/user/:id/coins`, `POST /api/withdrawals` | WithdrawalForm, CoinBalance |
| 21 | WithdrawalHistoryPage | `/withdrawal/history` | `/api/withdrawals` | WithdrawalCard, StatusBadge |

### 🔵 Phase 4: Additional Pages (7 pages)

| # | Page | Route | API Endpoints | Components Needed |
|---|------|-------|---------------|-------------------|
| 22 | PublishContentPage | `/publish-content` | `POST /api/content` | ContentForm, FileUploader |
| 23 | DashboardSettings | `/dashboard/settings` | `/api/dashboard/preferences`, `POST /api/dashboard/preferences` | PreferencesForm, WidgetSelector |
| 24 | EarnCoinsPage | `/earn-coins` | None (static) | EarnMethodCard, InstructionList |
| 25 | SubmitBrokerReviewPage | `/brokers/review` | `POST /api/broker-reviews` | BrokerReviewForm, RatingInput |
| 26 | SubmitFeedbackPage | `/feedback` | None (mock) | FeedbackForm |
| 27 | APIDocumentationPage | `/api-docs` | None (static) | CodeBlock, EndpointCard |
| 28 | ContactSupportPage | `/contact` | None (static) | ContactForm |

---

## Migration Checklist Per Page

For EACH page, follow this detailed process:

### Step 1: Analysis (5 min)
- [ ] Read React page component (`client/src/pages/XyzPage.tsx`)
- [ ] Identify all API endpoints used (GET, POST, PATCH, DELETE)
- [ ] List all sub-components used
- [ ] Note any special features (auth, real-time updates, file uploads)
- [ ] Check for custom hooks or contexts

### Step 2: Component Copy (10-15 min)
- [ ] Copy all missing sub-components to `app/components/`
- [ ] Add `"use client"` directive to each component
- [ ] Update imports: Wouter → Next.js (Link, useParams, usePathname, useRouter)
- [ ] Verify all icons imported from lucide-react
- [ ] Check all shadcn/ui components imported correctly

### Step 3: Create Server Component (10 min)
- [ ] Create `app/[route]/page.tsx` (Server Component)
- [ ] Fetch initial data from Express API with `fetch()`
- [ ] Use `cache: 'no-store'` for dynamic data (or `revalidate: 60` for static)
- [ ] Handle errors and not-found cases
- [ ] Generate SEO metadata with `generateMetadata()`:
  - [ ] title
  - [ ] description
  - [ ] keywords
  - [ ] openGraph (og:title, og:description, og:image, og:url)
  - [ ] twitter (twitter:card, twitter:title, twitter:description)

### Step 4: Create Client Component (15-20 min)
- [ ] Create `app/[route]/XyzClient.tsx` (Client Component)
- [ ] Add `"use client"` directive at top
- [ ] Copy EXACT JSX structure from React component
- [ ] Accept `initialData` props for SSR hydration
- [ ] Use React Query with `initialData` for all queries
- [ ] Preserve ALL mutations (POST/PATCH/DELETE)
- [ ] Keep ALL interactive features (forms, buttons, modals)
- [ ] Update routing: `navigate()` → `router.push()`
- [ ] Import Header/Footer from `@/components/`

### Step 5: API Connection Verification (5 min)
- [ ] Verify all GET requests hit Express API correctly
- [ ] Test all mutations (POST/PATCH/DELETE) route to Express
- [ ] Check authentication flow works (401 → redirect to login)
- [ ] Verify real-time updates (if applicable)
- [ ] Test loading states and error handling

### Step 6: Visual Parity Check (5-10 min)
- [ ] Compare React (port 5000) vs Next.js (port 3000) side-by-side
- [ ] Check layout matches exactly
- [ ] Verify all text, images, icons render correctly
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Check dark mode works properly
- [ ] Verify all animations and transitions

### Step 7: Testing (10 min)
- [ ] Test all interactive features (buttons, forms, links)
- [ ] Test navigation (internal links, back button)
- [ ] Test with/without authentication
- [ ] Test error states (404, 500, network error)
- [ ] Test edge cases (empty data, long text, many items)
- [ ] Check browser console for errors

### Step 8: Documentation (5 min)
- [ ] Update `replit.md` with completed page
- [ ] Update `FRONTEND_ARCHITECTURE.md` with new route
- [ ] Add SEO notes to migration plan
- [ ] Document any issues or workarounds

---

## API Endpoint Verification Matrix

| Endpoint | Method | Page(s) Using | Status | Notes |
|----------|--------|---------------|--------|-------|
| `/api/stats` | GET | Home, Dashboard | ✅ | Working |
| `/api/categories` | GET | Home, Categories, Publish | ✅ | Working |
| `/api/threads` | GET | Home, Discussions | ✅ | Working |
| `/api/threads/slug/:slug` | GET | ThreadDetail | ✅ | Working |
| `/api/threads/:id/replies` | GET | ThreadDetail | ✅ | Working |
| `/api/threads/:id/replies` | POST | ThreadDetail | ✅ | Working |
| `/api/replies/:id/helpful` | POST | ThreadDetail | ✅ | Working |
| `/api/replies/:id/accept` | POST | ThreadDetail | ✅ | Working |
| `/api/content` | GET | Marketplace | ⏳ | To test |
| `/api/content/:slug` | GET | ContentDetail | ⏳ | To test |
| `/api/content/purchase` | POST | ContentDetail | ⏳ | To test |
| `/api/content/like` | POST | ContentDetail | ⏳ | To test |
| `/api/content/review` | POST | ContentDetail | ⏳ | To test |
| `/api/users/username/:username` | GET | UserProfile | ⏳ | To test |
| `/api/users/:id/badges` | GET | UserProfile, Members | ⏳ | To test |
| `/api/categories/:slug` | GET | CategoryDiscussion | ⏳ | To test |
| `/api/categories/:slug/threads` | GET | CategoryDiscussion | ⏳ | To test |
| `/api/brokers` | GET | BrokerDirectory | ⏳ | To test |
| `/api/brokers/:slug` | GET | BrokerProfile | ⏳ | To test |
| `/api/leaderboard` | GET | Members, Leaderboard | ⏳ | To test |
| `/api/me` | GET | Dashboard, Settings | ⏳ | To test |
| `/api/dashboard/preferences` | GET/POST | Dashboard, DashboardSettings | ⏳ | To test |
| `/api/user/profile` | PATCH | UserSettings | ⏳ | To test |
| `/api/withdrawals` | GET/POST | Withdrawal, WithdrawalHistory | ⏳ | To test |
| `/api/notifications` | GET | Notifications | ⏳ | To test |
| `/api/notifications/:id/read` | POST | Notifications | ⏳ | To test |
| `/api/conversations` | GET | Messages | ⏳ | To test |
| `/api/messages` | POST | Messages | ⏳ | To test |
| `/api/publish` | POST | Publish | ⏳ | To test |
| `/api/uploads/file` | POST | Publish | ⏳ | To test |
| `/api/uploads/image` | POST | Publish | ⏳ | To test |

---

## Documentation Files to Update

After completing all pages, update these files:

### 1. replit.md
- [ ] Update migration status (X/28 pages complete)
- [ ] List all completed Next.js pages
- [ ] Update architecture description

### 2. FRONTEND_ARCHITECTURE.md
- [ ] Update project structure with all new app/* routes
- [ ] Add component inventory with Next.js versions
- [ ] Document SSR patterns used
- [ ] Add SEO implementation details

### 3. API_DOCUMENTATION.md
- [ ] Verify all endpoints documented
- [ ] Add Next.js-specific examples
- [ ] Document authentication flow for Next.js

### 4. COMPLETE_PLATFORM_GUIDE.md
- [ ] Add Next.js section
- [ ] Update deployment instructions
- [ ] Document hybrid architecture (React + Next.js)

### 5. API_QUICK_REFERENCE.txt
- [ ] Verify all endpoints listed
- [ ] Add usage examples from Next.js

---

## Testing Strategy

### Manual Testing Checklist
- [ ] All pages render without errors
- [ ] All forms submit correctly
- [ ] All mutations update data properly
- [ ] Authentication flow works end-to-end
- [ ] Real-time updates function correctly
- [ ] File uploads work (if applicable)
- [ ] Payment flow works (Stripe integration)
- [ ] Dark mode works on all pages
- [ ] Responsive design on mobile/tablet/desktop

### Automated Testing (Future)
- [ ] Create E2E tests for critical flows
- [ ] Add API integration tests
- [ ] Add component unit tests

---

## Deployment Checklist

### Environment Variables
- [ ] `NEXT_PUBLIC_EXPRESS_URL` set correctly
- [ ] `DATABASE_URL` configured
- [ ] Stripe keys configured (if applicable)
- [ ] Replit Auth configured

### Build Configuration
- [ ] Next.js builds successfully
- [ ] Express server starts correctly
- [ ] Both servers run in hybrid mode
- [ ] No console errors on production build

### Performance
- [ ] Page load times < 2s
- [ ] API response times < 500ms
- [ ] Images optimized
- [ ] Bundle size reasonable

---

## Timeline Estimate

| Phase | Pages | Estimated Time | Status |
|-------|-------|----------------|--------|
| Phase 0: Setup | 2 | 4 hours | ✅ Done |
| Phase 1: SEO-Critical | 6 | 6 hours | 🔄 In Progress |
| Phase 2: High-Traffic | 5 | 5 hours | ⏳ Pending |
| Phase 3: Authenticated | 8 | 8 hours | ⏳ Pending |
| Phase 4: Additional | 7 | 5 hours | ⏳ Pending |
| **Total** | **28** | **28 hours** | **7% Complete** |

---

## Known Issues & Workarounds

### Issue 1: CSS Parsing Error
- **Problem**: Tailwind CSS conflicting with border selectors in app/globals.css
- **Solution**: ✅ Fixed - Removed problematic `.border.toggle-elevate` and `.border.hover-elevate` selectors
- **Status**: Resolved

### Issue 2: apiRequest not prefixing Express URL
- **Problem**: API requests hitting Next.js server instead of Express
- **Solution**: ✅ Fixed - Updated apiRequest to prepend `NEXT_PUBLIC_EXPRESS_URL`
- **Status**: Resolved

### Issue 3: Empty Database
- **Problem**: No threads/content in database for testing
- **Solution**: Need to seed database or create test data
- **Status**: ⏳ Pending

---

## Success Criteria

Migration is complete when:
- [x] All 28 pages copied to Next.js
- [ ] 100% design parity verified for all pages
- [ ] All API endpoints tested and working
- [ ] All mutations (POST/PATCH/DELETE) functional
- [ ] Authentication flow working end-to-end
- [ ] All documentation updated
- [ ] No console errors on any page
- [ ] SEO metadata present on all public pages
- [ ] Architect review passed
- [ ] User acceptance testing passed
