# YoForex Platform Testing & Review Plan
**Created**: October 26, 2025 6:05 PM  
**Status**: In Progress

## Testing Objective
Systematically review the entire YoForex platform to:
1. Verify all 23 pages load correctly
2. Test all 60+ API endpoints
3. Check all interactive features
4. Identify missing features or broken functionality
5. Document and fix all issues

---

## 1. Page-by-Page Testing Checklist

### Authentication & User Pages
- [ ] `/` - Home page with StatsBar, WhatsHot, Leaderboard, WeekHighlights
  - [ ] StatsBar displays correct data (15 threads, 1 member, 141 replies, +4 active)
  - [ ] Auto-refresh works (30s intervals)
  - [ ] WhatsHot displays trending threads
  - [ ] Leaderboard shows top users
  - [ ] Week Highlights shows new/trending/solved tabs
- [ ] `/dashboard` - Personal dashboard
  - [ ] Shows user stats
  - [ ] Onboarding widget appears for new users
  - [ ] Activity feed displays
- [ ] `/dashboard/customize` - Dashboard customization ✅
  - [ ] Widget toggles work
  - [ ] Reorder buttons function
  - [ ] Preview updates in real-time
  - [ ] Layout selection works
  - [ ] Save/Reset buttons (UI only - backend pending)
- [ ] `/settings` - User settings
  - [ ] Profile editing works
  - [ ] Social links update
  - [ ] Email preferences save
- [ ] `/user/:username` - User profile
  - [ ] Displays user info
  - [ ] Shows published content
  - [ ] Follow/unfollow button works
  - [ ] Badge display

### Forum Pages
- [ ] `/categories` - Category grid
  - [ ] All 15 categories display
  - [ ] Thread counts correct
  - [ ] Category cards clickable
- [ ] `/category/:slug` - Category discussion list
  - [ ] Threads load for category
  - [ ] Filtering works
  - [ ] Sorting options function
- [ ] `/discussions` - All discussions
  - [ ] Shows all threads
  - [ ] Search functionality
  - [ ] Pagination works
- [ ] `/thread/:slug` - Thread detail
  - [ ] Thread content displays
  - [ ] Nested replies render
  - [ ] Reply form works
  - [ ] Accept answer button (for author)
  - [ ] Helpful vote button
  - [ ] View count increments

### Marketplace Pages
- [ ] `/marketplace` - Browse content
  - [ ] All content types display
  - [ ] Filter by type works
  - [ ] Sort options function
  - [ ] Price display correct
- [ ] `/content/:slug` - Content detail
  - [ ] Content info displays
  - [ ] Purchase button works
  - [ ] Review submission
  - [ ] Like functionality
  - [ ] Q&A replies
- [ ] `/publish` - Publish content
  - [ ] Multi-step form works
  - [ ] File upload functional
  - [ ] Image upload works
  - [ ] Validation triggers
  - [ ] Success redirect

### Coin System Pages
- [ ] `/recharge` - Purchase coins
  - [ ] Stripe integration loads
  - [ ] Package selection works
  - [ ] Payment flow functional
- [ ] `/earn-coins` - Earning opportunities
  - [ ] Displays earning methods
  - [ ] Daily check-in button
  - [ ] Coin amounts correct
- [ ] `/transactions` - Transaction history
  - [ ] Lists all transactions
  - [ ] Filtering works
  - [ ] Displays correct amounts

### Broker Pages
- [ ] `/brokers` - Broker directory
  - [ ] Broker list displays
  - [ ] Filter by regulation
  - [ ] Search works
  - [ ] Ratings visible
- [ ] `/brokers/:slug` - Broker profile
  - [ ] Company info displays
  - [ ] Reviews load
  - [ ] Scam reports visible
  - [ ] Admin verification badge
- [ ] `/brokers/submit-review` - Submit review
  - [ ] Form validation
  - [ ] Star rating works
  - [ ] Scam flag option
  - [ ] Submission success

### Social Pages
- [ ] `/messages` - Private messaging
  - [ ] Conversation list
  - [ ] Message sending
  - [ ] Read status updates
  - [ ] Real-time updates
- [ ] `/members` - Member directory
  - [ ] User list displays
  - [ ] Search functionality
  - [ ] Follow buttons work
  - [ ] Profile links functional
- [ ] `/leaderboard` - Top contributors
  - [ ] Categories display
  - [ ] Rankings correct
  - [ ] Auto-refresh works (30s)
  - [ ] User profiles linked

