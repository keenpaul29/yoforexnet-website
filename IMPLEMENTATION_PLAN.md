# YoForex EABOOK-Style Implementation Plan

## Overview
This plan transforms YoForex into a comprehensive EABOOK-style platform with professional design, EA publishing workflow, file uploads, payment integration, and gamification.

---

## 🎯 Phase 1: Design Fixes & UI Polish (Week 1)

### Priority: HIGH - Immediate Visual Impact

### 1.1 Category Cards Redesign
**Goal:** Match EABOOK's professional card layout

**Current Issues:**
- Cards too tall and narrow (~200px width)
- Inconsistent spacing and gaps
- No hover lift effects
- Stats stacked vertically (hard to scan)

**Solution:**
- **Landscape cards:** 280-320px width × 160-180px height
- **Grid system:** CSS Grid with `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
- **Gap:** Consistent 20-24px between cards
- **Typography:**
  - Category title: 16-18px semibold
  - Description: 13-14px with **2-line clamp** for consistency
  - Stats: 12-13px horizontal layout
- **Icon:** 40-48px in colored circle
- **Hover state:** 
  - `transform: translateY(-4px)` lift effect
  - `box-shadow: 0 8px 16px rgba(0,0,0,0.12)`
  - Border color shift to primary
- **Responsive:**
  - Mobile: 1 column
  - Tablet: 2 columns
  - Desktop: 3 columns
  - Large: 4 columns

**Technical Implementation:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
  <Card className="hover:-translate-y-1 hover:shadow-lg transition-all">
    <div className="p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-base font-semibold line-clamp-2">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      <div className="flex items-center gap-4 text-xs">
        <span>👥 {threads} threads</span>
        <span>💬 {posts} posts</span>
      </div>
    </div>
  </Card>
</div>
```

---

### 1.2 What's Hot - Compact Typography
**Goal:** Match TopSellers' compact, scannable style

**Current Issues:**
- Title text too large (16-18px)
- Meta text too large (14px)
- Excessive vertical spacing (12-16px gaps)
- Variable card heights
- Stats hard to scan

**Solution:**
- **Title:** Reduce to 14px (`text-sm`) with `line-height: 1.4`
- **Meta:** 12px (`text-xs`) for author, views, comments, time
- **Vertical spacing:** 4-8px between elements (`space-y-1`)
- **Card padding:** 12px (`p-3`) instead of 16-20px
- **Stats layout:** Single horizontal line with icons at 12px
- **Uniform height:** All cards same height with consistent internal spacing

**Before/After Comparison:**
| Element | Before | After |
|---------|--------|-------|
| Title | 16-18px | 14px |
| Meta | 14px | 12px |
| Line-height | 1.8 (loose) | 1.4 (tight) |
| Vertical spacing | 12-16px | 4-8px |
| Card padding | 16-20px | 12px |

---

## 🚀 Phase 2: "Release EA" Publishing Flow (Week 2-3)

### Priority: HIGH - Core Feature Request

### 2.1 Header Navigation Dropdown
**Goal:** Hover-activated category menu on "Release EA" nav item

**Features:**
- **Hover trigger:** 150ms delay before dropdown appears
- **Keyboard navigation:** Arrow keys, Esc to close, Enter to select
- **Mouse navigation:** Smooth transitions, stays open on hover
- **ARIA roles:** `role="menu"`, `aria-haspopup`, proper focus management
- **16 Categories:** All forum categories with icons and mini descriptions
- **Pre-fill category:** When clicked from dropdown, pre-select in form
- **LocalStorage:** Remember last-used category

**Technical Implementation:**
```tsx
<NavigationMenu>
  <NavigationMenuItem>
    <NavigationMenuTrigger>Release EA</NavigationMenuTrigger>
    <NavigationMenuContent>
      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
        {categories.map(cat => (
          <li key={cat.slug}>
            <Link href={`/publish?category=${cat.slug}`}>
              <a className="flex items-center gap-3 p-3 rounded hover:bg-accent">
                <cat.Icon className="w-5 h-5" />
                <div>
                  <div className="font-medium">{cat.name}</div>
                  <p className="text-xs text-muted-foreground">{cat.hint}</p>
                </div>
              </a>
            </Link>
          </li>
        ))}
      </ul>
    </NavigationMenuContent>
  </NavigationMenuItem>
</NavigationMenu>
```

---

