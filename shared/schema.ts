import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, index, jsonb, json, check, uniqueIndex, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - REQUIRED for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  }),
);

// User storage table - Merged Replit Auth + YoForex fields
export const users = pgTable("users", {
  // Core identity field (NEVER change this type - breaking change)
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Legacy fields (kept for backward compatibility, will be deprecated)
  username: text("username").notNull().unique(),
  password: text("password"), // Now optional - Replit Auth handles authentication
  
  // Replit Auth fields (added for OIDC integration)
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  
  // YoForex-specific fields (preserved from original)
  totalCoins: integer("total_coins").notNull().default(0),
  weeklyEarned: integer("weekly_earned").notNull().default(0),
  rank: integer("rank"),
  youtubeUrl: text("youtube_url"),
  instagramHandle: text("instagram_handle"),
  telegramHandle: text("telegram_handle"),
  myfxbookLink: text("myfxbook_link"),
  investorId: text("investor_id"),
  investorPassword: text("investor_password"),
  isVerifiedTrader: boolean("is_verified_trader").notNull().default(false),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  hasYoutubeReward: boolean("has_youtube_reward").notNull().default(false),
  hasMyfxbookReward: boolean("has_myfxbook_reward").notNull().default(false),
  hasInvestorReward: boolean("has_investor_reward").notNull().default(false),
  
  // Badges & Achievements
  badges: text("badges").array().default(sql`'{}'::text[]`),
  
  // Onboarding System
  onboardingCompleted: boolean("onboarding_completed").default(false),
  onboardingDismissed: boolean("onboarding_dismissed").default(false),
  onboardingProgress: json("onboarding_progress").default({
    profileCreated: false,
    firstReply: false,
    firstReport: false,
    firstUpload: false,
    socialLinked: false,
  }),
  
  // Ranking system
  reputationScore: integer("reputation_score").notNull().default(0),
  lastReputationUpdate: timestamp("last_reputation_update"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  usernameIdx: index("idx_users_username").on(table.username),
  emailIdx: index("idx_users_email").on(table.email),
  reputationIdx: index("idx_users_reputation").on(table.reputationScore),
  coinsCheck: check("chk_user_coins_nonnegative", sql`${table.totalCoins} >= 0`),
}));

export const coinTransactions = pgTable("coin_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull().$type<"earn" | "spend" | "recharge">(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().$type<"completed" | "pending" | "failed">().default("completed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_coin_transactions_user_id").on(table.userId),
}));

export const rechargeOrders = pgTable("recharge_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  coinAmount: integer("coin_amount").notNull(),
  priceUsd: integer("price_usd").notNull(),
  paymentMethod: text("payment_method").notNull().$type<"stripe" | "crypto">(),
  paymentId: text("payment_id"),
  status: text("status").notNull().$type<"pending" | "completed" | "failed">().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  userIdIdx: index("idx_recharge_orders_user_id").on(table.userId),
}));

export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  cryptoType: text("crypto_type").notNull().$type<"BTC" | "ETH">(),
  walletAddress: text("wallet_address").notNull(),
  status: text("status").notNull().$type<"pending" | "processing" | "completed" | "failed" | "cancelled">().default("pending"),
  exchangeRate: numeric("exchange_rate", { precision: 20, scale: 8 }).notNull(),
  cryptoAmount: numeric("crypto_amount", { precision: 20, scale: 8 }).notNull(),
  processingFee: integer("processing_fee").notNull(),
  transactionHash: text("transaction_hash"),
  adminNotes: text("admin_notes"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_withdrawal_requests_user_id").on(table.userId),
  statusIdx: index("idx_withdrawal_requests_status").on(table.status),
  amountCheck: check("chk_withdrawal_amount_min", sql`${table.amount} >= 1000`),
}));