---

## 2. API Endpoint Testing

### Authentication APIs
- [ ] `GET /api/me` - Returns current user or 401
- [ ] `GET /api/login` - Redirects to Replit OIDC
- [ ] `GET /api/callback` - Handles OIDC callback
- [ ] `POST /api/logout` - Destroys session

### Coin System APIs
- [ ] `GET /api/user/:userId/coins` - Returns coin balance
- [ ] `GET /api/user/:userId/transactions` - Returns transaction history
- [ ] `POST /api/transactions` - Creates coin transaction
- [ ] `POST /api/recharge` - Creates recharge order
- [ ] `GET /api/recharge/:orderId` - Returns order status
- [ ] `POST /api/daily-checkin` - Awards daily bonus

### Marketplace APIs
- [ ] `POST /api/content` - Publishes content (auth required)
- [ ] `GET /api/content` - Lists content with filters
- [ ] `GET /api/content/:id` - Gets content by ID
- [ ] `GET /api/content/slug/:slug` - Gets content by slug
- [ ] `POST /api/content/purchase` - Purchases content with coins
- [ ] `POST /api/content/review` - Submits review
- [ ] `GET /api/content/:contentId/reviews` - Gets reviews
- [ ] `POST /api/content/like` - Likes content
- [ ] `POST /api/content/reply` - Replies to content

### Forum Thread APIs
- [ ] `POST /api/threads` - Creates thread (auth required)
- [ ] `GET /api/threads` - Lists threads with filters
- [ ] `GET /api/threads/:id` - Gets thread by ID
- [ ] `GET /api/threads/slug/:slug` - Gets thread by slug
- [ ] ⚠️ `GET /api/threads/hot` - Returns 404 (ISSUE)
- [ ] `GET /api/threads/highlights` - Returns week highlights

### Forum Reply APIs
- [ ] `POST /api/threads/:threadId/replies` - Creates reply
- [ ] `GET /api/threads/:threadId/replies` - Gets thread replies
- [ ] `POST /api/replies/:replyId/accept` - Marks as accepted
- [ ] `POST /api/replies/:replyId/helpful` - Marks as helpful

### Category APIs
- [ ] `GET /api/categories` - Lists all categories
- [ ] `GET /api/categories/:slug` - Gets category by slug
- [ ] `GET /api/categories/:slug/threads` - Gets category threads
- [ ] `GET /api/publish/categories` - Gets publishing dropdown

### Social APIs
- [ ] `POST /api/users/:userId/follow` - Follows user
- [ ] `DELETE /api/users/:userId/unfollow` - Unfollows user
- [ ] `GET /api/users/:userId/followers` - Gets followers
- [ ] `GET /api/users/:userId/following` - Gets following list
- [ ] `POST /api/messages` - Sends message
- [ ] `GET /api/conversations` - Lists conversations
- [ ] `POST /api/messages/:messageId/read` - Marks as read

### Stats & Leaderboard APIs (NEW)
- [ ] `GET /api/stats` - Returns global statistics ✅ (Fixed field names)
- [ ] `GET /api/leaderboard` - Returns top users
- [ ] `GET /api/content/top-sellers` - Returns best-selling content

### Badge & Onboarding APIs
- [ ] `GET /api/users/:userId/badges` - Gets user badges
- [ ] `POST /api/me/check-badges` - Awards new badges
- [ ] `GET /api/me/onboarding` - Gets onboarding progress
- [ ] `POST /api/me/onboarding/dismiss` - Dismisses onboarding

### Broker APIs
- [ ] `POST /api/brokers` - Creates broker
- [ ] `GET /api/brokers` - Lists brokers
- [ ] `GET /api/brokers/:id` - Gets broker by ID
- [ ] `GET /api/brokers/slug/:slug` - Gets broker by slug
- [ ] `POST /api/brokers/review` - Submits review
- [ ] `GET /api/brokers/:brokerId/reviews` - Gets reviews
- [ ] `POST /api/admin/verify-scam-report/:reviewId` - Verifies scam

### Search APIs
- [ ] `GET /api/search` - Global search (threads, content, users)

---

## 3. Real-Time Features Testing

### Auto-Refresh Components
- [ ] StatsBar - 30s interval
  - [ ] Data updates automatically
  - [ ] No manual refresh needed
  - [ ] Timestamp displays