### 2.2 Structured EA Release Form (`/publish`)

**Required Fields:**
- ✅ **Title:** 10-120 characters with live counter
- ✅ **Platform:** Radio buttons (MT4 / MT5 / Both)
- ✅ **Version:** Semantic versioning (e.g., 1.0.0)
- ✅ **Price:** 0-10,000 coins or "Free" toggle
- ✅ **Category:** Pre-filled from dropdown or manual select
- ✅ **Description:** Markdown editor, ≥300 chars, code blocks support
- ✅ **Tags:** Max 8 tags with autocomplete
- ✅ **File Upload:** At least 1 file (EA/indicator/tool)
- ✅ **Image Upload:** At least 1 image (cover + gallery)

**Optional but Encouraged:**
- Broker compatibility list
- Minimum deposit recommendation
- Hedging/Netting support
- Change log for updates
- License notes

**Evidence-Required Mode:**
- If "Performance Report" tag selected:
  - Equity curve image upload (required)
  - Profit Factor, Drawdown %, Win% fields
  - Broker name, months traded
  - Strategy quality rating

**Validation:**
- **Client-side:** React Hook Form + Zod schema
- **Real-time counters:** Character counts for title/description
- **Disabled submit:** Until all required fields valid
- **Server-side:** Double validation before database insert

**Form Layout:**
```
┌─────────────────────────────────────────┐
│  Publish Your EA / Indicator            │
├─────────────────────────────────────────┤
│  Basic Info                             │
│  • Title [________] (10-120 chars)      │
│  • Platform: ○ MT4  ○ MT5  ○ Both       │
│  • Version: [1.0.0]                     │
│  • Category: [Dropdown ▼]              │
├─────────────────────────────────────────┤
│  Pricing                                │
│  • ☐ Free  or  Coins: [500]            │
├─────────────────────────────────────────┤
│  Description (Markdown Editor)          │
│  [Rich text editor with preview]        │
│  Characters: 324 / 300 minimum          │
├─────────────────────────────────────────┤
│  Files                                  │
│  [Drag & Drop Zone]                     │
│  • Gold_Hedger_v1.0.ex5 (254 KB) ✓     │
│  • SetFile_EURUSD.set (2 KB) ✓         │
├─────────────────────────────────────────┤
│  Images (Max 5)                         │
│  [Gallery Upload]                       │
│  • Cover: [Choose from uploads]         │
│  • Gallery: [Drag to reorder]           │
├─────────────────────────────────────────┤
│  Tags (Max 8)                           │
│  [+ scalping] [+ gold] [+ m1]          │
├─────────────────────────────────────────┤
│  [Cancel]  [Save Draft]  [Publish] →    │
└─────────────────────────────────────────┘
```

---

### 2.3 File Upload Pipeline

**Features:**
- **Drag & drop widget:** Visual feedback, progress bars
- **Multi-file support:** Max 5 files per release
- **File size limit:** 50 MB per file
- **Retry mechanism:** Resume failed uploads
- **Versioning:** Support v1.0, v1.1, v2.0 file sets
- **Security:**
  - MIME type sniffing (reject mismatched extensions)
  - Antivirus scanning (ClamAV or cloud API)
  - Checksum generation (SHA-256)
  - Disallow nested archives (.zip inside .zip)
- **Download UI:** Display checksum for buyer verification
- **Abuse tracking:** Log all downloads (userId, IP, timestamp)

**Upload Flow:**
```
User selects files
  → Client validates (size, type)
  → Upload to backend /api/upload
  → Server validates MIME
  → AV scan (async)
  → Generate SHA-256 checksum
  → Store in object storage
  → Return file URL + checksum
  → Client displays success with checksum
```

---

### 2.4 Image Upload & Gallery

**Features:**
- **Max 5 images** per post
- **Cover image selection:** First upload or manual selection
- **Drag-to-reorder:** Visual rearrangement
- **Auto watermarking:** 
  - "YoForex.net" + author username
  - Semi-transparent overlay in corner
  - Prevents piracy/redistribution
- **Responsive:** Auto-resize for thumbnails
- **Preview:** Lightbox gallery on detail page

---

### 2.5 Invisible SEO Engine

**Auto-Generated on Publish:**

| Field | Generation Logic |
|-------|------------------|
| `slug` | Title → kebab-case, unique suffix if duplicate |
| `focusKeyword` | Extract top 3 keywords from title |
| `metaDescription` | First 155 chars of description, cleaned |
| `autoImageAltTexts` | Array of descriptive alt text per image |