export const content = pgTable("content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => users.id),
  type: text("type").notNull().$type<"ea" | "indicator" | "article" | "source_code">(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priceCoins: integer("price_coins").notNull().default(0),
  isFree: boolean("is_free").notNull().default(true),
  category: text("category").notNull(),
  
  // Publishing flow fields
  platform: text("platform").$type<"MT4" | "MT5" | "Both">(),
  version: text("version"),
  tags: text("tags").array(),
  files: jsonb("files").$type<Array<{name: string; size: number; url: string; checksum: string}>>(),
  images: jsonb("images").$type<Array<{url: string; isCover: boolean; order: number}>>(),
  
  // Optional fields
  brokerCompat: text("broker_compat").array(),
  minDeposit: integer("min_deposit"),
  hedging: boolean("hedging"),
  changelog: text("changelog"),
  license: text("license"),
  
  // Evidence fields (for Performance Reports)
  equityCurveImage: text("equity_curve_image"),
  profitFactor: integer("profit_factor"),
  drawdownPercent: integer("drawdown_percent"),
  winPercent: integer("win_percent"),
  broker: text("broker"),
  monthsTested: integer("months_tested"),
  
  // Legacy fields
  fileUrl: text("file_url"),
  imageUrl: text("image_url"),
  imageUrls: text("image_urls").array(),
  postLogoUrl: text("post_logo_url"),
  views: integer("views").notNull().default(0),
  downloads: integer("downloads").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  averageRating: integer("average_rating"),
  reviewCount: integer("review_count").notNull().default(0),
  status: text("status").notNull().$type<"pending" | "approved" | "rejected">().default("pending"),
  slug: text("slug").notNull().unique(),
  focusKeyword: text("focus_keyword"),
  autoMetaDescription: text("auto_meta_description"),
  autoImageAltTexts: text("auto_image_alt_texts").array(),
  
  // Ranking system
  salesScore: integer("sales_score").notNull().default(0),
  lastSalesUpdate: timestamp("last_sales_update"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  authorIdIdx: index("idx_content_author_id").on(table.authorId),
  statusIdx: index("idx_content_status").on(table.status),
  categoryIdx: index("idx_content_category").on(table.category),
  slugIdx: index("idx_content_slug").on(table.slug),
  salesScoreIdx: index("idx_content_sales_score").on(table.salesScore),
}));

export const contentPurchases = pgTable("content_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull().references(() => content.id),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  priceCoins: integer("price_coins").notNull(),
  transactionId: varchar("transaction_id").notNull().references(() => coinTransactions.id),
  purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
}, (table) => ({
  buyerIdIdx: index("idx_content_purchases_user_id").on(table.buyerId),
  contentIdIdx: index("idx_content_purchases_content_id").on(table.contentId),
}));

export const contentReviews = pgTable("content_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull().references(() => content.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  review: text("review").notNull(),
  status: text("status").notNull().$type<"pending" | "approved" | "rejected">().default("pending"),
  rewardGiven: boolean("reward_given").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contentLikes = pgTable("content_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull().references(() => content.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_content_likes_user_id").on(table.userId),
}));

export const contentReplies = pgTable("content_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull().references(() => content.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  parentId: varchar("parent_id").references((): any => contentReplies.id),
  body: text("body").notNull(),
  rating: integer("rating"),
  imageUrls: text("image_urls").array(),
  helpful: integer("helpful").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const brokers = pgTable("brokers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  websiteUrl: text("website_url"),
  logoUrl: text("logo_url"),
  yearFounded: integer("year_founded"),
  regulation: text("regulation"),
  regulationSummary: text("regulation_summary"),
  platform: text("platform"),
  spreadType: text("spread_type"),
  minSpread: numeric("min_spread", { precision: 10, scale: 2 }),
  overallRating: integer("overall_rating").default(0),
  reviewCount: integer("review_count").notNull().default(0),
  scamReportCount: integer("scam_report_count").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  status: text("status").notNull().$type<"pending" | "approved" | "rejected">().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  slugIdx: index("idx_brokers_slug").on(table.slug),
  statusIdx: index("idx_brokers_status").on(table.status),
  regulationIdx: index("idx_brokers_regulation").on(table.regulation),
  platformIdx: index("idx_brokers_platform").on(table.platform),
}));