- [ ] Leaderboard - 30s interval
  - [ ] Rankings update
  - [ ] User data refreshes
- [ ] WhatsHot - 30s interval
  - [ ] Trending threads change
  - [ ] Engagement scores update
- [ ] WeekHighlights - 30s interval
  - [ ] New threads appear
  - [ ] Solved status updates
- [ ] TopSellers - 60s interval
  - [ ] Sales rankings update
  - [ ] Purchase counts change
- [ ] ActivityFeed - 10s interval (fastest)
  - [ ] Live activity updates
  - [ ] Recent actions display

### Background Jobs
- [ ] Thread score updates - Every 60 minutes
  - [ ] engagement_score field updates
  - [ ] Logs show successful updates
- [ ] User reputation updates - Every 5 minutes
  - [ ] reputation_score field updates
  - [ ] ⚠️ SQL error needs fixing
- [ ] Top seller score updates - Every 15 minutes
  - [ ] sales_score field updates
  - [ ] Logs show successful updates

---

## 4. Known Issues List

### Critical Issues
1. **GET /api/threads/hot returns 404**
   - Status: Needs investigation
   - Impact: WhatsHot widget not showing data
   - Priority: HIGH
   
2. **getUserStats SQL syntax error**
   - Status: Error at or near "="
   - Impact: User reputation calculation failing
   - Priority: HIGH
   - Location: `server/storage.ts:3222`

3. **Dashboard preferences backend not implemented**
   - Status: UI complete, no backend
   - Impact: Settings don't persist
   - Priority: MEDIUM

### Minor Issues
1. **Field name inconsistency fixed**
   - ✅ Fixed: StatsBar now uses correct field names
   - Was showing zeros, now displays correctly

---

## 5. Missing Features to Implement

### Immediate Priority
- [ ] Fix GET /api/threads/hot endpoint
- [ ] Fix getUserStats SQL query
- [ ] Implement dashboard preferences backend
  - [ ] Save user widget preferences
  - [ ] Load preferences on dashboard
  - [ ] Persist layout choices

### Medium Priority
- [ ] Add real-time notifications
- [ ] Implement WebSocket for live updates
- [ ] Create admin moderation panel
- [ ] Add advanced search filters
- [ ] Build analytics dashboard

### Low Priority
- [ ] Crypto payment integration
- [ ] Mobile PWA version
- [ ] Email notification system
- [ ] Export/import user data

---

## 6. Performance Testing

### Database Query Performance
- [ ] Check query execution times
- [ ] Verify indexes are being used
- [ ] Monitor N+1 query issues
- [ ] Test with large datasets

### Frontend Performance
- [ ] Page load times < 2s
- [ ] Time to interactive < 3s
- [ ] Auto-refresh doesn't cause lag
- [ ] Image lazy loading works
- [ ] Bundle size optimization

### API Performance
- [ ] Response times < 200ms
- [ ] Rate limiting working
- [ ] Concurrent request handling
- [ ] Error rate monitoring

---

## 7. Security Testing

### Input Validation
- [ ] XSS protection on all inputs
- [ ] SQL injection prevention
- [ ] File upload validation
- [ ] CSRF protection

### Authentication
- [ ] Session expiry works (7 days)
- [ ] Logout destroys session
- [ ] Protected routes enforce auth
- [ ] OIDC flow secure

### Authorization
- [ ] Users can only edit own content
- [ ] Admin-only features protected
- [ ] Coin spending validated
- [ ] Purchase verification

---

## 8. Next Steps

1. **Fix Critical Issues** (Today)
   - Debug and fix /api/threads/hot
   - Fix getUserStats SQL query
   - Test fixes thoroughly

2. **Complete Testing** (Tomorrow)
   - Click through all 23 pages
   - Test all interactive features
   - Document any new issues

3. **Implement Missing Backend** (This Week)
   - Dashboard preferences persistence
   - Notification system foundation
   - Admin panel basics

4. **Documentation Update** (Ongoing)
   - Keep all .md files current
   - Update API docs with fixes
   - Maintain feature list

---

## Testing Log

### October 26, 2025 6:00 PM
- ✅ Discovered StatsBar showing zeros
- ✅ Fixed field name mismatch
- ✅ Verified auto-refresh working
- ⚠️ Found /api/threads/hot returning 404
- ⚠️ Found getUserStats SQL error

### [Next Testing Session]
- [ ] To be filled in...

---

**Note**: This is a living document. Update after each testing session.