**Example:**
```
Title: "Gold Hedger EA 2025 - MT5 No DLL - RAW ECN Optimized"

Generated SEO:
• slug: "gold-hedger-ea-2025-mt5-no-dll-raw-ecn-optimized"
• focusKeyword: "gold hedger ea mt5"
• metaDescription: "Professional Gold Hedger EA for MT5 with no DLL dependencies. Optimized for RAW ECN brokers with tight spreads. Includes set files and..."
• autoImageAltTexts: [
    "Gold Hedger EA 2025 equity curve showing 145% gain over 12 months",
    "MT5 strategy tester report for Gold Hedger EA with 2.3 profit factor",
    "Gold Hedger EA dashboard showing live trades on XAUUSD M1"
  ]
```

**Persistence:**
- All SEO fields stored in `content` table
- Rendered in SSR/SSG pages for crawlers
- `<title>`, `<meta name="description">`, `<meta property="og:*">` tags

---

### 2.6 EABOOK-Style Post Detail Page

**Layout Structure:**

```
┌──────────────────────────────────────────────────┬─────────────┐
│  🏆 Gold Hedger EA 2025 - MT5 No DLL              │             │
│  by TraderJohn • Jan 15 • MT5 • v1.0.0           │  Similar    │
│  ⭐ Free  ✅ Verified  🔥 Hot                     │  EAs        │
├──────────────────────────────────────────────────┤             │
│  📁 Files (2)                                     │  • XAUUSD   │
│  • Gold_Hedger_v1.0.ex5 (254 KB)                 │    Scalper  │
│    SHA-256: a3f5...b9c2                          │  • Smart    │
│  • SetFile_EURUSD.set (2 KB)                     │    Grid EA  │
│    SHA-256: 7d2e...4f1a                          │             │
│  [Download for 500 coins] [Already Purchased ✓]  │  Author's   │
├──────────────────────────────────────────────────┤  Releases   │
│  📊 Key Specs                                     │             │
│  Platform: MT5 | Broker: RAW ECN | Min: $500     │  • Grid EA  │
│  Profit Factor: 2.3 | Max DD: 12% | Win%: 67%    │    v2.0     │
│  Months Tested: 12 | Strategy: Grid Hedging      │  • Trend    │
├──────────────────────────────────────────────────┤    Indi     │
│  📝 Description                                   │             │
│  [Markdown rendered content with headings,        │  Top This   │
│   code blocks, images, lists, etc.]              │  Week       │
│                                                   │             │
│  ## Features                                      │  • Best EA  │
│  - No DLL dependencies                            │  • Hot Indi │
│  - Optimized for XAUUSD M1 scalping              │  • Pro Grid │
│  - Works on RAW ECN brokers (spread ≤ 20)        │             │
│                                                   │  Important  │
│  ## Installation                                  │  Links      │
│  1. Download the .ex5 file                        │             │
│  2. Copy to MT5/MQL5/Experts/                    │  • How to   │
│  3. Load set file for your broker                │    Download │
│                                                   │  • Safe     │
│  [Full markdown content...]                       │    Policy   │
├──────────────────────────────────────────────────┤  • Posting  │
│  🏷️ Tags                                          │    Rules    │
│  [scalping] [gold] [m1] [no-dll] [raw-ecn]       │             │
└──────────────────────────────────────────────────┴─────────────┘
```

**Right Rail Modules:**
1. **Similar EAs:** Based on category + tags
2. **Author's Other Releases:** Latest 3 from same author
3. **Top This Week:** Trending in same category
4. **Important Links:**
   - "How to Download" → Help article
   - "Safe Download Policy" → Security guide
   - "Posting Guidelines" → Rules for publishers

**Inline Help Links:**
- Near Download button: "How to Download"
- Near file block: "Safe Download Policy"
- Near Publish button (on form): "Posting Guidelines"

---

## 💰 Phase 3: Gold Coin Economy & Payments (Week 3-4)

### Priority: HIGH - Monetization Core

### 3.1 Coin Earning Rules