export const brokerReviews = pgTable("broker_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brokerId: varchar("broker_id").notNull().references(() => brokers.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  reviewTitle: text("review_title").notNull(),
  reviewBody: text("review_body").notNull(),
  isScamReport: boolean("is_scam_report").notNull().default(false),
  status: text("status").notNull().$type<"pending" | "approved" | "rejected">().default("pending"),
  datePosted: timestamp("date_posted").notNull().defaultNow(),
}, (table) => ({
  brokerIdIdx: index("idx_broker_reviews_broker_id").on(table.brokerId),
}));

export const userFollows = pgTable("user_follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id),
  followingId: varchar("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  followerIdIdx: index("idx_user_follows_follower_id").on(table.followerId),
}));

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participant1Id: varchar("participant1_id").notNull().references(() => users.id),
  participant2Id: varchar("participant2_id").notNull().references(() => users.id),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  recipientId: varchar("recipient_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  conversationIdIdx: index("idx_messages_conversation_id").on(table.conversationId),
  senderIdIdx: index("idx_messages_sender_id").on(table.senderId),
  recipientIdIdx: index("idx_messages_recipient_id").on(table.recipientId),
  createdAtIdx: index("idx_messages_created_at").on(table.createdAt),
  isReadIdx: index("idx_messages_is_read").on(table.isRead),
}));

// Message Reactions
export const messageReactions = pgTable("message_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emoji: varchar("emoji", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  messageUserIdx: index("message_reactions_msg_user_idx").on(table.messageId, table.userId),
}));

// Notifications system
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull().$type<"reply" | "like" | "follow" | "purchase" | "badge" | "system">(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  actionUrl: text("action_url"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_notifications_user_id").on(table.userId),
  isReadIdx: index("idx_notifications_is_read").on(table.isRead),
  createdAtIdx: index("idx_notifications_created_at").on(table.createdAt),
}));

// Forum Threads (separate from marketplace content)
export const forumThreads = pgTable("forum_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => users.id),
  categorySlug: text("category_slug").notNull(),
  subcategorySlug: text("subcategory_slug"), // Sub-category if applicable
  title: text("title").notNull(),
  body: text("body").notNull(),
  slug: text("slug").notNull().unique(),
  focusKeyword: text("focus_keyword"),
  metaDescription: text("meta_description"),
  
  // Enhanced SEO & Thread Type
  threadType: text("thread_type").notNull().$type<"question" | "discussion" | "review" | "journal" | "guide">().default("discussion"),
  seoExcerpt: text("seo_excerpt"), // 120-160 chars, optional
  primaryKeyword: text("primary_keyword"), // 1-6 words, optional
  language: text("language").notNull().default("en"),
  
  // Trading Metadata (stored as arrays for multi-select)
  instruments: text("instruments").array().default(sql`'{}'::text[]`), // XAUUSD, EURUSD, etc.
  timeframes: text("timeframes").array().default(sql`'{}'::text[]`), // M1, M5, H1, etc.
  strategies: text("strategies").array().default(sql`'{}'::text[]`), // scalping, swing, etc.
  platform: text("platform"), // MT4, MT5, cTrader, TradingView, Other
  broker: text("broker"), // Free text broker name
  riskNote: text("risk_note"), // Optional risk management note
  hashtags: text("hashtags").array().default(sql`'{}'::text[]`), // Social hashtags
  
  // Review-specific fields (only for threadType=review)
  reviewTarget: text("review_target"), // EA/Indicator/Broker name
  reviewVersion: text("review_version"),
  reviewRating: integer("review_rating"), // 1-5 stars
  reviewPros: text("review_pros").array(),
  reviewCons: text("review_cons").array(),
  
  // Question-specific fields (only for threadType=question)
  questionSummary: text("question_summary"), // "What do you want solved?"
  acceptedAnswerId: varchar("accepted_answer_id"), // Reference to accepted reply
  
  // Attachments
  attachmentUrls: text("attachment_urls").array().default(sql`'{}'::text[]`),
  
  // Status & Moderation
  isPinned: boolean("is_pinned").notNull().default(false),
  isLocked: boolean("is_locked").notNull().default(false),
  isSolved: boolean("is_solved").notNull().default(false),
  views: integer("views").notNull().default(0),
  replyCount: integer("reply_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  bookmarkCount: integer("bookmark_count").notNull().default(0),
  shareCount: integer("share_count").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
  status: text("status").notNull().$type<"pending" | "approved" | "rejected">().default("approved"),
  
  // Ranking system
  engagementScore: integer("engagement_score").notNull().default(0),
  lastScoreUpdate: timestamp("last_score_update"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  categorySlugIdx: index("idx_forum_threads_category").on(table.categorySlug),
  subcategorySlugIdx: index("idx_forum_threads_subcategory").on(table.subcategorySlug),
  threadTypeIdx: index("idx_forum_threads_type").on(table.threadType),
  statusIdx: index("idx_forum_threads_status").on(table.status),
  isPinnedIdx: index("idx_forum_threads_pinned").on(table.isPinned),
  engagementScoreIdx: index("idx_forum_threads_engagement").on(table.engagementScore),
  lastActivityAtIdx: index("idx_forum_threads_last_activity").on(table.lastActivityAt),
  slugIdx: index("idx_forum_threads_slug").on(table.slug),
}));

