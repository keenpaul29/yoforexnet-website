# Design Guidelines: EA Marketplace & Community Platform

## Design Approach

**Selected Approach:** Design System (Carbon Design + Material Design hybrid)

**Justification:** This platform is information-dense, data-driven, and utility-focused. Users need to quickly evaluate EA performance, browse technical specifications, and engage in detailed forum discussions. The design must prioritize data clarity, scanability, and professional credibility over visual flair.

**Reference Influences:**
- Carbon Design System for data-heavy enterprise patterns
- TradingView for clean performance visualization
- Stack Exchange for forum hierarchy and reputation systems
- Material Design for component richness and feedback

**Core Design Principles:**
1. Data clarity trumps decoration
2. Trust signals prominently displayed (verified badges, ratings, performance metrics)
3. Information density without cognitive overload
4. Professional credibility through restrained, purposeful design
5. Quick filtering and comparison workflows

---

## Typography

**Font Stack:**
- Primary: Inter (Google Fonts) - excellent for data tables and UI
- Monospace: JetBrains Mono - for code snippets, EA parameters, technical specs

**Type Scale:**
- Hero/Display: text-5xl (48px) font-bold
- Page Titles: text-3xl (30px) font-semibold
- Section Headers: text-2xl (24px) font-semibold
- Subsection Headers: text-xl (20px) font-medium
- Body Text: text-base (16px) font-normal
- Small/Meta: text-sm (14px) font-normal
- Tiny/Labels: text-xs (12px) font-medium uppercase tracking-wide

**Hierarchy Rules:**
- Use font-weight variation (400, 500, 600, 700) for hierarchy over size changes
- Data labels: text-xs uppercase with increased letter-spacing
- Performance metrics: text-2xl font-bold for primary numbers, text-sm for labels
- Forum post hierarchy: Original post larger (text-base), replies slightly smaller (text-sm)

---

## Layout System

**Spacing Primitives:** Use Tailwind units: **2, 4, 6, 8, 12, 16, 24**

**Application:**
- Component padding: p-4 (cards), p-6 (modals), p-8 (sections)
- Stack spacing: space-y-4 (tight), space-y-6 (comfortable), space-y-8 (sections)
- Grid gaps: gap-4 (cards grid), gap-6 (feature sections)
- Section padding: py-12 (mobile), py-16 (tablet), py-24 (desktop)

**Container Strategy:**
- Global max-width: max-w-7xl mx-auto
- Content max-width: max-w-4xl (forum threads, EA descriptions)
- Data tables: Full width within section container

**Grid Patterns:**
- EA Listing Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Performance Metrics: grid-cols-2 md:grid-cols-4 gap-4
- Forum Categories: grid-cols-1 md:grid-cols-2 gap-6
- User Dashboard: Two-column layout (sidebar + main) with 1/4 - 3/4 split

---

## Component Library

### Navigation
**Primary Header:**
- Fixed top navigation with backdrop-blur
- Logo left, primary nav center, user menu + search right
- Mobile: Hamburger menu, full-screen overlay navigation
- Breadcrumbs below header on detail pages

**Secondary Navigation:**
- Vertical sidebar for filtering (EA listings, forum categories)
- Sticky positioning with max-height and scroll
- Tab navigation for profile sections, EA detail sections

### Core UI Elements

**Buttons:**
- Primary: Solid fill, font-medium, px-6 py-3 rounded-lg
- Secondary: Border outline, px-6 py-3 rounded-lg
- Ghost: No border, hover state with subtle background
- Icon buttons: Square, p-2, rounded-md
- Button groups for filtering with active state highlighting

**Cards:**
- EA Card: Image thumbnail (16:9), title, rating stars, platform badge, key metrics (price, downloads), hover lift effect
- Forum Thread Card: Title, author avatar, reply count, view count, last activity timestamp, answered badge
- Review Card: User avatar, star rating, date, review text, helpful votes
- Performance Card: Metric label, large number, trend indicator (up/down arrow), sparkline graph

**Forms:**
- Input fields: border, rounded-lg, px-4 py-3, focus ring
- Dropdowns: Custom styled select with chevron icon
- Multi-step upload: Progress indicator, step labels, next/previous navigation
- Search bar: Prominent with search icon, autocomplete dropdown, filter pills

**Data Display:**
- Performance Tables: Striped rows, fixed header, sortable columns, monospace numbers
- Metric Panels: Grid of stat cards with labels, values, and change indicators
- Rating Component: 5-star display with half-star support, count in parentheses
- Badges: Rounded-full for status (verified, premium), rounded-md for tags (MT4, MT5, Scalping)

### Forum Components
- Thread List: Card-based with avatar, title, excerpt, metadata row
- Reply Component: Nested indentation (max 3 levels), reply button, vote buttons
- User Reputation: Badge with number, color-coded tiers
- Code Blocks: Monospace font, syntax highlighting, copy button

### Specialized Components
- **Performance Chart Widget:** Clean line charts showing equity curves, drawdown, win rate over time
- **EA Comparison Table:** Side-by-side specs with highlighting for differences
- **Upload Progress:** Multi-step wizard with file dropzone, metadata form, preview, confirmation
- **Admin Moderation Panel:** Action buttons, status filters, batch operations, audit log

### Overlays
- Modals: max-w-2xl, backdrop blur, close button top-right, footer with actions
- Toast Notifications: Top-right, auto-dismiss, success/error/info states
- Tooltips: Small, dark, appear on hover for help text and metric explanations
- Dropdown Menus: Clean, shadow, rounded-lg, appear below trigger

---

## Images

**Hero Section:**
- Large hero image (1920x800px) showing trading charts, monitors, or abstract financial graphics
- Overlay with gradient for text readability
- Hero CTA buttons with blurred/frosted glass backgrounds

**EA Listing Images:**
- EA thumbnail/icon (400x400px square) for each listing
- Performance chart screenshots (16:9 aspect ratio)
- Strategy visualization diagrams

**Forum & Profile:**
- User avatars (circular, 40px default, 80px on profiles)
- No hero images on forum/profile pages - prioritize content density

**Performance Pages:**
- Embedded chart images (equity curve, drawdown graph)
- Screenshot galleries for EA setup and results
- Before/after comparison images for strategies

**Image Treatment:**
- Use aspect-ratio utilities for consistent proportions
- Lazy loading for all images below fold
- Placeholder shimmer effect during load
- High-quality compression (WebP format preferred)

---

## Animations

**Minimal Animation Philosophy:**
- Page transitions: None - instant navigation for data-focused app
- Card hover: Subtle lift (translateY(-4px)) + shadow increase
- Button hover: Slight scale (scale-105) on secondary buttons only
- Loading states: Simple spinner or skeleton screens
- Toast notifications: Slide in from top-right
- **No scroll-triggered animations** - maintain focus on data consumption