| Action | Coins | Cap |
|--------|-------|-----|
| Publish EA | +50 | - |
| Share set file | +25 | - |
| Quality article (20-40 based on length/engagement) | +20-40 | - |
| Backtest report | +20 | - |
| Helpful reply upvote | +5 | 5/day |
| Accepted answer (bonus) | +25 | - |
| Daily active (login) | +5 | 1/day |
| Referral signup | +30 | - |
| Verified scam report | +50-150 | Based on severity |
| Link YouTube (one-time) | +50 | Once |
| Link Myfxbook (one-time) | +100 | Once |
| Link investor credentials (one-time) | +75 | Once |

**Caps & Restrictions:**
- Max 5 helpful votes can earn coins per day
- Max 2 bounties can be created per week
- Cannot buy own content (self-dealing blocked)
- Cannot earn from same action repeatedly (duplicate prevention)

**Implementation:**
All earning hooks call `createCoinTransaction("earn", amount, description)` which:
1. Validates user eligibility
2. Checks daily/weekly caps
3. Inserts transaction record
4. Updates user wallet balance
5. Logs audit trail

---

### 3.2 Atomic Purchase Flow

**User Flow:**
```
1. User clicks "Buy for 100 coins"
2. Confirmation modal shows:
   • Current balance: 2,450 coins
   • Purchase cost: -100 coins
   • After balance: 2,350 coins
   • Content preview
3. User confirms
4. Loading state: "Processing purchase..."
5. Success: Balance updated, download button appears
```

**Server Flow (Atomic Transaction):**
```sql
BEGIN TRANSACTION;

-- Validate balance
SELECT totalCoins FROM user_wallet WHERE userId = $buyerId FOR UPDATE;
IF totalCoins < 100 THEN ROLLBACK;

-- Debit buyer
INSERT INTO coin_transactions (userId, type, amount, description)
VALUES ($buyerId, 'spend', -100, 'Purchase: Gold Hedger EA');

-- Credit seller (90%)
INSERT INTO coin_transactions (userId, type, amount, description)
VALUES ($sellerId, 'earn', 90, 'Sale: Gold Hedger EA');

-- Credit platform (10%)
INSERT INTO coin_transactions (userId, type, amount, description)
VALUES ('platform', 'earn', 10, 'Platform fee: Gold Hedger EA');

-- Record purchase
INSERT INTO content_purchases (userId, contentId, priceCoins)
VALUES ($buyerId, $contentId, 100);

COMMIT;
```

**Error Handling:**
- `400 Insufficient balance` → Show "Recharge" link
- `200 Already purchased` → Return existing purchase record + download URL
- `404 Content not found` → Show error message
- `403 Cannot buy own content` → Prevent self-dealing

**Optimistic UI:**
- Immediately update balance on client
- Show download button
- Invalidate queries: `['/api/user/coins']`, `['/api/purchases']`

---

### 3.3 Recharge with Stripe & USDT

**Pricing Tiers:**

| Package | Coins | Bonus | USD | Label |
|---------|-------|-------|-----|-------|
| Starter | 22 | - | $1.99 | - |
| Best Value | 52 | +10 | $4.99 | ⭐ |
| Standard | 200 | +50 | $16.99 | - |
| Popular | 500 | +150 | $39.99 | 🔥 |
| Premium | 1000 | +350 | $69.99 | - |
| Best Deal | 2000 | +800 | $129.99 | 💎 |

**Payment Methods:**

#### A. Stripe (Credit/Debit Cards)
1. User selects package
2. Client calls `/api/stripe/create-checkout`
3. Server creates Stripe Checkout Session
4. Redirect to Stripe payment page
5. User completes payment
6. Stripe webhook `/api/stripe/webhook` fires
7. Verify HMAC signature
8. On `checkout.session.completed`:
   - Credit coins to user wallet
   - Create transaction record
   - Send receipt email
9. Redirect to success page

**Webhook Security:**
```ts
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  // Check idempotency: event.id already processed?
  // Credit coins atomically
}
```

#### B. USDT (CoinPayments API)
1. User selects package + "Pay with USDT"
2. Client calls `/api/coinpayments/create-invoice`
3. Server creates invoice via CoinPayments API
4. Show QR code + wallet address
5. Client polls `/api/coinpayments/check-status` every 5s
6. CoinPayments webhook `/api/coinpayments/webhook` fires
7. On `status=100` (payment confirmed):
   - Credit coins to user wallet
   - Create transaction record
8. Show success message