// Forum Thread Replies (with SEO for each reply)
export const forumReplies = pgTable("forum_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull().references(() => forumThreads.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  parentId: varchar("parent_id").references((): any => forumReplies.id),
  body: text("body").notNull(),
  slug: text("slug").notNull().unique(), // SEO: Each reply gets unique slug for Google indexing
  metaDescription: text("meta_description"), // SEO: Auto-generated from body
  imageUrls: text("image_urls").array(),
  helpful: integer("helpful").notNull().default(0),
  isAccepted: boolean("is_accepted").notNull().default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  threadIdIdx: index("idx_forum_replies_thread_id").on(table.threadId),
  createdAtIdx: index("idx_forum_replies_created_at").on(table.createdAt),
  slugIdx: index("idx_forum_replies_slug").on(table.slug),
}));

// Forum Categories with dynamic stats and hierarchical support
export const forumCategories = pgTable("forum_categories", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // Icon name from lucide-react
  color: text("color").notNull().default("bg-primary"),
  parentSlug: text("parent_slug"), // For subcategories: references parent category slug
  threadCount: integer("thread_count").notNull().default(0),
  postCount: integer("post_count").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  parentSlugIdx: index("idx_forum_categories_parent_slug").on(table.parentSlug),
}));

// User Badges & Trust Levels
export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  badgeType: text("badge_type").notNull().$type<"verified_trader" | "top_contributor" | "ea_expert" | "helpful_member" | "early_adopter">(),
  awardedAt: timestamp("awarded_at").notNull().defaultNow(),
});

// Activity Feed for real-time updates
export const activityFeed = pgTable("activity_feed", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  activityType: text("activity_type").notNull().$type<"thread_created" | "reply_posted" | "content_published" | "purchase_made" | "review_posted" | "badge_earned">(),
  entityType: text("entity_type").notNull().$type<"thread" | "reply" | "content" | "purchase" | "review" | "badge">(),
  entityId: varchar("entity_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_activity_feed_user_id").on(table.userId),
}));

// Double-Entry Ledger Tables (Immutable Accounting System)

// User Wallet - One row per user
export const userWallet = pgTable("user_wallet", {
  walletId: varchar("wallet_id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  balance: integer("balance").notNull().default(0),
  availableBalance: integer("available_balance").notNull().default(0),
  status: text("status").notNull().default("active"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: uniqueIndex("idx_user_wallet_user_id").on(table.userId),
  statusIdx: index("idx_user_wallet_status").on(table.status),
}));

// Coin Ledger Transactions - Header for grouped entries
export const coinLedgerTransactions = pgTable("coin_ledger_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  context: json("context").$type<Record<string, any>>(),
  externalRef: text("external_ref"),
  initiatorUserId: varchar("initiator_user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
  status: text("status").notNull().default("pending"),
}, (table) => ({
  typeIdx: index("idx_ledger_tx_type").on(table.type),
  statusIdx: index("idx_ledger_tx_status").on(table.status),
  initiatorIdx: index("idx_ledger_tx_initiator").on(table.initiatorUserId),
}));

// Coin Journal Entries - Immutable debit/credit entries
export const coinJournalEntries = pgTable("coin_journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ledgerTransactionId: varchar("ledger_transaction_id").notNull()
    .references(() => coinLedgerTransactions.id),
  walletId: varchar("wallet_id").notNull().references(() => userWallet.walletId),
  direction: text("direction").notNull(),
  amount: integer("amount").notNull(),
  balanceBefore: integer("balance_before").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  memo: text("memo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  ledgerTxIdx: index("idx_journal_ledger_tx").on(table.ledgerTransactionId),
  walletIdx: index("idx_journal_wallet").on(table.walletId),
  createdAtIdx: index("idx_journal_created_at").on(table.createdAt),
  amountCheck: check("chk_amount_positive", sql`${table.amount} > 0`),
}));

// Ledger Reconciliation Runs - Audit trail
export const ledgerReconciliationRuns = pgTable("ledger_reconciliation_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: text("status").notNull(),
  driftCount: integer("drift_count").notNull().default(0),
  maxDelta: integer("max_delta").notNull().default(0),
  report: json("report").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Dashboard Preferences - User customization
export const dashboardPreferences = pgTable("dashboard_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  widgetOrder: text("widget_order").array().notNull(),
  enabledWidgets: text("enabled_widgets").array().notNull(),
  layoutType: text("layout_type").notNull().$type<"default" | "compact" | "comfortable">().default("default"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_dashboard_preferences_user_id").on(table.userId),
}));

// Daily Activity Tracking - To enforce daily limits
export const dailyActivityLimits = pgTable("daily_activity_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  activityDate: timestamp("activity_date").notNull().defaultNow(),
  repliesCount: integer("replies_count").notNull().default(0),
  reportsCount: integer("reports_count").notNull().default(0),
  backtestsCount: integer("backtests_count").notNull().default(0),
  lastCheckinAt: timestamp("last_checkin_at"),
  consecutiveDays: integer("consecutive_days").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userDateIdx: uniqueIndex("idx_daily_activity_user_date").on(table.userId, table.activityDate),
  userIdIdx: index("idx_daily_activity_user_id").on(table.userId),
}));

// Referral System - Track referrals and commissions
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => users.id),
  referredUserId: varchar("referred_user_id").notNull().references(() => users.id),
  signupBonus: integer("signup_bonus").notNull().default(10),
  firstPostBonus: integer("first_post_bonus").notNull().default(0),
  firstPurchaseBonus: integer("first_purchase_bonus").notNull().default(0),
  lifetimeCommissionEarned: integer("lifetime_commission_earned").notNull().default(0),
  status: text("status").notNull().$type<"active" | "inactive">().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  referrerIdx: index("idx_referrals_referrer_id").on(table.referrerId),
  referredIdx: uniqueIndex("idx_referrals_referred_user_id").on(table.referredUserId),
}));

// Upsert User schema for Replit Auth (OIDC)
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  username: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;