**Idempotency:**
- Check `event.id` (Stripe) or `invoice_id` (CoinPayments) uniqueness
- Prevent double credits on duplicate webhook calls
- Use database unique constraint on `recharge_orders.externalId`

**Compliance:**
- Display "Non-refundable" notice in checkout
- Coins are digital credits, not currency
- Show disclaimer in Terms of Service
- Include in receipts and confirmations

---

### 3.4 AML & Velocity Controls

**Recharge Limits:**
- Max $500/day per user
- Max $2,000/month per user
- Flag accounts exceeding limits for manual review

**Circular Flow Detection:**
- If User A buys from User B, then B buys from A repeatedly → flag
- Block suspicious patterns (>5 reciprocal transactions)

**Country/IP Risk Checks:**
- Block sanctioned regions (OFAC list)
- Log high-risk countries (fraud prone)
- Require KYC for large purchases (>$500)

**Seller Holdback (New Accounts):**
- Coins earned from sales held for 7 days
- "Pending" balance shown in wallet
- After 7 days → moves to "Available"
- Dispute window for buyers

---

## 🗣️ Phase 4: Forum, Threads & Nested Replies (Week 4-5)

### Priority: MEDIUM - Community Engagement

### 4.1 Thread Creation & Management

**Thread Schema:**
```ts
{
  id: string,
  userId: string,
  categorySlug: string,
  title: string,
  body: string (markdown),
  imageUrls: string[],
  isPinned: boolean,
  isLocked: boolean,
  isAnswered: boolean,
  views: number,
  replyCount: number,
  lastActivityAt: Date,
  slug: string (SEO),
  focusKeyword: string,
  metaDescription: string
}
```

**Create Endpoint:**
```ts
POST /api/threads
• Sanitize HTML with DOMPurify
• Generate SEO fields (slug, focusKeyword, metaDescription)
• Insert thread
• Award 25 coins to author
• Return thread object
```

**List by Category:**
```ts
GET /api/categories/:slug/threads?sort=latest|trending|answered
• Pagination: cursor-based (after=threadId)
• Sort options:
  - latest: ORDER BY createdAt DESC
  - trending: ORDER BY hotScore DESC
  - answered: WHERE isAnswered = true
```

**Trending Algorithm:**
```ts
hotScore = (views^0.1 + replies*5 + pinnedBonus*100) / (ageInHours + 2)^1.8

pinnedBonus = isPinned ? 1000 : 0
```

**Server-side cache:** 5 minutes TTL

---

### 4.2 Nested Replies (Unlimited Depth)

**Reply Schema:**
```ts
{
  id: string,
  threadId: string,
  userId: string,
  parentId: string | null,  // null for root-level
  body: string (markdown),
  slug: string (SEO),
  helpful: number,          // upvote count
  isAccepted: boolean,
  isVerified: boolean       // from verified traders
}
```

**Recursive Component:**
```tsx
function ReplyCard({ reply, depth = 0 }) {
  const { data: childReplies } = useQuery(`/api/replies/${reply.id}/children`);
  
  return (
    <div style={{ marginLeft: `${depth * 2}rem` }}>
      {/* Reply content */}
      <div className="p-4 border rounded">
        <p>{reply.body}</p>
        <div className="flex gap-2 mt-2">
          <Button onClick={() => markHelpful(reply.id)}>
            👍 Helpful ({reply.helpful})
          </Button>
          {isAuthor && (
            <Button onClick={() => acceptAnswer(reply.id)}>
              ✅ Accept Answer
            </Button>
          )}
          <Button onClick={() => setReplyingTo(reply.id)}>
            💬 Reply
          </Button>
        </div>
      </div>
      
      {/* Nested children */}
      {childReplies?.map(child => (
        <ReplyCard key={child.id} reply={child} depth={depth + 1} />
      ))}
    </div>
  );
}
```

**Actions:**
- **Mark Helpful:** Increment count, disable if already voted
- **Accept Answer:** Thread author only, unmarks other accepted replies
- **Reply:** Opens nested form under this reply

**Real-time polling:** Replies refetch every 15s for active discussions

---

### 4.3 Duplicate Detection

**On Compose:**
- Run semantic search (TF-IDF or embeddings) against existing titles
- Show "Possible duplicates" if similarity score > 0.7
- Inline hint during typing (debounced 500ms)
- User can click to view existing thread before posting

---

### 4.4 Moderation Queue