// Insert User schema for traditional auth (username/password)
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  totalCoins: true,
  weeklyEarned: true,
  rank: true,
  youtubeUrl: true,
  instagramHandle: true,
  telegramHandle: true,
  myfxbookLink: true,
  investorId: true,
  investorPassword: true,
  isVerifiedTrader: true,
  emailNotifications: true,
  hasYoutubeReward: true,
  hasMyfxbookReward: true,
  hasInvestorReward: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertCoinTransactionSchema = createInsertSchema(coinTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertRechargeOrderSchema = createInsertSchema(rechargeOrders).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({
  id: true,
  requestedAt: true,
  processedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  amount: z.number().min(1000, "Minimum withdrawal is 1000 coins"),
  cryptoType: z.enum(["BTC", "ETH"]),
  walletAddress: z.string().min(26, "Invalid wallet address").max(100, "Invalid wallet address"),
});

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
  downloads: true,
  likes: true,
  status: true,
  focusKeyword: true,
  autoMetaDescription: true,
  autoImageAltTexts: true,
  slug: true,
}).extend({
  title: z.string().min(10).max(120),
  description: z.string().min(300),
  priceCoins: z.number().min(0).max(10000),
  platform: z.enum(["MT4", "MT5", "Both"]).optional(),
  version: z.string().optional(),
  tags: z.array(z.string()).max(8).optional(),
  files: z.array(z.object({
    name: z.string(),
    size: z.number(),
    url: z.string(),
    checksum: z.string(),
  })).min(1, "At least 1 file is required").optional(),
  images: z.array(z.object({
    url: z.string(),
    isCover: z.boolean(),
    order: z.number(),
  })).min(1, "At least 1 image is required").optional(),
  brokerCompat: z.array(z.string()).optional(),
  minDeposit: z.number().optional(),
  hedging: z.boolean().optional(),
  changelog: z.string().optional(),
  license: z.string().optional(),
  // Evidence fields (conditionally required based on tags)
  equityCurveImage: z.string().optional(),
  profitFactor: z.number().optional(),
  drawdownPercent: z.number().optional(),
  winPercent: z.number().optional(),
  broker: z.string().optional(),
  monthsTested: z.number().optional(),
});

export const insertContentPurchaseSchema = createInsertSchema(contentPurchases).omit({
  id: true,
  purchasedAt: true,
  sellerId: true,
  transactionId: true,
  priceCoins: true,
});

export const insertContentReviewSchema = createInsertSchema(contentReviews).omit({
  id: true,
  createdAt: true,
  status: true,
  rewardGiven: true,
}).extend({
  rating: z.number().min(1).max(5),
  review: z.string().min(50).max(1000),
});

export const insertContentLikeSchema = createInsertSchema(contentLikes).omit({
  id: true,
  createdAt: true,
});

export const insertContentReplySchema = createInsertSchema(contentReplies).omit({
  id: true,
  createdAt: true,
  helpful: true,
  isVerified: true,
}).extend({
  body: z.string().min(10).max(5000),
  rating: z.number().min(1).max(5).optional(),
});

export const insertBrokerSchema = createInsertSchema(brokers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  overallRating: true,
  reviewCount: true,
  scamReportCount: true,
  status: true,
  isVerified: true,
});

export const insertBrokerReviewSchema = createInsertSchema(brokerReviews).omit({
  id: true,
  datePosted: true,
  status: true,
}).extend({
  rating: z.number().min(1).max(5),
  reviewTitle: z.string().min(10).max(200),
  reviewBody: z.string().min(100).max(2000),
});

export const insertUserFollowSchema = createInsertSchema(userFollows).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
}).extend({
  body: z.string().min(1).max(5000),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
}).extend({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(500),
});

export const updateUserProfileSchema = z.object({
  youtubeUrl: z.string().url().optional().or(z.literal("")),
  instagramHandle: z.string().min(1).max(50).optional().or(z.literal("")),
  telegramHandle: z.string().min(1).max(50).optional().or(z.literal("")),
  myfxbookLink: z.string().url().optional().or(z.literal("")),
  investorId: z.string().optional().or(z.literal("")),
  investorPassword: z.string().optional().or(z.literal("")),
  emailNotifications: z.boolean(),
});