**Auto-Moderation Triggers:**
- Profanity filter (bad words list)
- Link shortener blocker (bit.ly, tinyurl.com)
- Duplicate detector (exact body match)
- Velocity spike (>10 posts/hour) → auto-lock thread

**Manual Queue:**
- First-post from new users
- First-upload from new users
- Reported content (user flags)
- Scam reports (high priority)

**Admin Actions:**
- Approve / Reject / Ban user
- Shadow-ban: User posts hidden except to themselves
- Escalation: Broker defamation → evidence review workflow

---

## 🏆 Phase 5: Trust, Reputation & Gamification (Week 5-6)

### Priority: MEDIUM - User Retention

### 5.1 Trust Level System

**5 Levels:**

| Level | Name | XP Range | Unlocks |
|-------|------|----------|---------|
| 0 | Newbie | 0-500 | View only, manual review for posts |
| 1 | Member | 500-1000 | Create threads/replies |
| 2 | Contributor | 1000-2000 | Upload files |
| 3 | Regular | 2000-5000 | Post external links, start bounties |
| 4 | Leader | 5000+ | Edit others' posts, nominate moderators |

**XP Earning:**
- Create thread: +50 XP
- Reply to thread: +10 XP
- Accepted answer: +100 XP
- Helpful vote received: +5 XP
- Publish EA/content: +200 XP
- Daily active: +20 XP

**Display:**
- Badge next to username everywhere
- Progress bar in profile: "1,250 / 2,000 XP to Regular"

---

### 5.2 Leaderboards

**3 Tabs:**
1. **Top by Coins:** Users with most total coins earned
2. **Top Contributors:** Users with most threads + replies
3. **Top Sellers:** Users with most content uploads + sales

**Rank Badges:**
- #1: 👑 Gold Crown
- #2: 🥈 Silver Medal
- #3: 🥉 Bronze Medal
- #4-10: 🏆 Trophy (outline)

**Real-time Polling:** 30s refetch interval
**Server-side Cache:** 2 minutes TTL

**Top Stats Cards:**
```
┌───────────────┬───────────────┬───────────────┐
│ Top Earner    │ Top Contrib   │ Top Seller    │
│ 🏆 125,450    │ 🏆 2,340      │ 🏆 $152,300   │
│ Want to rank? │ posts         │ revenue       │
└───────────────┴───────────────┴───────────────┘
```

---

### 5.3 Badges & Achievements

**Badge Types:**
- ✅ **Verified Trader:** Linked Myfxbook account
- 🌟 **Top Contributor:** Monthly award (most helpful votes)
- 💎 **EA Master:** 50+ EA uploads
- 👍 **Helpful:** 100+ helpful votes received
- 🚀 **Early Adopter:** First 100 users
- 🐛 **Bug Hunter:** Reported bugs that got fixed

**Display:**
- In user profile (badge wall)
- Next to username in threads
- In leaderboard with icons

**One-Time Rewards:**
- YouTube link: +50 coins
- Myfxbook link: +100 coins
- Investor credentials: +75 coins

---

### 5.4 Onboarding Checklist

**Non-blocking widget in right sidebar:**

```
┌────────────────────────────┐
│ Get Started (4/5 complete) │
├────────────────────────────┤
│ ✅ Create profile (+10)    │
│ ✅ First reply (+15)       │
│ ✅ First report (+20)      │
│ ✅ First upload (+50)      │
│ ⬜ Link social (+30)       │
├────────────────────────────┤
│ [Dismiss] [Complete Now]   │
└────────────────────────────┘
```

**Progress Tracking:**
- Persisted in user profile
- Dismissed state saved to localStorage
- Reappears on next login if incomplete

---

## 🏢 Phase 6: Broker Directory & Scam Watch (Week 6)

### Priority: MEDIUM - Trust Building

### 6.1 Broker Listings

**Broker Schema:**
```ts
{
  id: string,
  name: string,
  slug: string,
  websiteUrl: string,
  logoUrl: string,
  yearFounded: number,
  regulationSummary: string,
  overallRating: number,      // calculated average
  reviewCount: number,
  scamReportCount: number,
  isVerified: boolean          // admin only
}
```

**List Page (`/brokers`):**
- Filters:
  - ✅ Verified only
  - ⭐ Rating (5★ / 4★ / 3★+)
  - 📅 Founded year
  - 🚨 Show scam reports only
- Sort: Rating, Reviews, Newest

**Detail Page (`/brokers/:slug`):**
- Header: Logo, name, overall rating (stars)
- Stats: Review count, rating breakdown (5★: 45%, 4★: 30%, etc.)
- Tabs:
  - All Reviews
  - Scam Reports Only

---

### 6.2 Review & Scam Reporting

**Review Form:**
- Star rating (1-5)
- Title (50-150 chars)
- Body (100-2,000 chars)
- ☐ "This is a scam report" checkbox

**If Scam Report:**
- Require proof (screenshots, links)
- Higher coin reward: +150 (vs +50 for normal review)
- Red badge on review
- Increments `scamReportCount` on broker

**Verification Tiers:**
- Reviewers disclose:
  - Account type (demo / live)
  - Months traded with broker
- **Verified reviewers** (linked account) get badge

**Moderation:**
- All reviews pending approval
- Scam reports escalated to admin with evidence review
- False reports → user ban

---

### 6.3 Safe-Harbor & Takedown

**TOS Provisions:**
- User content not endorsed by YoForex
- Rapid moderation escalation for broker complaints
- 24-hour response SLA for takedown requests

**Takedown Procedure:**
1. Broker submits takedown form
2. Admin reviews evidence
3. If defamatory → remove review, notify user
4. If legitimate → keep review, notify broker
5. Appeal process available

---

## ⚡ Phase 7: Real-Time, SSR & Performance (Week 7)

### Priority: LOW - Optimization

### 7.1 WebSockets for Real-Time

**Migrate from polling to WebSockets/SSE:**
- Thread replies (live updates)
- Coin balance (instant credit)
- Leaderboards (live rank changes)
- Notification badge (real-time alerts)

**Fallback:** 10-30s polling where sockets unavailable

**Server:** Socket.io or native WebSocket with Redis pub/sub for multi-instance scaling

---

### 7.2 SSR/SSG for SEO

**Pre-render critical pages:**
- Homepage
- Category pages
- Popular thread pages
- Broker directory

**Benefits:**
- Faster Time to First Byte (TTFB)
- Better SEO (crawlers see full HTML)
- Improved Core Web Vitals

**Tech Stack:** Vite SSR or Next.js migration

---

## 📋 Summary: Task Prioritization

### Week 1 (HIGH Priority)
- ✅ Design Fix: Category Cards
- ✅ Design Fix: What's Hot
- ✅ Header: "Release EA" Dropdown

### Week 2-3 (HIGH Priority)
- ✅ Create `/publish` page with structured form
- ✅ File upload pipeline (drag-drop, security, checksum)
- ✅ Image upload & gallery
- ✅ Invisible SEO engine
- ✅ EABOOK-style post detail page
- ✅ Help articles & inline links

### Week 3-4 (HIGH Priority)
- ✅ Database migration to PostgreSQL
- ✅ Double-entry coin ledger
- ✅ Stripe integration (recharge)
- ✅ USDT integration (CoinPayments)
- ✅ Coin earning hooks
- ✅ Atomic purchase flow

### Week 4-5 (MEDIUM Priority)
- ✅ Thread creation & management
- ✅ Nested replies (unlimited depth)
- ✅ Duplicate detection
- ✅ Moderation queue

### Week 5-6 (MEDIUM Priority)
- ✅ Trust level system (5 levels)
- ✅ Leaderboards (3 tabs)
- ✅ Badges & achievements
- ✅ Onboarding checklist
- ✅ Broker directory
- ✅ Scam reporting

### Week 7 (LOW Priority)
- ✅ WebSockets for real-time
- ✅ SSR/SSG optimization

---

## 🎯 Success Metrics

**User Engagement:**
- Daily Active Users (DAU)
- Average session duration
- Threads created per day
- Replies per thread

**Monetization:**
- Coin purchases (USD revenue)
- Content sales (transactions)
- Average purchase size
- Churn rate

**Quality:**
- Scam reports verified/rejected ratio
- Helpful vote ratio
- Accepted answer rate
- Broker review authenticity score

---

## 🚀 Next Steps

1. **Start with Phase 1 design fixes** (immediate visual impact)
2. **Build Phase 2 publishing flow** (core feature request)
3. **Implement Phase 3 payments** (monetization)
4. **Gradually add Phases 4-7** (community features)

**This plan ensures we deliver high-value features incrementally while maintaining a stable, production-ready platform.**