// User types already defined above near upsertUserSchema
export type CoinTransaction = typeof coinTransactions.$inferSelect;
export type InsertCoinTransaction = z.infer<typeof insertCoinTransactionSchema>;
export type RechargeOrder = typeof rechargeOrders.$inferSelect;
export type InsertRechargeOrder = z.infer<typeof insertRechargeOrderSchema>;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;
export type Content = typeof content.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type ContentPurchase = typeof contentPurchases.$inferSelect;
export type InsertContentPurchase = z.infer<typeof insertContentPurchaseSchema>;
export type ContentReview = typeof contentReviews.$inferSelect;
export type InsertContentReview = z.infer<typeof insertContentReviewSchema>;
export type ContentLike = typeof contentLikes.$inferSelect;
export type InsertContentLike = z.infer<typeof insertContentLikeSchema>;
export type ContentReply = typeof contentReplies.$inferSelect;
export type InsertContentReply = z.infer<typeof insertContentReplySchema>;
export type Broker = typeof brokers.$inferSelect;
export type InsertBroker = z.infer<typeof insertBrokerSchema>;
export type BrokerReview = typeof brokerReviews.$inferSelect;
export type InsertBrokerReview = z.infer<typeof insertBrokerReviewSchema>;
export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = z.infer<typeof insertUserFollowSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export const insertMessageReactionSchema = createInsertSchema(messageReactions).omit({
  id: true,
  createdAt: true,
});
export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

export const insertForumThreadSchema = createInsertSchema(forumThreads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
  replyCount: true,
  lastActivityAt: true,
  slug: true,
  focusKeyword: true,
  metaDescription: true,
  status: true,
}).extend({
  title: z.string().min(10).max(300),
  body: z.string().min(50).max(50000),
});

export const insertForumReplySchema = createInsertSchema(forumReplies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  helpful: true,
  isAccepted: true,
  isVerified: true,
  slug: true,
  metaDescription: true,
}).extend({
  body: z.string().min(10).max(10000),
});

export const insertForumCategorySchema = createInsertSchema(forumCategories).omit({
  threadCount: true,
  postCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  awardedAt: true,
});

export const insertActivityFeedSchema = createInsertSchema(activityFeed).omit({
  id: true,
  createdAt: true,
}).extend({
  title: z.string().min(1).max(300),
  description: z.string().max(500).optional(),
});

export type ForumThread = typeof forumThreads.$inferSelect;
export type InsertForumThread = z.infer<typeof insertForumThreadSchema>;
export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertForumReply = z.infer<typeof insertForumReplySchema>;
export type ForumCategory = typeof forumCategories.$inferSelect;
export type InsertForumCategory = z.infer<typeof insertForumCategorySchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type ActivityFeed = typeof activityFeed.$inferSelect;
export type InsertActivityFeed = z.infer<typeof insertActivityFeedSchema>;

// Double-Entry Ledger schemas
export const insertUserWalletSchema = createInsertSchema(userWallet).omit({ walletId: true, updatedAt: true });
export type InsertUserWallet = z.infer<typeof insertUserWalletSchema>;
export type UserWallet = typeof userWallet.$inferSelect;

export const insertCoinLedgerTransactionSchema = createInsertSchema(coinLedgerTransactions)
  .omit({ id: true, createdAt: true, closedAt: true });
export type InsertCoinLedgerTransaction = z.infer<typeof insertCoinLedgerTransactionSchema>;
export type CoinLedgerTransaction = typeof coinLedgerTransactions.$inferSelect;

export const insertCoinJournalEntrySchema = createInsertSchema(coinJournalEntries)
  .omit({ id: true, createdAt: true });
export type InsertCoinJournalEntry = z.infer<typeof insertCoinJournalEntrySchema>;
export type CoinJournalEntry = typeof coinJournalEntries.$inferSelect;

export const insertLedgerReconciliationRunSchema = createInsertSchema(ledgerReconciliationRuns)
  .omit({ id: true, createdAt: true, completedAt: true });
export type InsertLedgerReconciliationRun = z.infer<typeof insertLedgerReconciliationRunSchema>;
export type LedgerReconciliationRun = typeof ledgerReconciliationRuns.$inferSelect;

// Dashboard Preferences schemas
export const insertDashboardPreferencesSchema = createInsertSchema(dashboardPreferences)
  .omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDashboardPreferences = z.infer<typeof insertDashboardPreferencesSchema>;
export type DashboardPreferences = typeof dashboardPreferences.$inferSelect;

// Publish-specific validation schema with conditional evidence fields
export const publishContentSchema = insertContentSchema.superRefine((data, ctx) => {
  // Check if "Performance Report" tag is included
  const hasPerformanceReportTag = data.tags?.includes("Performance Report");
  
  if (hasPerformanceReportTag) {
    // Require evidence fields when Performance Report tag is present
    if (!data.equityCurveImage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Equity curve image is required for Performance Reports",
        path: ["equityCurveImage"],
      });
    }
    if (!data.profitFactor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Profit Factor is required for Performance Reports",
        path: ["profitFactor"],
      });
    }
    if (!data.drawdownPercent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Drawdown % is required for Performance Reports",
        path: ["drawdownPercent"],
      });
    }
    if (!data.winPercent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Win % is required for Performance Reports",
        path: ["winPercent"],
      });
    }
    if (!data.broker) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Broker name is required for Performance Reports",
        path: ["broker"],
      });
    }
    if (!data.monthsTested) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Months Tested is required for Performance Reports",
        path: ["monthsTested"],
      });
    }
  }
  
  return data;
});

export type PublishContent = z.infer<typeof publishContentSchema>;

// Badge System Constants
export const BADGE_TYPES = {
  VERIFIED_TRADER: 'verified_trader',
  TOP_CONTRIBUTOR: 'top_contributor',
  EA_MASTER: 'ea_master',
  HELPFUL: 'helpful',
  EARLY_ADOPTER: 'early_adopter',
  BUG_HUNTER: 'bug_hunter',
} as const;

export type BadgeType = typeof BADGE_TYPES[keyof typeof BADGE_TYPES];

export const BADGE_METADATA: Record<BadgeType, {
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  [BADGE_TYPES.VERIFIED_TRADER]: {
    name: 'Verified Trader',
    description: 'Linked and verified trading account',
    icon: 'ShieldCheck',
    color: 'text-blue-500',
  },
  [BADGE_TYPES.TOP_CONTRIBUTOR]: {
    name: 'Top Contributor',
    description: 'Top 10 on contributor leaderboard',
    icon: 'Star',
    color: 'text-yellow-500',
  },
  [BADGE_TYPES.EA_MASTER]: {
    name: 'EA Master',
    description: 'Published 5+ Expert Advisors',
    icon: 'Award',
    color: 'text-purple-500',
  },
  [BADGE_TYPES.HELPFUL]: {
    name: 'Helpful',
    description: '50+ helpful replies',
    icon: 'Heart',
    color: 'text-red-500',
  },
  [BADGE_TYPES.EARLY_ADOPTER]: {
    name: 'Early Adopter',
    description: 'Joined in the first month',
    icon: 'Zap',
    color: 'text-orange-500',
  },
  [BADGE_TYPES.BUG_HUNTER]: {
    name: 'Bug Hunter',
    description: 'Reported verified bugs',
    icon: 'Bug',
    color: 'text-green-500',
  },
};

// Daily Activity Limits types
export type DailyActivityLimit = typeof dailyActivityLimits.$inferSelect;
export type InsertDailyActivityLimit = typeof dailyActivityLimits.$inferInsert;

// Referral types
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;
