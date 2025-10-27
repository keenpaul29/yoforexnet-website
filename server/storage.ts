import { 
  type User, 
  type UpsertUser,
  type InsertUser,
  type CoinTransaction, 
  type InsertCoinTransaction,
  type RechargeOrder,
  type InsertRechargeOrder,
  type WithdrawalRequest,
  type InsertWithdrawalRequest,
  type Content,
  type InsertContent,
  type ContentPurchase,
  type InsertContentPurchase,
  type ContentReview,
  type InsertContentReview,
  type ContentLike,
  type InsertContentLike,
  type ContentReply,
  type InsertContentReply,
  type Broker,
  type InsertBroker,
  type BrokerReview,
  type InsertBrokerReview,
  type ForumThread,
  type InsertForumThread,
  type ForumReply,
  type InsertForumReply,
  type ForumCategory,
  type InsertForumCategory,
  type UserBadge,
  type InsertUserBadge,
  type ActivityFeed,
  type InsertActivityFeed,
  type UserFollow,
  type InsertUserFollow,
  type UserWallet,
  type CoinLedgerTransaction,
  type CoinJournalEntry,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Notification,
  type InsertNotification,
  type DashboardPreferences,
  type InsertDashboardPreferences,
  users,
  coinTransactions,
  rechargeOrders,
  withdrawalRequests,
  content,
  contentPurchases,
  contentReviews,
  contentLikes,
  contentReplies,
  brokers,
  brokerReviews,
  forumThreads,
  forumReplies,
  forumCategories,
  userBadges,
  activityFeed,
  userFollows,
  userWallet,
  coinLedgerTransactions,
  coinJournalEntries,
  conversations,
  messages,
  messageReactions,
  notifications,
  dashboardPreferences,
  BADGE_TYPES,
  type BadgeType
} from "@shared/schema";
import { randomUUID } from "crypto";
import { applySEOAutomations, generateUniqueSlug, generateThreadSlug, generateReplySlug, generateMetaDescription, extractFocusKeyword } from "./seo-engine";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, count, inArray, gt } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser | UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserCoins(userId: string, coins: number): Promise<User | undefined>;
  updateUserProfile(userId: string, data: Partial<User>): Promise<User | undefined>;
  trackOnboardingProgress(userId: string, task: string): Promise<{ completed: boolean; coinsEarned: number }>;
  
  createCoinTransaction(transaction: InsertCoinTransaction): Promise<CoinTransaction>;
  getUserTransactions(userId: string, limit?: number): Promise<CoinTransaction[]>;
  
  createRechargeOrder(order: InsertRechargeOrder): Promise<RechargeOrder>;
  getRechargeOrder(id: string): Promise<RechargeOrder | undefined>;
  updateRechargeOrderStatus(id: string, status: "completed" | "failed", paymentId?: string): Promise<RechargeOrder | undefined>;
  
  createContent(content: InsertContent): Promise<Content>;
  getContent(id: string): Promise<Content | undefined>;
  getContentBySlug(slug: string): Promise<Content | undefined>;
  getAllContent(filters?: { type?: string; category?: string; status?: string }): Promise<Content[]>;
  getUserContent(userId: string): Promise<Content[]>;
  updateContentViews(contentId: string): Promise<void>;
  updateContentDownloads(contentId: string): Promise<void>;
  
  purchaseContent(contentId: string, buyerId: string): Promise<ContentPurchase>;
  getUserPurchases(userId: string): Promise<ContentPurchase[]>;
  hasPurchased(userId: string, contentId: string): Promise<boolean>;
  
  createReview(review: InsertContentReview): Promise<ContentReview>;
  getContentReviews(contentId: string): Promise<ContentReview[]>;
  
  likeContent(like: InsertContentLike): Promise<ContentLike | null>;
  hasLiked(userId: string, contentId: string): Promise<boolean>;
  
  createReply(reply: InsertContentReply): Promise<ContentReply>;
  getContentReplies(contentId: string): Promise<ContentReply[]>;
  updateReplyHelpful(replyId: string): Promise<void>;
  
  createBroker(broker: InsertBroker): Promise<Broker>;
  getBroker(id: string): Promise<Broker | undefined>;
  getBrokerBySlug(slug: string): Promise<Broker | undefined>;
  getAllBrokers(filters?: { isVerified?: boolean; status?: string }): Promise<Broker[]>;
  
  createBrokerReview(review: InsertBrokerReview): Promise<BrokerReview>;
  getBrokerReview(reviewId: string): Promise<BrokerReview | null>;
  getBrokerReviews(brokerId: string, filters?: { isScamReport?: boolean }): Promise<BrokerReview[]>;
  updateBrokerReviewStatus(reviewId: string, status: string): Promise<BrokerReview>;
  updateBrokerRating(brokerId: string): Promise<void>;
  
  createForumThread(thread: InsertForumThread): Promise<ForumThread>;
  getForumThreadById(id: string): Promise<ForumThread | undefined>;
  getForumThreadBySlug(slug: string): Promise<ForumThread | undefined>;
  listForumThreads(filters?: { categorySlug?: string; status?: string; isPinned?: boolean; limit?: number }): Promise<ForumThread[]>;
  updateForumThreadReplyCount(threadId: string, increment: number): Promise<void>;
  updateForumThreadActivity(threadId: string): Promise<void>;
  
  createForumReply(reply: InsertForumReply): Promise<ForumReply>;
  listForumReplies(threadId: string): Promise<ForumReply[]>;
  markReplyAsAccepted(replyId: string): Promise<ForumReply | null>;
  markReplyAsHelpful(replyId: string): Promise<ForumReply | null>;
  
  listForumCategories(): Promise<ForumCategory[]>;
  getForumCategoryBySlug(slug: string): Promise<ForumCategory | undefined>;
  updateCategoryStats(categorySlug: string): Promise<void>;
  
  createUserBadge(userId: string, badgeType: string): Promise<UserBadge>;
  getUserBadges(userId: string): Promise<UserBadge[]>;
  hasUserBadge(userId: string, badgeType: string): Promise<boolean>;
  
  createActivity(activity: InsertActivityFeed): Promise<ActivityFeed>;
  getRecentActivity(limit?: number): Promise<ActivityFeed[]>;
  getUserActivity(userId: string, limit?: number): Promise<ActivityFeed[]>;
  
  getLeaderboard(type: "coins" | "contributions" | "uploads", limit?: number): Promise<User[]>;
  
  getTopUsersByCoins(limit: number): Promise<Array<{
    userId: string;
    username: string;
    balance: number;
    rank: number;
  }>>;
  
  getTopContributors(limit: number): Promise<Array<{
    userId: string;
    username: string;
    helpfulCount: number;
    acceptedCount: number;
    totalContributions: number;
    rank: number;
  }>>;
  
  getTopSellers(limit: number): Promise<Array<{
    userId: string;
    username: string;
    totalRevenue: number;
    salesCount: number;
    rank: number;
  }>>;
  
  createUserFollow(data: InsertUserFollow): Promise<UserFollow>;
  deleteUserFollow(followerId: string, followingId: string): Promise<void>;
  getUserFollowers(userId: string): Promise<User[]>;
  getUserFollowing(userId: string): Promise<User[]>;
  checkIfFollowing(followerId: string, followingId: string): Promise<boolean>;
  
  // Ledger System
  createUserWallet(userId: string): Promise<UserWallet>;
  getUserWallet(userId: string): Promise<UserWallet | null>;
  
  beginLedgerTransaction(
    type: string,
    initiatorUserId: string,
    entries: Array<{
      userId: string;
      direction: 'debit' | 'credit';
      amount: number;
      memo: string;
    }>,
    context?: Record<string, any>,
    externalRef?: string
  ): Promise<CoinLedgerTransaction>;
  
  getLedgerTransactionHistory(userId: string, limit?: number): Promise<CoinJournalEntry[]>;
  
  reconcileWallets(): Promise<{driftCount: number; maxDelta: number}>;
  
  backfillOpeningBalances(): Promise<{created: number; skipped: number}>;
  
  // Badge System
  awardBadge(userId: string, badge: string): Promise<void>;
  checkAndAwardBadges(userId: string): Promise<string[]>;
  
  // Onboarding System
  getOnboardingProgress(userId: string): Promise<{
    completed: boolean;
    dismissed: boolean;
    progress: {
      profileCreated: boolean;
      firstReply: boolean;
      firstReport: boolean;
      firstUpload: boolean;
      socialLinked: boolean;
    };
  } | null>;
  
  markOnboardingStep(userId: string, step: string): Promise<void>;
  dismissOnboarding(userId: string): Promise<void>;
  
  // Ranking System
  getAllForumThreads(): Promise<ForumThread[]>;
  getAllUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  getUserStats(userId: string): Promise<{
    threadsCreated: number;
    repliesPosted: number;
    likesReceived: number;
    bestAnswers: number;
    contentSales: number;
    followersCount: number;
    uploadsCount: number;
  }>;
  getContentSalesStats(contentId: string): Promise<{
    totalSales: number;
    reviewCount: number;
    avgRating: number;
  }>;
  updateThreadScore(threadId: string, score: number): Promise<void>;
  updateUserReputation(userId: string, reputation: number): Promise<void>;
  updateContentSalesScore(contentId: string, score: number): Promise<void>;
  
  // Messaging System
  sendMessage(senderId: string, recipientId: string, body: string): Promise<any>;
  getConversations(userId: string): Promise<Array<{
    id: string;
    participant: User;
    lastMessage: {
      text: string;
      timestamp: Date;
      isRead: boolean;
      isSentByMe: boolean;
    };
    unreadCount: number;
  }>>;
  getConversationMessages(conversationId: string, userId: string): Promise<Array<{
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
    isRead: boolean;
  }>>;
  markMessageAsRead(messageId: string, userId: string): Promise<void>;
  searchMessages(userId: string, query: string, filterUserId?: string): Promise<Array<{
    id: string;
    conversationId: string;
    senderId: string;
    senderUsername: string;
    text: string;
    timestamp: Date;
  }>>;
  addMessageReaction(messageId: string, userId: string, emoji: string): Promise<void>;
  removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<void>;
  getMessageReactions(messageId: string): Promise<Array<{ emoji: string; count: number; userIds: string[] }>>;
  
  // Dashboard Preferences
  getDashboardPreferences(userId: string): Promise<DashboardPreferences | null>;
  saveDashboardPreferences(userId: string, preferences: InsertDashboardPreferences): Promise<DashboardPreferences>;
  
  // Withdrawal System
  createWithdrawalRequest(userId: string, data: Omit<InsertWithdrawalRequest, 'userId'>): Promise<WithdrawalRequest>;
  getUserWithdrawals(userId: string): Promise<WithdrawalRequest[]>;
  getWithdrawalById(withdrawalId: string, userId: string): Promise<WithdrawalRequest | null>;
  cancelWithdrawalRequest(withdrawalId: string, userId: string): Promise<WithdrawalRequest | null>;
  
  // Notification System
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string, userId: string): Promise<Notification | null>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  
  // Earnings Summary
  getUserEarningsSummary(userId: string): Promise<{
    totalEarned: number;
    weeklyEarned: number;
    breakdown: Array<{
      source: string;
      amount: number;
      percentage: number;
    }>;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private transactions: Map<string, CoinTransaction>;
  private rechargeOrders: Map<string, RechargeOrder>;
  private content: Map<string, Content>;
  private contentPurchases: Map<string, ContentPurchase>;
  private contentReviews: Map<string, ContentReview>;
  private contentLikes: Map<string, ContentLike>;
  private contentReplies: Map<string, ContentReply>;
  private brokers: Map<string, Broker>;
  private brokerReviews: Map<string, BrokerReview>;
  private forumThreadsMap: Map<string, ForumThread>;
  private forumRepliesMap: Map<string, ForumReply>;
  private forumCategoriesMap: Map<string, ForumCategory>;
  private userBadgesMap: Map<string, UserBadge>;
  private activityFeedMap: Map<string, ActivityFeed>;
  private userFollowsMap: Map<string, UserFollow>;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.rechargeOrders = new Map();
    this.content = new Map();
    this.contentPurchases = new Map();
    this.contentReviews = new Map();
    this.contentLikes = new Map();
    this.contentReplies = new Map();
    this.brokers = new Map();
    this.brokerReviews = new Map();
    this.forumThreadsMap = new Map();
    this.forumRepliesMap = new Map();
    this.forumCategoriesMap = new Map();
    this.userBadgesMap = new Map();
    this.activityFeedMap = new Map();
    this.userFollowsMap = new Map();
    
    // Create demo user with coins
    const demoUser: User = {
      id: "demo-user-id",
      username: "demo",
      password: "demo",
      email: null,
      firstName: null,
      lastName: null,
      profileImageUrl: null,
      totalCoins: 2450,
      weeklyEarned: 85,
      rank: 142,
      youtubeUrl: null,
      instagramHandle: null,
      telegramHandle: null,
      myfxbookLink: null,
      investorId: null,
      investorPassword: null,
      isVerifiedTrader: false,
      emailNotifications: true,
      hasYoutubeReward: false,
      hasMyfxbookReward: false,
      hasInvestorReward: false,
      badges: null,
      onboardingCompleted: false,
      onboardingDismissed: false,
      onboardingProgress: null,
      reputationScore: 0,
      lastReputationUpdate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(demoUser.id, demoUser);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser | UpsertUser): Promise<User> {
    const id = 'id' in insertUser && insertUser.id ? insertUser.id : randomUUID();
    
    // Determine if this is OIDC or traditional auth
    const isOIDC = 'email' in insertUser && insertUser.email !== undefined;
    
    const user: User = { 
      id,
      // OIDC fields (if present)
      email: isOIDC ? ((insertUser as UpsertUser).email ?? null) : null,
      firstName: isOIDC ? ((insertUser as UpsertUser).firstName ?? null) : null,
      lastName: isOIDC ? ((insertUser as UpsertUser).lastName ?? null) : null,
      profileImageUrl: isOIDC ? ((insertUser as UpsertUser).profileImageUrl ?? null) : null,
      // Traditional auth fields (if present)
      username: 'username' in insertUser ? insertUser.username : (isOIDC ? (insertUser as UpsertUser).email || 'user' : 'user'),
      password: 'password' in insertUser ? insertUser.password : null,
      // YoForex fields with defaults
      totalCoins: 0,
      weeklyEarned: 0,
      rank: null,
      youtubeUrl: null,
      instagramHandle: null,
      telegramHandle: null,
      myfxbookLink: null,
      investorId: null,
      investorPassword: null,
      isVerifiedTrader: false,
      emailNotifications: true,
      hasYoutubeReward: false,
      hasMyfxbookReward: false,
      hasInvestorReward: false,
      badges: null,
      onboardingCompleted: false,
      onboardingDismissed: false,
      onboardingProgress: null,
      reputationScore: 0,
      lastReputationUpdate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async upsertUser(upsertUser: UpsertUser): Promise<User> {
    // Type guard: ensure id is defined
    if (!upsertUser.id) {
      throw new Error("User ID is required for upsert operation");
    }
    
    const existingUser = this.users.get(upsertUser.id);
    
    if (existingUser) {
      // Update existing user (don't change username to avoid conflicts)
      const updatedUser: User = {
        ...existingUser,
        email: upsertUser.email ?? existingUser.email,
        firstName: upsertUser.firstName ?? existingUser.firstName,
        lastName: upsertUser.lastName ?? existingUser.lastName,
        profileImageUrl: upsertUser.profileImageUrl ?? existingUser.profileImageUrl,
        updatedAt: new Date(),
      };
      this.users.set(upsertUser.id, updatedUser);
      return updatedUser;
    } else {
      // Create new user with collision-safe username
      let username = upsertUser.username || 'user';
      let attempt = 0;
      let finalUsername = username;
      
      // Check for username collisions and append suffix if needed
      while (await this.getUserByUsername(finalUsername)) {
        attempt++;
        finalUsername = `${username}_${attempt}`;
        if (attempt > 100) {
          // Fallback to UUID-based username to guarantee uniqueness
          finalUsername = `user_${upsertUser.id.substring(0, 8)}`;
          break;
        }
      }
      
      return this.createUser({
        ...upsertUser,
        username: finalUsername,
      });
    }
  }

  async updateUserCoins(userId: string, coins: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, totalCoins: user.totalCoins + coins };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserProfile(userId: string, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data, id: user.id, updatedAt: new Date() };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async trackOnboardingProgress(userId: string, task: string): Promise<{ completed: boolean; coinsEarned: number }> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");

    const progress = (user.onboardingProgress as any) || {
      profileCreated: false,
      firstReply: false,
      firstReport: false,
      firstUpload: false,
      socialLinked: false,
    };

    const taskMapping: Record<string, { key: string; reward: number }> = {
      profileCreated: { key: "profileCreated", reward: 10 },
      firstReply: { key: "firstReply", reward: 15 },
      firstReport: { key: "firstReport", reward: 20 },
      firstUpload: { key: "firstUpload", reward: 50 },
      socialLinked: { key: "socialLinked", reward: 30 },
    };

    const taskInfo = taskMapping[task];
    if (!taskInfo) {
      return { completed: false, coinsEarned: 0 };
    }

    if (progress[taskInfo.key]) {
      return { completed: true, coinsEarned: 0 };
    }

    progress[taskInfo.key] = true;
    const allCompleted = Object.values(progress).every((v) => v === true);

    // Update onboarding progress (coins will be updated by createCoinTransaction)
    const updatedUser = {
      ...user,
      onboardingProgress: progress,
      onboardingCompleted: allCompleted,
    };
    this.users.set(userId, updatedUser);

    // Award coins through transaction system (this updates totalCoins)
    await this.createCoinTransaction({
      userId,
      type: "earn",
      amount: taskInfo.reward,
      description: `Onboarding reward: ${task}`,
      status: "completed",
    });

    return { completed: true, coinsEarned: taskInfo.reward };
  }

  async createCoinTransaction(insertTransaction: InsertCoinTransaction): Promise<CoinTransaction> {
    const user = this.users.get(insertTransaction.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Calculate actual balance change based on transaction type
    const balanceChange = insertTransaction.type === "spend" 
      ? -Math.abs(insertTransaction.amount) 
      : Math.abs(insertTransaction.amount);
    
    // Prevent overdraft
    if (user.totalCoins + balanceChange < 0) {
      throw new Error("Insufficient coins");
    }
    
    const id = randomUUID();
    const transaction: CoinTransaction = {
      id,
      userId: insertTransaction.userId,
      type: insertTransaction.type as "earn" | "spend" | "recharge",
      amount: Math.abs(insertTransaction.amount),
      description: insertTransaction.description,
      status: (insertTransaction.status || "completed") as "completed" | "pending" | "failed",
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    
    // Update user's coin balance and stats
    const updatedUser = {
      ...user,
      totalCoins: user.totalCoins + balanceChange,
      weeklyEarned: insertTransaction.type === "earn" || insertTransaction.type === "recharge"
        ? user.weeklyEarned + Math.abs(insertTransaction.amount)
        : user.weeklyEarned
    };
    this.users.set(insertTransaction.userId, updatedUser);
    
    // Recalculate rank based on total coins
    await this.recalculateRanks();
    
    return transaction;
  }

  async getUserTransactions(userId: string, limit = 20): Promise<CoinTransaction[]> {
    return Array.from(this.transactions.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createRechargeOrder(insertOrder: InsertRechargeOrder): Promise<RechargeOrder> {
    const id = randomUUID();
    const order: RechargeOrder = {
      id,
      userId: insertOrder.userId,
      coinAmount: insertOrder.coinAmount,
      priceUsd: insertOrder.priceUsd,
      paymentMethod: insertOrder.paymentMethod as "stripe" | "crypto",
      paymentId: insertOrder.paymentId || null,
      status: (insertOrder.status || "pending") as "completed" | "pending" | "failed",
      createdAt: new Date(),
      completedAt: null,
    };
    this.rechargeOrders.set(id, order);
    return order;
  }

  async getRechargeOrder(id: string): Promise<RechargeOrder | undefined> {
    return this.rechargeOrders.get(id);
  }

  async updateRechargeOrderStatus(
    id: string, 
    status: "completed" | "failed",
    paymentId?: string
  ): Promise<RechargeOrder | undefined> {
    const order = this.rechargeOrders.get(id);
    if (!order) return undefined;
    
    const updatedOrder: RechargeOrder = {
      ...order,
      status,
      paymentId: paymentId || order.paymentId,
      completedAt: status === "completed" ? new Date() : null,
    };
    this.rechargeOrders.set(id, updatedOrder);
    
    // If completed, credit coins and create transaction
    if (status === "completed") {
      await this.createCoinTransaction({
        userId: order.userId,
        type: "recharge",
        amount: order.coinAmount,
        description: `Coin recharge via ${order.paymentMethod}`,
        status: "completed",
      });
    }
    
    return updatedOrder;
  }
  
  private async recalculateRanks(): Promise<void> {
    // Sort users by total coins descending
    const sortedUsers = Array.from(this.users.values())
      .sort((a, b) => b.totalCoins - a.totalCoins);
    
    // Assign ranks
    sortedUsers.forEach((user, index) => {
      const updatedUser = { ...user, rank: index + 1 };
      this.users.set(user.id, updatedUser);
    });
  }
  
  // Content Management Methods
  async createContent(insertContent: InsertContent): Promise<Content> {
    const id = randomUUID();
    
    // Apply Invisible SEO Engine automations
    const seo = applySEOAutomations({
      title: insertContent.title,
      description: insertContent.description,
      imageUrls: insertContent.imageUrls || [],
    });
    
    // De-duplicate slug to prevent collisions
    const existingSlugs = new Set(
      Array.from(this.content.values()).map((c) => c.slug)
    );
    const uniqueSlug = generateUniqueSlug(seo.slug, existingSlugs);
    
    const content: Content = {
      id,
      authorId: insertContent.authorId,
      type: insertContent.type as "ea" | "indicator" | "article" | "source_code",
      title: insertContent.title,
      description: insertContent.description,
      priceCoins: insertContent.priceCoins,
      isFree: insertContent.isFree ?? (insertContent.priceCoins === 0),
      category: insertContent.category,
      // Publishing flow fields
      platform: null,
      version: null,
      tags: null,
      files: null,
      images: null,
      // Optional fields
      brokerCompat: null,
      minDeposit: null,
      hedging: null,
      changelog: null,
      license: null,
      // Evidence fields (for Performance Reports)
      equityCurveImage: null,
      profitFactor: null,
      drawdownPercent: null,
      winPercent: null,
      broker: null,
      monthsTested: null,
      // Legacy fields
      fileUrl: insertContent.fileUrl || null,
      imageUrl: insertContent.imageUrl || null,
      imageUrls: insertContent.imageUrls || null,
      postLogoUrl: insertContent.postLogoUrl || null,
      views: 0,
      downloads: 0,
      likes: 0,
      status: "pending",
      slug: uniqueSlug,
      focusKeyword: seo.focusKeyword,
      autoMetaDescription: seo.autoMetaDescription,
      autoImageAltTexts: seo.autoImageAltTexts,
      salesScore: 0,
      lastSalesUpdate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.content.set(id, content);
    return content;
  }
  
  async getContent(id: string): Promise<Content | undefined> {
    return this.content.get(id);
  }
  
  async getContentBySlug(slug: string): Promise<Content | undefined> {
    return Array.from(this.content.values()).find((c) => c.slug === slug);
  }
  
  async getAllContent(filters?: { type?: string; category?: string; status?: string }): Promise<Content[]> {
    let contents = Array.from(this.content.values());
    
    if (filters?.type) {
      contents = contents.filter((c) => c.type === filters.type);
    }
    if (filters?.category) {
      contents = contents.filter((c) => c.category === filters.category);
    }
    if (filters?.status) {
      contents = contents.filter((c) => c.status === filters.status);
    }
    
    return contents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getUserContent(userId: string): Promise<Content[]> {
    return Array.from(this.content.values())
      .filter((c) => c.authorId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async updateContentViews(contentId: string): Promise<void> {
    const content = this.content.get(contentId);
    if (content) {
      this.content.set(contentId, { ...content, views: content.views + 1 });
    }
  }
  
  async updateContentDownloads(contentId: string): Promise<void> {
    const content = this.content.get(contentId);
    if (content) {
      this.content.set(contentId, { ...content, downloads: content.downloads + 1 });
    }
  }
  
  // Content Purchase Methods
  async purchaseContent(contentId: string, buyerId: string): Promise<ContentPurchase> {
    // 1. Validate content exists and get seller from content author
    const item = this.content.get(contentId);
    if (!item) throw new Error("Content not found");
    
    const sellerId = item.authorId;
    
    // 2. Prevent self-purchase
    if (buyerId === sellerId) {
      throw new Error("Cannot purchase own content");
    }
    
    // 3. Check if already purchased
    const alreadyPurchased = await this.hasPurchased(buyerId, contentId);
    if (alreadyPurchased) throw new Error("Already purchased");
    
    // 4. Handle free content without transactions
    if (item.isFree || item.priceCoins === 0) {
      const id = randomUUID();
      const purchase: ContentPurchase = {
        id,
        contentId,
        buyerId,
        sellerId,
        priceCoins: 0,
        transactionId: "",
        purchasedAt: new Date(),
      };
      this.contentPurchases.set(id, purchase);
      await this.updateContentDownloads(contentId);
      return purchase;
    }
    
    // 5. Validate both users exist upfront
    const buyer = this.users.get(buyerId);
    if (!buyer) throw new Error("Buyer not found");
    
    const seller = this.users.get(sellerId);
    if (!seller) throw new Error("Seller not found");
    
    // 6. Check if buyer has enough coins
    if (buyer.totalCoins < item.priceCoins) {
      throw new Error(`Insufficient balance. Need ${item.priceCoins} coins, have ${buyer.totalCoins}`);
    }
    
    // 7. Calculate amounts (90% to seller, 10% to platform)
    const sellerAmount = Math.floor(item.priceCoins * 0.9);
    const platformAmount = item.priceCoins - sellerAmount;
    
    // 8. Atomic transaction: Create buyer's spend transaction
    let buyerTransaction: CoinTransaction;
    try {
      buyerTransaction = await this.createCoinTransaction({
        userId: buyerId,
        type: "spend",
        amount: item.priceCoins,
        description: `Purchased: ${item.title}`,
        status: "completed",
      });
    } catch (error) {
      throw new Error("Failed to debit buyer");
    }
    
    // 9. Create seller's earn transaction (90%)
    try {
      await this.createCoinTransaction({
        userId: sellerId,
        type: "earn",
        amount: sellerAmount,
        description: `Sale: ${item.title} (90% of ${item.priceCoins})`,
        status: "completed",
      });
    } catch (error) {
      // Rollback buyer's transaction by crediting back
      await this.createCoinTransaction({
        userId: buyerId,
        type: "earn",
        amount: item.priceCoins,
        description: `Refund: ${item.title} (seller error)`,
        status: "completed",
      });
      throw new Error("Failed to credit seller - purchase cancelled");
    }
    
    // 10. Create purchase record
    const id = randomUUID();
    const purchase: ContentPurchase = {
      id,
      contentId,
      buyerId,
      sellerId,
      priceCoins: item.priceCoins,
      transactionId: buyerTransaction.id,
      purchasedAt: new Date(),
    };
    this.contentPurchases.set(id, purchase);
    
    // 11. Update downloads count
    await this.updateContentDownloads(contentId);
    
    return purchase;
  }
  
  async getUserPurchases(userId: string): Promise<ContentPurchase[]> {
    return Array.from(this.contentPurchases.values())
      .filter((p) => p.buyerId === userId)
      .sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime());
  }
  
  async hasPurchased(userId: string, contentId: string): Promise<boolean> {
    return Array.from(this.contentPurchases.values()).some(
      (p) => p.buyerId === userId && p.contentId === contentId
    );
  }
  
  // Content Review Methods
  async createReview(insertReview: InsertContentReview): Promise<ContentReview> {
    // Verify content exists
    const content = this.content.get(insertReview.contentId);
    if (!content) throw new Error("Content not found");
    
    // Verify user exists
    const user = this.users.get(insertReview.userId);
    if (!user) throw new Error("User not found");
    
    const id = randomUUID();
    const review: ContentReview = {
      id,
      contentId: insertReview.contentId,
      userId: insertReview.userId,
      rating: insertReview.rating,
      review: insertReview.review,
      status: "pending",
      rewardGiven: false,
      createdAt: new Date(),
    };
    this.contentReviews.set(id, review);
    return review;
  }
  
  async getContentReviews(contentId: string): Promise<ContentReview[]> {
    return Array.from(this.contentReviews.values())
      .filter((r) => r.contentId === contentId && r.status === "approved")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  // Content Like Methods
  async likeContent(insertLike: InsertContentLike): Promise<ContentLike | null> {
    // 1. Verify content exists
    const content = this.content.get(insertLike.contentId);
    if (!content) throw new Error("Content not found");
    
    // 2. Verify user exists
    const user = this.users.get(insertLike.userId);
    if (!user) throw new Error("User not found");
    
    // 3. Check if already liked
    const alreadyLiked = await this.hasLiked(insertLike.userId, insertLike.contentId);
    if (alreadyLiked) return null;
    
    // 4. Check daily like limit (5 per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLikes = Array.from(this.contentLikes.values()).filter(
      (l) => l.userId === insertLike.userId && l.createdAt >= today
    );
    if (todayLikes.length >= 5) {
      throw new Error("Daily like limit reached (5 per day)");
    }
    
    const id = randomUUID();
    const like: ContentLike = {
      id,
      contentId: insertLike.contentId,
      userId: insertLike.userId,
      createdAt: new Date(),
    };
    this.contentLikes.set(id, like);
    
    // Update content likes count
    this.content.set(insertLike.contentId, { ...content, likes: content.likes + 1 });
    
    // Award 1 coin to liker
    await this.createCoinTransaction({
      userId: insertLike.userId,
      type: "earn",
      amount: 1,
      description: `Liked: ${content.title}`,
      status: "completed",
    });
    
    return like;
  }
  
  async hasLiked(userId: string, contentId: string): Promise<boolean> {
    return Array.from(this.contentLikes.values()).some(
      (l) => l.userId === userId && l.contentId === contentId
    );
  }
  
  // Content Reply Methods
  async createReply(insertReply: InsertContentReply): Promise<ContentReply> {
    const content = this.content.get(insertReply.contentId);
    if (!content) throw new Error("Content not found");
    
    const user = this.users.get(insertReply.userId);
    if (!user) throw new Error("User not found");
    
    if (insertReply.parentId) {
      const parent = this.contentReplies.get(insertReply.parentId);
      if (!parent) throw new Error("Parent reply not found");
    }
    
    const id = randomUUID();
    const reply: ContentReply = {
      id,
      contentId: insertReply.contentId,
      userId: insertReply.userId,
      parentId: insertReply.parentId || null,
      body: insertReply.body,
      rating: insertReply.rating || null,
      imageUrls: insertReply.imageUrls || null,
      helpful: 0,
      isVerified: false,
      createdAt: new Date(),
    };
    this.contentReplies.set(id, reply);
    return reply;
  }
  
  async getContentReplies(contentId: string): Promise<ContentReply[]> {
    return Array.from(this.contentReplies.values())
      .filter((r) => r.contentId === contentId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async updateReplyHelpful(replyId: string): Promise<void> {
    const reply = this.contentReplies.get(replyId);
    if (reply) {
      this.contentReplies.set(replyId, { ...reply, helpful: reply.helpful + 1 });
    }
  }
  
  // Broker Management Methods
  async createBroker(insertBroker: InsertBroker): Promise<Broker> {
    const id = randomUUID();
    const broker: Broker = {
      id,
      name: insertBroker.name,
      slug: insertBroker.slug,
      websiteUrl: insertBroker.websiteUrl || null,
      logoUrl: insertBroker.logoUrl || null,
      yearFounded: insertBroker.yearFounded || null,
      regulationSummary: insertBroker.regulationSummary || null,
      overallRating: 0,
      reviewCount: 0,
      scamReportCount: 0,
      isVerified: false,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.brokers.set(id, broker);
    return broker;
  }
  
  async getBroker(id: string): Promise<Broker | undefined> {
    return this.brokers.get(id);
  }
  
  async getBrokerBySlug(slug: string): Promise<Broker | undefined> {
    return Array.from(this.brokers.values()).find((b) => b.slug === slug);
  }
  
  async getAllBrokers(filters?: { isVerified?: boolean; status?: string }): Promise<Broker[]> {
    let brokerList = Array.from(this.brokers.values());
    
    if (filters?.isVerified !== undefined) {
      brokerList = brokerList.filter((b) => b.isVerified === filters.isVerified);
    }
    if (filters?.status) {
      brokerList = brokerList.filter((b) => b.status === filters.status);
    }
    
    return brokerList.sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0));
  }
  
  async createBrokerReview(insertReview: InsertBrokerReview): Promise<BrokerReview> {
    // Verify broker exists
    const broker = this.brokers.get(insertReview.brokerId);
    if (!broker) throw new Error("Broker not found");
    
    // Verify user exists
    const user = this.users.get(insertReview.userId);
    if (!user) throw new Error("User not found");
    
    const id = randomUUID();
    const review: BrokerReview = {
      id,
      brokerId: insertReview.brokerId,
      userId: insertReview.userId,
      rating: insertReview.rating,
      reviewTitle: insertReview.reviewTitle,
      reviewBody: insertReview.reviewBody,
      isScamReport: insertReview.isScamReport ?? false,
      status: "pending",
      datePosted: new Date(),
    };
    this.brokerReviews.set(id, review);
    return review;
  }
  
  async getBrokerReview(reviewId: string): Promise<BrokerReview | null> {
    return this.brokerReviews.get(reviewId) || null;
  }

  async getBrokerReviews(brokerId: string, filters?: { isScamReport?: boolean }): Promise<BrokerReview[]> {
    let reviews = Array.from(this.brokerReviews.values())
      .filter((r) => r.brokerId === brokerId && r.status === "approved");
    
    if (filters?.isScamReport !== undefined) {
      reviews = reviews.filter((r) => r.isScamReport === filters.isScamReport);
    }
    
    return reviews.sort((a, b) => b.datePosted.getTime() - a.datePosted.getTime());
  }

  async updateBrokerReviewStatus(reviewId: string, status: string): Promise<BrokerReview> {
    const review = this.brokerReviews.get(reviewId);
    if (!review) throw new Error('Review not found');
    const updatedReview = { ...review, status: status as "pending" | "approved" | "rejected" };
    this.brokerReviews.set(reviewId, updatedReview);
    return updatedReview;
  }
  
  async updateBrokerRating(brokerId: string): Promise<void> {
    const broker = this.brokers.get(brokerId);
    if (!broker) return;
    
    const reviews = await this.getBrokerReviews(brokerId);
    const scamReports = await this.getBrokerReviews(brokerId, { isScamReport: true });
    
    if (reviews.length === 0) {
      this.brokers.set(brokerId, { ...broker, overallRating: 0, reviewCount: 0, scamReportCount: scamReports.length });
      return;
    }
    
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = Math.round(totalRating / reviews.length);
    
    this.brokers.set(brokerId, {
      ...broker,
      overallRating: averageRating,
      reviewCount: reviews.length,
      scamReportCount: scamReports.length,
    });
  }
  
  async createForumThread(insertThread: InsertForumThread): Promise<ForumThread> {
    const user = this.users.get(insertThread.authorId);
    if (!user) throw new Error("User not found");
    
    const id = randomUUID();
    const focusKeyword = extractFocusKeyword(insertThread.title);
    const metaDescription = generateMetaDescription(insertThread.body);
    const baseSlug = generateThreadSlug(insertThread.title);
    const existingSlugs = new Set(Array.from(this.forumThreadsMap.values()).map(t => t.slug));
    const slug = generateUniqueSlug(baseSlug, existingSlugs);
    
    const thread: ForumThread = {
      id,
      authorId: insertThread.authorId,
      categorySlug: insertThread.categorySlug,
      title: insertThread.title,
      body: insertThread.body,
      slug,
      focusKeyword,
      metaDescription,
      isPinned: insertThread.isPinned || false,
      isLocked: insertThread.isLocked || false,
      views: 0,
      replyCount: 0,
      lastActivityAt: new Date(),
      status: "approved",
      engagementScore: 0,
      lastScoreUpdate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.forumThreadsMap.set(id, thread);
    
    await this.updateCategoryStats(insertThread.categorySlug);
    
    await this.createActivity({
      userId: insertThread.authorId,
      activityType: "thread_created",
      entityType: "thread",
      entityId: id,
      title: insertThread.title,
      description: metaDescription,
    });
    
    return thread;
  }
  
  async getForumThreadById(id: string): Promise<ForumThread | undefined> {
    return this.forumThreadsMap.get(id);
  }
  
  async getForumThreadBySlug(slug: string): Promise<ForumThread | undefined> {
    const thread = Array.from(this.forumThreadsMap.values()).find(t => t.slug === slug);
    if (thread) {
      this.forumThreadsMap.set(thread.id, { ...thread, views: thread.views + 1 });
    }
    return thread;
  }
  
  async listForumThreads(filters?: { categorySlug?: string; status?: string; isPinned?: boolean; limit?: number }): Promise<ForumThread[]> {
    let threads = Array.from(this.forumThreadsMap.values());
    
    if (filters?.categorySlug) {
      threads = threads.filter(t => t.categorySlug === filters.categorySlug);
    }
    if (filters?.status) {
      threads = threads.filter(t => t.status === filters.status);
    }
    if (filters?.isPinned !== undefined) {
      threads = threads.filter(t => t.isPinned === filters.isPinned);
    }
    
    threads.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.lastActivityAt.getTime() - a.lastActivityAt.getTime();
    });
    
    return filters?.limit ? threads.slice(0, filters.limit) : threads;
  }
  
  async updateForumThreadReplyCount(threadId: string, increment: number): Promise<void> {
    const thread = this.forumThreadsMap.get(threadId);
    if (thread) {
      this.forumThreadsMap.set(threadId, { 
        ...thread, 
        replyCount: thread.replyCount + increment 
      });
    }
  }
  
  async updateForumThreadActivity(threadId: string): Promise<void> {
    const thread = this.forumThreadsMap.get(threadId);
    if (thread) {
      this.forumThreadsMap.set(threadId, { 
        ...thread, 
        lastActivityAt: new Date() 
      });
    }
  }
  
  async createForumReply(insertReply: InsertForumReply): Promise<ForumReply> {
    const thread = this.forumThreadsMap.get(insertReply.threadId);
    if (!thread) throw new Error("Thread not found");
    
    const user = this.users.get(insertReply.userId);
    if (!user) throw new Error("User not found");
    
    if (insertReply.parentId) {
      const parent = this.forumRepliesMap.get(insertReply.parentId);
      if (!parent) throw new Error("Parent reply not found");
    }
    
    const id = randomUUID();
    const metaDescription = generateMetaDescription(insertReply.body);
    const slug = generateReplySlug(thread.title, user.username, id);
    
    const reply: ForumReply = {
      id,
      threadId: insertReply.threadId,
      userId: insertReply.userId,
      parentId: insertReply.parentId || null,
      body: insertReply.body,
      slug,
      metaDescription,
      imageUrls: insertReply.imageUrls || null,
      helpful: 0,
      isAccepted: false,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.forumRepliesMap.set(id, reply);
    
    await this.updateForumThreadReplyCount(insertReply.threadId, 1);
    await this.updateForumThreadActivity(insertReply.threadId);
    await this.updateCategoryStats(thread.categorySlug);
    
    await this.createActivity({
      userId: insertReply.userId,
      activityType: "reply_posted",
      entityType: "reply",
      entityId: id,
      title: `Reply to: ${thread.title}`,
      description: metaDescription,
    });
    
    return reply;
  }
  
  async listForumReplies(threadId: string): Promise<ForumReply[]> {
    return Array.from(this.forumRepliesMap.values())
      .filter(r => r.threadId === threadId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async markReplyAsAccepted(replyId: string): Promise<ForumReply | null> {
    const reply = this.forumRepliesMap.get(replyId);
    if (!reply) return null;
    
    const threadReplies = await this.listForumReplies(reply.threadId);
    threadReplies.forEach(r => {
      if (r.id !== replyId) {
        this.forumRepliesMap.set(r.id, { ...r, isAccepted: false });
      }
    });
    const updatedReply = { ...reply, isAccepted: true };
    this.forumRepliesMap.set(replyId, updatedReply);
    return updatedReply;
  }
  
  async markReplyAsHelpful(replyId: string): Promise<ForumReply | null> {
    const reply = this.forumRepliesMap.get(replyId);
    if (!reply) return null;
    
    const updatedReply = { ...reply, helpful: reply.helpful + 1 };
    this.forumRepliesMap.set(replyId, updatedReply);
    return updatedReply;
  }
  
  async listForumCategories(): Promise<ForumCategory[]> {
    return Array.from(this.forumCategoriesMap.values())
      .filter(c => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  
  async getForumCategoryBySlug(slug: string): Promise<ForumCategory | undefined> {
    return this.forumCategoriesMap.get(slug);
  }
  
  async updateCategoryStats(categorySlug: string): Promise<void> {
    const category = this.forumCategoriesMap.get(categorySlug);
    if (!category) return;
    
    const threads = Array.from(this.forumThreadsMap.values())
      .filter(t => t.categorySlug === categorySlug && t.status === "approved");
    
    let totalPosts = 0;
    threads.forEach(thread => {
      totalPosts += thread.replyCount;
    });
    
    this.forumCategoriesMap.set(categorySlug, {
      ...category,
      threadCount: threads.length,
      postCount: totalPosts + threads.length,
      updatedAt: new Date(),
    });
  }
  
  async createUserBadge(userId: string, badgeType: string): Promise<UserBadge> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    
    const hasBadge = await this.hasUserBadge(userId, badgeType);
    if (hasBadge) throw new Error("User already has this badge");
    
    const id = randomUUID();
    const badge: UserBadge = {
      id,
      userId,
      badgeType: badgeType as "verified_trader" | "top_contributor" | "ea_expert" | "helpful_member" | "early_adopter",
      awardedAt: new Date(),
    };
    
    this.userBadgesMap.set(id, badge);
    
    await this.createActivity({
      userId,
      activityType: "badge_earned",
      entityType: "badge",
      entityId: id,
      title: `Earned badge: ${badgeType.replace(/_/g, ' ')}`,
    });
    
    return badge;
  }
  
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return Array.from(this.userBadgesMap.values())
      .filter(b => b.userId === userId)
      .sort((a, b) => b.awardedAt.getTime() - a.awardedAt.getTime());
  }
  
  async hasUserBadge(userId: string, badgeType: string): Promise<boolean> {
    return Array.from(this.userBadgesMap.values()).some(
      b => b.userId === userId && b.badgeType === badgeType
    );
  }
  
  async createActivity(insertActivity: InsertActivityFeed): Promise<ActivityFeed> {
    const user = this.users.get(insertActivity.userId);
    if (!user) throw new Error("User not found");
    
    const id = randomUUID();
    const activity: ActivityFeed = {
      id,
      userId: insertActivity.userId,
      activityType: insertActivity.activityType as "thread_created" | "reply_posted" | "content_published" | "purchase_made" | "review_posted" | "badge_earned",
      entityType: insertActivity.entityType as "thread" | "reply" | "content" | "purchase" | "review" | "badge",
      entityId: insertActivity.entityId,
      title: insertActivity.title,
      description: insertActivity.description || null,
      createdAt: new Date(),
    };
    
    this.activityFeedMap.set(id, activity);
    return activity;
  }
  
  async getRecentActivity(limit = 50): Promise<ActivityFeed[]> {
    return Array.from(this.activityFeedMap.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  
  async getUserActivity(userId: string, limit = 50): Promise<ActivityFeed[]> {
    return Array.from(this.activityFeedMap.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  
  async getLeaderboard(type: "coins" | "contributions" | "uploads", limit = 10): Promise<User[]> {
    const usersList = Array.from(this.users.values());
    
    if (type === "coins") {
      return usersList
        .sort((a, b) => b.totalCoins - a.totalCoins)
        .slice(0, limit);
    }
    
    if (type === "contributions") {
      const userContributions = new Map<string, number>();
      usersList.forEach(u => userContributions.set(u.id, 0));
      
      Array.from(this.forumThreadsMap.values()).forEach(t => {
        userContributions.set(t.authorId, (userContributions.get(t.authorId) || 0) + 1);
      });
      Array.from(this.forumRepliesMap.values()).forEach(r => {
        userContributions.set(r.userId, (userContributions.get(r.userId) || 0) + 1);
      });
      
      return usersList
        .sort((a, b) => (userContributions.get(b.id) || 0) - (userContributions.get(a.id) || 0))
        .slice(0, limit);
    }
    
    if (type === "uploads") {
      const userUploads = new Map<string, number>();
      usersList.forEach(u => userUploads.set(u.id, 0));
      
      Array.from(this.content.values()).forEach(c => {
        userUploads.set(c.authorId, (userUploads.get(c.authorId) || 0) + 1);
      });
      
      return usersList
        .sort((a, b) => (userUploads.get(b.id) || 0) - (userUploads.get(a.id) || 0))
        .slice(0, limit);
    }
    
    return [];
  }

  async getTopUsersByCoins(limit: number) {
    const results = Array.from(this.users.values())
      .map(user => ({
        userId: user.id,
        username: user.username,
        balance: user.totalCoins,
        rank: 0,
      }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limit);

    return results.map((r, index) => ({ ...r, rank: index + 1 }));
  }

  async getTopContributors(limit: number) {
    const contributions = new Map<string, { helpfulCount: number; acceptedCount: number }>();
    
    this.forumRepliesMap.forEach(reply => {
      const current = contributions.get(reply.userId) || { helpfulCount: 0, acceptedCount: 0 };
      if (reply.helpful > 0) current.helpfulCount++;
      if (reply.isAccepted) current.acceptedCount++;
      contributions.set(reply.userId, current);
    });

    const results = Array.from(contributions.entries())
      .map(([userId, stats]) => {
        const user = this.users.get(userId);
        return {
          userId,
          username: user?.username || 'Unknown',
          helpfulCount: stats.helpfulCount,
          acceptedCount: stats.acceptedCount,
          totalContributions: stats.helpfulCount + stats.acceptedCount,
          rank: 0,
        };
      })
      .sort((a, b) => b.totalContributions - a.totalContributions)
      .slice(0, limit);

    return results.map((r, index) => ({ ...r, rank: index + 1 }));
  }

  async getTopSellers(limit: number) {
    const sales = new Map<string, { revenue: number; count: number }>();
    
    this.contentPurchases.forEach(purchase => {
      if (purchase.priceCoins > 0) {
        const current = sales.get(purchase.sellerId) || { revenue: 0, count: 0 };
        current.revenue += purchase.priceCoins;
        current.count++;
        sales.set(purchase.sellerId, current);
      }
    });

    const results = Array.from(sales.entries())
      .map(([userId, stats]) => {
        const user = this.users.get(userId);
        return {
          userId,
          username: user?.username || 'Unknown',
          totalRevenue: stats.revenue,
          salesCount: stats.count,
          rank: 0,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return results.map((r, index) => ({ ...r, rank: index + 1 }));
  }

  async createUserFollow(data: InsertUserFollow): Promise<UserFollow> {
    const id = randomUUID();
    const userFollow: UserFollow = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.userFollowsMap.set(id, userFollow);
    return userFollow;
  }

  async deleteUserFollow(followerId: string, followingId: string): Promise<void> {
    const followToDelete = Array.from(this.userFollowsMap.values()).find(
      (f) => f.followerId === followerId && f.followingId === followingId
    );
    if (followToDelete) {
      this.userFollowsMap.delete(followToDelete.id);
    }
  }

  async getUserFollowers(userId: string): Promise<User[]> {
    const followerIds = Array.from(this.userFollowsMap.values())
      .filter((f) => f.followingId === userId)
      .map((f) => f.followerId);
    
    return Array.from(this.users.values()).filter((u) => followerIds.includes(u.id));
  }

  async getUserFollowing(userId: string): Promise<User[]> {
    const followingIds = Array.from(this.userFollowsMap.values())
      .filter((f) => f.followerId === userId)
      .map((f) => f.followingId);
    
    return Array.from(this.users.values()).filter((u) => followingIds.includes(u.id));
  }

  async checkIfFollowing(followerId: string, followingId: string): Promise<boolean> {
    return Array.from(this.userFollowsMap.values()).some(
      (f) => f.followerId === followerId && f.followingId === followingId
    );
  }

  // Ledger System - Stubs (MemStorage does not support ledger operations)
  async createUserWallet(userId: string): Promise<UserWallet> {
    throw new Error("MemStorage does not support ledger operations");
  }

  async getUserWallet(userId: string): Promise<UserWallet | null> {
    throw new Error("MemStorage does not support ledger operations");
  }

  async beginLedgerTransaction(
    type: string,
    initiatorUserId: string,
    entries: Array<{
      userId: string;
      direction: 'debit' | 'credit';
      amount: number;
      memo: string;
    }>,
    context?: Record<string, any>,
    externalRef?: string
  ): Promise<CoinLedgerTransaction> {
    throw new Error("MemStorage does not support ledger operations");
  }

  async getLedgerTransactionHistory(userId: string, limit?: number): Promise<CoinJournalEntry[]> {
    throw new Error("MemStorage does not support ledger operations");
  }

  async reconcileWallets(): Promise<{driftCount: number; maxDelta: number}> {
    throw new Error("MemStorage does not support ledger operations");
  }

  async backfillOpeningBalances(): Promise<{created: number; skipped: number}> {
    throw new Error("MemStorage does not support ledger operations");
  }
  
  // Badge System
  async awardBadge(userId: string, badge: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;

    if (!user.badges) user.badges = [];
    if (!user.badges.includes(badge)) {
      user.badges.push(badge);
    }
  }

  async checkAndAwardBadges(userId: string): Promise<string[]> {
    const newBadges: string[] = [];
    const user = this.users.get(userId);
    if (!user) return newBadges;

    const userBadges = user.badges || [];

    // Check EA Master (5+ published EAs)
    const eaCount = Array.from(this.content.values())
      .filter(c => c.authorId === userId && c.type === 'ea').length;
    
    if (eaCount >= 5 && !userBadges.includes(BADGE_TYPES.EA_MASTER)) {
      await this.awardBadge(userId, BADGE_TYPES.EA_MASTER);
      newBadges.push(BADGE_TYPES.EA_MASTER);
    }

    // Check Helpful (50+ helpful replies)
    const helpfulCount = Array.from(this.forumRepliesMap.values())
      .filter(r => r.userId === userId && r.helpful > 0).length;
    
    if (helpfulCount >= 50 && !userBadges.includes(BADGE_TYPES.HELPFUL)) {
      await this.awardBadge(userId, BADGE_TYPES.HELPFUL);
      newBadges.push(BADGE_TYPES.HELPFUL);
    }

    // Check Top Contributor (top 10)
    const topContributors = await this.getTopContributors(10);
    const isTop = topContributors.some(c => c.userId === userId);
    
    if (isTop && !userBadges.includes(BADGE_TYPES.TOP_CONTRIBUTOR)) {
      await this.awardBadge(userId, BADGE_TYPES.TOP_CONTRIBUTOR);
      newBadges.push(BADGE_TYPES.TOP_CONTRIBUTOR);
    }

    return newBadges;
  }
  
  async getOnboardingProgress(userId: string) {
    const user = this.users.get(userId);
    if (!user) return null;

    return {
      completed: (user as any).onboardingCompleted || false,
      dismissed: (user as any).onboardingDismissed || false,
      progress: (user as any).onboardingProgress || {
        profileCreated: false,
        firstReply: false,
        firstReport: false,
        firstUpload: false,
        socialLinked: false,
      },
    };
  }

  async markOnboardingStep(userId: string, step: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;

    const current = await this.getOnboardingProgress(userId);
    if (!current || current.progress[step]) return;

    const coinRewards: Record<string, number> = {
      profileCreated: 10,
      firstReply: 15,
      firstReport: 20,
      firstUpload: 50,
      socialLinked: 30,
    };

    const coinsToAward = coinRewards[step] || 0;

    // Update progress
    const newProgress = { ...current.progress, [step]: true };
    (user as any).onboardingProgress = newProgress;
    // Mark complete when essential steps are done (socialLinked is optional/future feature)
    const essentialSteps = ['profileCreated', 'firstReply', 'firstReport', 'firstUpload'];
    const allEssentialComplete = essentialSteps.every(s => newProgress[s]);
    (user as any).onboardingCompleted = allEssentialComplete;

    // Award coins
    if (coinsToAward > 0) {
      user.totalCoins = (user.totalCoins || 0) + coinsToAward;
    }
  }

  async dismissOnboarding(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      (user as any).onboardingDismissed = true;
    }
  }

  // Ranking System (Stubs - MemStorage does not support ranking)
  async getAllForumThreads(): Promise<ForumThread[]> {
    return Array.from(this.forumThreadsMap.values());
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserStats(userId: string): Promise<{
    threadsCreated: number;
    repliesPosted: number;
    likesReceived: number;
    bestAnswers: number;
    contentSales: number;
    followersCount: number;
    uploadsCount: number;
  }> {
    const threadsCreated = Array.from(this.forumThreadsMap.values()).filter(t => t.authorId === userId).length;
    const repliesPosted = Array.from(this.forumRepliesMap.values()).filter(r => r.userId === userId).length;
    const uploadsCount = Array.from(this.content.values()).filter(c => c.authorId === userId).length;
    const contentSales = Array.from(this.contentPurchases.values()).filter(p => p.sellerId === userId).length;
    const followersCount = Array.from(this.userFollowsMap.values()).filter(f => f.followingId === userId).length;
    
    return {
      threadsCreated,
      repliesPosted,
      likesReceived: 0,
      bestAnswers: 0,
      contentSales,
      followersCount,
      uploadsCount,
    };
  }

  async getContentSalesStats(contentId: string): Promise<{
    totalSales: number;
    reviewCount: number;
    avgRating: number;
  }> {
    const sales = Array.from(this.contentPurchases.values()).filter(p => p.contentId === contentId);
    const reviews = Array.from(this.contentReviews.values()).filter(r => r.contentId === contentId);
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    
    return {
      totalSales: sales.length,
      reviewCount: reviews.length,
      avgRating: reviews.length > 0 ? totalRating / reviews.length : 0,
    };
  }

  async updateThreadScore(threadId: string, score: number): Promise<void> {
    const thread = this.forumThreadsMap.get(threadId);
    if (thread) {
      (thread as any).engagementScore = score;
      (thread as any).lastScoreUpdate = new Date();
    }
  }

  async updateUserReputation(userId: string, reputation: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      (user as any).reputationScore = reputation;
      (user as any).lastReputationUpdate = new Date();
    }
  }

  async updateContentSalesScore(contentId: string, score: number): Promise<void> {
    const item = this.content.get(contentId);
    if (item) {
      (item as any).salesScore = score;
      (item as any).lastSalesUpdate = new Date();
    }
  }

  // Messaging System (Stubs - MemStorage does not support messaging)
  async sendMessage(senderId: string, recipientId: string, body: string): Promise<any> {
    throw new Error("MemStorage does not support messaging operations");
  }

  async getConversations(userId: string): Promise<Array<{
    id: string;
    participant: User;
    lastMessage: {
      text: string;
      timestamp: Date;
      isRead: boolean;
      isSentByMe: boolean;
    };
    unreadCount: number;
  }>> {
    throw new Error("MemStorage does not support messaging operations");
  }

  async getConversationMessages(conversationId: string, userId: string): Promise<Array<{
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
    isRead: boolean;
  }>> {
    throw new Error("MemStorage does not support messaging operations");
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    throw new Error("MemStorage does not support messaging operations");
  }

  // Dashboard Preferences (Stubs - MemStorage does not support dashboard preferences)
  async getDashboardPreferences(userId: string): Promise<DashboardPreferences | null> {
    throw new Error("MemStorage does not support dashboard preferences");
  }

  async saveDashboardPreferences(userId: string, preferences: InsertDashboardPreferences): Promise<DashboardPreferences> {
    throw new Error("MemStorage does not support dashboard preferences");
  }

  // Withdrawal System (Stubs - MemStorage does not support withdrawals)
  async createWithdrawalRequest(userId: string, data: Omit<InsertWithdrawalRequest, 'userId'>): Promise<WithdrawalRequest> {
    throw new Error("MemStorage does not support withdrawal operations");
  }

  async getUserWithdrawals(userId: string): Promise<WithdrawalRequest[]> {
    throw new Error("MemStorage does not support withdrawal operations");
  }

  async getWithdrawalById(withdrawalId: string, userId: string): Promise<WithdrawalRequest | null> {
    throw new Error("MemStorage does not support withdrawal operations");
  }

  async cancelWithdrawalRequest(withdrawalId: string, userId: string): Promise<WithdrawalRequest | null> {
    throw new Error("MemStorage does not support withdrawal operations");
  }

  // Notification System (Stubs - MemStorage does not support notifications)
  async createNotification(notification: InsertNotification): Promise<Notification> {
    throw new Error("MemStorage does not support notification operations");
  }

  async getUserNotifications(userId: string, limit?: number): Promise<Notification[]> {
    throw new Error("MemStorage does not support notification operations");
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    throw new Error("MemStorage does not support notification operations");
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    throw new Error("MemStorage does not support notification operations");
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    throw new Error("MemStorage does not support notification operations");
  }

  // Earnings Summary (Stubs - MemStorage does not support earnings summary)
  async getUserEarningsSummary(userId: string): Promise<{
    totalEarned: number;
    weeklyEarned: number;
    breakdown: Array<{
      source: string;
      amount: number;
      percentage: number;
    }>;
  }> {
    throw new Error("MemStorage does not support earnings summary operations");
  }
}

export class DrizzleStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser | UpsertUser): Promise<User> {
    // Determine if this is OIDC or traditional auth
    const isOIDC = 'email' in insertUser && insertUser.email !== undefined;
    
    const values = isOIDC 
      ? {
          // OIDC user
          id: (insertUser as UpsertUser).id,
          username: (insertUser as UpsertUser).email || 'user',
          email: (insertUser as UpsertUser).email,
          firstName: (insertUser as UpsertUser).firstName,
          lastName: (insertUser as UpsertUser).lastName,
          profileImageUrl: (insertUser as UpsertUser).profileImageUrl,
        }
      : {
          // Traditional user
          username: (insertUser as InsertUser).username,
          password: (insertUser as InsertUser).password,
          email: (insertUser as InsertUser).email || null,
          firstName: (insertUser as InsertUser).firstName || null,
          lastName: (insertUser as InsertUser).lastName || null,
          profileImageUrl: (insertUser as InsertUser).profileImageUrl || null,
        };
    
    const [user] = await db.insert(users).values(values).returning();
    return user;
  }

  async upsertUser(upsertUser: UpsertUser): Promise<User> {
    if (!upsertUser.id) {
      throw new Error("UpsertUser must have an id");
    }
    
    const existingUser = await this.getUser(upsertUser.id);
    
    if (existingUser) {
      // Update existing user (don't change username to avoid conflicts)
      const [updatedUser] = await db
        .update(users)
        .set({
          email: upsertUser.email ?? existingUser.email,
          firstName: upsertUser.firstName ?? existingUser.firstName,
          lastName: upsertUser.lastName ?? existingUser.lastName,
          profileImageUrl: upsertUser.profileImageUrl ?? existingUser.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, upsertUser.id))
        .returning();
      return updatedUser;
    } else {
      // Create new user with collision-safe username
      let username = upsertUser.username || 'user';
      let attempt = 0;
      let finalUsername = username;
      
      // Check for username collisions and append suffix if needed
      while (await this.getUserByUsername(finalUsername)) {
        attempt++;
        finalUsername = `${username}_${attempt}`;
        if (attempt > 100) {
          // Fallback to UUID-based username to guarantee uniqueness
          finalUsername = `user_${upsertUser.id.substring(0, 8)}`;
          break;
        }
      }
      
      return this.createUser({
        ...upsertUser,
        username: finalUsername,
      });
    }
  }

  async updateUserCoins(userId: string, coins: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ totalCoins: sql`${users.totalCoins} + ${coins}` })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserProfile(userId: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async trackOnboardingProgress(userId: string, task: string): Promise<{ completed: boolean; coinsEarned: number }> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const progress = (user.onboardingProgress as any) || {
      profileCreated: false,
      firstReply: false,
      firstReport: false,
      firstUpload: false,
      socialLinked: false,
    };

    const taskMapping: Record<string, { key: string; reward: number }> = {
      profileCreated: { key: "profileCreated", reward: 10 },
      firstReply: { key: "firstReply", reward: 15 },
      firstReport: { key: "firstReport", reward: 20 },
      firstUpload: { key: "firstUpload", reward: 50 },
      socialLinked: { key: "socialLinked", reward: 30 },
    };

    const taskInfo = taskMapping[task];
    if (!taskInfo) {
      return { completed: false, coinsEarned: 0 };
    }

    if (progress[taskInfo.key]) {
      return { completed: true, coinsEarned: 0 };
    }

    progress[taskInfo.key] = true;
    const allCompleted = Object.values(progress).every((v) => v === true);

    // Update onboarding progress (coins will be updated by createCoinTransaction)
    await db
      .update(users)
      .set({
        onboardingProgress: progress,
        onboardingCompleted: allCompleted,
      })
      .where(eq(users.id, userId));

    // Award coins through transaction system (this updates totalCoins)
    await this.createCoinTransaction({
      userId,
      type: "earn",
      amount: taskInfo.reward,
      description: `Onboarding reward: ${task}`,
      status: "completed",
    });

    return { completed: true, coinsEarned: taskInfo.reward };
  }

  async createCoinTransaction(insertTransaction: InsertCoinTransaction): Promise<CoinTransaction> {
    const user = await this.getUser(insertTransaction.userId);
    if (!user) throw new Error("User not found");

    const balanceChange = insertTransaction.type === "spend" 
      ? -Math.abs(insertTransaction.amount) 
      : Math.abs(insertTransaction.amount);

    if (user.totalCoins + balanceChange < 0) {
      throw new Error("Insufficient coins");
    }

    const [transaction] = await db.insert(coinTransactions).values({
      userId: insertTransaction.userId,
      type: insertTransaction.type as "earn" | "spend" | "recharge",
      amount: Math.abs(insertTransaction.amount),
      description: insertTransaction.description,
      status: (insertTransaction.status || "completed") as "completed" | "pending" | "failed",
    }).returning();

    await db
      .update(users)
      .set({ 
        totalCoins: sql`${users.totalCoins} + ${balanceChange}`,
        weeklyEarned: insertTransaction.type === "earn" || insertTransaction.type === "recharge"
          ? sql`${users.weeklyEarned} + ${Math.abs(insertTransaction.amount)}`
          : users.weeklyEarned
      })
      .where(eq(users.id, insertTransaction.userId));

    await this.recalculateRanks();

    return transaction;
  }

  async getUserTransactions(userId: string, limit = 20): Promise<CoinTransaction[]> {
    return await db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.userId, userId))
      .orderBy(desc(coinTransactions.createdAt))
      .limit(limit);
  }

  async createRechargeOrder(insertOrder: InsertRechargeOrder): Promise<RechargeOrder> {
    const [order] = await db.insert(rechargeOrders).values({
      userId: insertOrder.userId,
      coinAmount: insertOrder.coinAmount,
      priceUsd: insertOrder.priceUsd,
      paymentMethod: insertOrder.paymentMethod as "stripe" | "crypto",
      paymentId: insertOrder.paymentId,
      status: (insertOrder.status || "pending") as "pending" | "completed" | "failed",
    }).returning();
    return order;
  }

  async getRechargeOrder(id: string): Promise<RechargeOrder | undefined> {
    const [order] = await db.select().from(rechargeOrders).where(eq(rechargeOrders.id, id));
    return order;
  }

  async updateRechargeOrderStatus(
    id: string,
    status: "completed" | "failed",
    paymentId?: string
  ): Promise<RechargeOrder | undefined> {
    const [order] = await db
      .update(rechargeOrders)
      .set({
        status,
        paymentId: paymentId || sql`${rechargeOrders.paymentId}`,
        completedAt: status === "completed" ? new Date() : null,
      })
      .where(eq(rechargeOrders.id, id))
      .returning();

    if (!order) return undefined;

    if (status === "completed") {
      await this.createCoinTransaction({
        userId: order.userId,
        type: "recharge",
        amount: order.coinAmount,
        description: `Coin recharge via ${order.paymentMethod}`,
        status: "completed",
      });
    }

    return order;
  }

  private async recalculateRanks(): Promise<void> {
    const allUsers = await db.select().from(users).orderBy(desc(users.totalCoins));
    
    for (let i = 0; i < allUsers.length; i++) {
      await db
        .update(users)
        .set({ rank: i + 1 })
        .where(eq(users.id, allUsers[i].id));
    }
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const seo = applySEOAutomations({
      title: insertContent.title,
      description: insertContent.description,
      imageUrls: insertContent.imageUrls || [],
    });

    const existingContent = await db.select({ slug: content.slug }).from(content);
    const existingSlugs = new Set(existingContent.map((c) => c.slug));
    const uniqueSlug = generateUniqueSlug(seo.slug, existingSlugs);

    const [newContent] = await db.insert(content).values({
      authorId: insertContent.authorId,
      type: insertContent.type as "ea" | "indicator" | "article" | "source_code",
      title: insertContent.title,
      description: insertContent.description,
      priceCoins: insertContent.priceCoins,
      isFree: insertContent.isFree ?? (insertContent.priceCoins === 0),
      category: insertContent.category,
      fileUrl: insertContent.fileUrl || null,
      imageUrl: insertContent.imageUrl || null,
      imageUrls: insertContent.imageUrls || null,
      postLogoUrl: insertContent.postLogoUrl || null,
      slug: uniqueSlug,
      focusKeyword: seo.focusKeyword,
      autoMetaDescription: seo.autoMetaDescription,
      autoImageAltTexts: seo.autoImageAltTexts,
    }).returning();

    return newContent;
  }

  async getContent(id: string): Promise<Content | undefined> {
    const [item] = await db.select().from(content).where(eq(content.id, id));
    return item;
  }

  async getContentBySlug(slug: string): Promise<Content | undefined> {
    const [item] = await db.select().from(content).where(eq(content.slug, slug));
    return item;
  }

  async getAllContent(filters?: { type?: string; category?: string; status?: string }): Promise<Content[]> {
    let query = db.select().from(content);
    
    const conditions = [];
    if (filters?.type) conditions.push(eq(content.type, filters.type as any));
    if (filters?.category) conditions.push(eq(content.category, filters.category));
    if (filters?.status) conditions.push(eq(content.status, filters.status as any));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(content.createdAt));
  }

  async getUserContent(userId: string): Promise<Content[]> {
    return await db
      .select()
      .from(content)
      .where(eq(content.authorId, userId))
      .orderBy(desc(content.createdAt));
  }

  async updateContentViews(contentId: string): Promise<void> {
    await db
      .update(content)
      .set({ views: sql`${content.views} + 1` })
      .where(eq(content.id, contentId));
  }

  async updateContentDownloads(contentId: string): Promise<void> {
    await db
      .update(content)
      .set({ downloads: sql`${content.downloads} + 1` })
      .where(eq(content.id, contentId));
  }

  async purchaseContent(contentId: string, buyerId: string): Promise<ContentPurchase> {
    return await db.transaction(async (tx) => {
      // 1. Get content details
      const contentList = await tx.select().from(content).where(eq(content.id, contentId));
      if (contentList.length === 0) throw new Error('Content not found');
      const item = contentList[0];

      // 2. Prevent self-purchase
      if (buyerId === item.authorId) {
        throw new Error('Cannot purchase own content');
      }

      // 3. Check if already purchased
      const alreadyPurchased = await this.hasPurchased(buyerId, contentId);
      if (alreadyPurchased) throw new Error('Already purchased');

      // 4. Handle free content without ledger transaction
      if (item.isFree || item.priceCoins === 0) {
        // Create a zero-value transaction for free content
        const [txRecord] = await tx.insert(coinTransactions).values({
          userId: buyerId,
          type: 'spend',
          amount: 0,
          description: `Free download: ${item.title}`,
          status: 'completed',
        }).returning();

        const [purchase] = await tx.insert(contentPurchases).values({
          contentId,
          buyerId,
          sellerId: item.authorId,
          priceCoins: 0,
          transactionId: txRecord.id,
        }).returning();

        // Update download counter
        await tx.update(content)
          .set({ downloads: sql`${content.downloads} + 1` })
          .where(eq(content.id, contentId));

        return purchase;
      }

      // 5. Get buyer wallet for balance check
      const buyerWallet = await this.getUserWallet(buyerId);
      if (!buyerWallet) throw new Error('Buyer wallet not found');

      // 6. Validate balance
      if (buyerWallet.balance < item.priceCoins) {
        throw new Error(`Insufficient balance. Need ${item.priceCoins} coins, have ${buyerWallet.balance}`);
      }

      // 7. Calculate amounts (90% to seller, 10% to platform)
      const sellerAmount = Math.floor(item.priceCoins * 0.9);
      const platformAmount = item.priceCoins - sellerAmount;

      // 8. Create balanced ledger transaction
      await this.beginLedgerTransaction(
        'purchase',
        buyerId,
        [
          {
            userId: buyerId,
            direction: 'debit',
            amount: item.priceCoins,
            memo: `Purchased: ${item.title}`,
          },
          {
            userId: item.authorId,
            direction: 'credit',
            amount: sellerAmount,
            memo: `Sale: ${item.title} (90% of ${item.priceCoins})`,
          },
          {
            userId: 'system',
            direction: 'credit',
            amount: platformAmount,
            memo: `Platform commission: ${item.title} (10%)`,
          },
        ],
        { contentId, buyerId, sellerId: item.authorId, price: item.priceCoins }
      );

      // 9. Create transaction record and purchase record
      const [txRecord] = await tx.insert(coinTransactions).values({
        userId: buyerId,
        type: 'spend',
        amount: item.priceCoins,
        description: `Purchased: ${item.title}`,
        status: 'completed',
      }).returning();

      const [purchase] = await tx.insert(contentPurchases).values({
        contentId,
        buyerId,
        sellerId: item.authorId,
        priceCoins: item.priceCoins,
        transactionId: txRecord.id,
      }).returning();

      // 10. Update download counter
      await tx.update(content)
        .set({ downloads: sql`${content.downloads} + 1` })
        .where(eq(content.id, contentId));

      return purchase;
    });
  }

  async getUserPurchases(userId: string): Promise<ContentPurchase[]> {
    return await db
      .select()
      .from(contentPurchases)
      .where(eq(contentPurchases.buyerId, userId))
      .orderBy(desc(contentPurchases.purchasedAt));
  }

  async hasPurchased(userId: string, contentId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(contentPurchases)
      .where(and(
        eq(contentPurchases.buyerId, userId),
        eq(contentPurchases.contentId, contentId)
      ))
      .limit(1);
    return !!result;
  }

  async createReview(insertReview: InsertContentReview): Promise<ContentReview> {
    const item = await this.getContent(insertReview.contentId);
    if (!item) throw new Error("Content not found");

    const user = await this.getUser(insertReview.userId);
    if (!user) throw new Error("User not found");

    const [review] = await db.insert(contentReviews).values(insertReview).returning();
    return review;
  }

  async getContentReviews(contentId: string): Promise<ContentReview[]> {
    return await db
      .select()
      .from(contentReviews)
      .where(and(
        eq(contentReviews.contentId, contentId),
        eq(contentReviews.status, "approved")
      ))
      .orderBy(desc(contentReviews.createdAt));
  }

  async likeContent(insertLike: InsertContentLike): Promise<ContentLike | null> {
    // Validate before transaction
    const item = await this.getContent(insertLike.contentId);
    if (!item) throw new Error("Content not found");

    const user = await this.getUser(insertLike.userId);
    if (!user) throw new Error("User not found");

    const alreadyLiked = await this.hasLiked(insertLike.userId, insertLike.contentId);
    if (alreadyLiked) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLikes = await db
      .select()
      .from(contentLikes)
      .where(and(
        eq(contentLikes.userId, insertLike.userId),
        sql`${contentLikes.createdAt} >= ${today}`
      ));

    if (todayLikes.length >= 5) {
      throw new Error("Daily like limit reached (5 per day)");
    }

    // Use transaction for atomic multi-step operation
    return await db.transaction(async (tx) => {
      // 1. Create like record
      const [like] = await tx.insert(contentLikes).values(insertLike).returning();

      // 2. Update content likes counter
      await tx.update(content)
        .set({ likes: sql`${content.likes} + 1` })
        .where(eq(content.id, insertLike.contentId));

      // 3. Create coin transaction for reward
      await tx.insert(coinTransactions).values({
        userId: insertLike.userId,
        type: "earn",
        amount: 1,
        description: `Liked: ${item.title}`,
        status: "completed",
      });

      // 4. Update user coins
      await tx.update(users)
        .set({ 
          totalCoins: sql`${users.totalCoins} + 1`,
          weeklyEarned: sql`${users.weeklyEarned} + 1`
        })
        .where(eq(users.id, insertLike.userId));

      return like;
    });
  }

  async hasLiked(userId: string, contentId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(contentLikes)
      .where(and(
        eq(contentLikes.userId, userId),
        eq(contentLikes.contentId, contentId)
      ))
      .limit(1);
    return !!result;
  }

  async createReply(insertReply: InsertContentReply): Promise<ContentReply> {
    const item = await this.getContent(insertReply.contentId);
    if (!item) throw new Error("Content not found");

    const user = await this.getUser(insertReply.userId);
    if (!user) throw new Error("User not found");

    if (insertReply.parentId) {
      const [parent] = await db.select().from(contentReplies).where(eq(contentReplies.id, insertReply.parentId));
      if (!parent) throw new Error("Parent reply not found");
    }

    const [reply] = await db.insert(contentReplies).values(insertReply).returning();
    return reply;
  }

  async getContentReplies(contentId: string): Promise<ContentReply[]> {
    return await db
      .select()
      .from(contentReplies)
      .where(eq(contentReplies.contentId, contentId))
      .orderBy(contentReplies.createdAt);
  }

  async updateReplyHelpful(replyId: string): Promise<void> {
    await db
      .update(contentReplies)
      .set({ helpful: sql`${contentReplies.helpful} + 1` })
      .where(eq(contentReplies.id, replyId));
  }

  async createBroker(insertBroker: InsertBroker): Promise<Broker> {
    const [broker] = await db.insert(brokers).values(insertBroker).returning();
    return broker;
  }

  async getBroker(id: string): Promise<Broker | undefined> {
    const [broker] = await db.select().from(brokers).where(eq(brokers.id, id));
    return broker;
  }

  async getBrokerBySlug(slug: string): Promise<Broker | undefined> {
    const [broker] = await db.select().from(brokers).where(eq(brokers.slug, slug));
    return broker;
  }

  async getAllBrokers(filters?: { isVerified?: boolean; status?: string }): Promise<Broker[]> {
    let query = db.select().from(brokers);
    
    const conditions = [];
    if (filters?.isVerified !== undefined) conditions.push(eq(brokers.isVerified, filters.isVerified));
    if (filters?.status) conditions.push(eq(brokers.status, filters.status as any));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(brokers.overallRating));
  }

  async createBrokerReview(insertReview: InsertBrokerReview): Promise<BrokerReview> {
    const broker = await this.getBroker(insertReview.brokerId);
    if (!broker) throw new Error("Broker not found");

    const user = await this.getUser(insertReview.userId);
    if (!user) throw new Error("User not found");

    const [review] = await db.insert(brokerReviews).values(insertReview).returning();
    return review;
  }

  async getBrokerReview(reviewId: string): Promise<BrokerReview | null> {
    const reviews = await db.select().from(brokerReviews).where(eq(brokerReviews.id, reviewId));
    return reviews[0] || null;
  }

  async getBrokerReviews(brokerId: string, filters?: { isScamReport?: boolean }): Promise<BrokerReview[]> {
    const conditions = [
      eq(brokerReviews.brokerId, brokerId),
      eq(brokerReviews.status, "approved")
    ];
    
    if (filters?.isScamReport !== undefined) {
      conditions.push(eq(brokerReviews.isScamReport, filters.isScamReport));
    }
    
    return await db
      .select()
      .from(brokerReviews)
      .where(and(...conditions))
      .orderBy(desc(brokerReviews.datePosted));
  }

  async updateBrokerReviewStatus(reviewId: string, status: string): Promise<BrokerReview> {
    const [updated] = await db.update(brokerReviews)
      .set({ status: status as "pending" | "approved" | "rejected" })
      .where(eq(brokerReviews.id, reviewId))
      .returning();
    if (!updated) throw new Error('Review not found');
    return updated;
  }

  async updateBrokerRating(brokerId: string): Promise<void> {
    const broker = await this.getBroker(brokerId);
    if (!broker) return;

    const reviews = await this.getBrokerReviews(brokerId);
    const scamReports = await this.getBrokerReviews(brokerId, { isScamReport: true });

    if (reviews.length === 0) {
      await db
        .update(brokers)
        .set({ 
          overallRating: 0, 
          reviewCount: 0, 
          scamReportCount: scamReports.length 
        })
        .where(eq(brokers.id, brokerId));
      return;
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = Math.round(totalRating / reviews.length);

    await db
      .update(brokers)
      .set({
        overallRating: averageRating,
        reviewCount: reviews.length,
        scamReportCount: scamReports.length,
      })
      .where(eq(brokers.id, brokerId));
  }
  
  async createForumThread(insertThread: InsertForumThread): Promise<ForumThread> {
    const user = await this.getUser(insertThread.authorId);
    if (!user) throw new Error("User not found");
    
    // Note: Slug, focusKeyword, metaDescription are now passed from routes.ts
    // This method just stores whatever is provided
    const [thread] = await db.insert(forumThreads).values({
      ...insertThread,
      // Ensure defaults for optional fields
      isPinned: insertThread.isPinned || false,
      isLocked: insertThread.isLocked || false,
      isSolved: insertThread.isSolved || false,
      engagementScore: insertThread.engagementScore || 0,
      status: "approved" as const,
    }).returning();
    
    await this.updateCategoryStats(insertThread.categorySlug);
    
    await this.createActivity({
      userId: insertThread.authorId,
      activityType: "thread_created",
      entityType: "thread",
      entityId: thread.id,
      title: insertThread.title,
      description: thread.metaDescription || insertThread.body.substring(0, 200),
    });
    
    return thread;
  }
  
  async getForumThreadById(id: string): Promise<ForumThread | undefined> {
    const [thread] = await db.select().from(forumThreads).where(eq(forumThreads.id, id));
    return thread;
  }
  
  async getForumThreadBySlug(slug: string): Promise<ForumThread | undefined> {
    const [thread] = await db.select().from(forumThreads).where(eq(forumThreads.slug, slug));
    
    if (thread) {
      await db
        .update(forumThreads)
        .set({ views: sql`${forumThreads.views} + 1` })
        .where(eq(forumThreads.id, thread.id));
    }
    
    return thread;
  }
  
  async listForumThreads(filters?: { categorySlug?: string; status?: string; isPinned?: boolean; limit?: number }): Promise<ForumThread[]> {
    let query = db.select().from(forumThreads);
    
    const conditions = [];
    if (filters?.categorySlug) conditions.push(eq(forumThreads.categorySlug, filters.categorySlug));
    if (filters?.status) conditions.push(eq(forumThreads.status, filters.status as any));
    if (filters?.isPinned !== undefined) conditions.push(eq(forumThreads.isPinned, filters.isPinned));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const threads = await query.orderBy(
      desc(forumThreads.isPinned),
      desc(forumThreads.lastActivityAt)
    );
    
    return filters?.limit ? threads.slice(0, filters.limit) : threads;
  }
  
  async updateForumThreadReplyCount(threadId: string, increment: number): Promise<void> {
    await db
      .update(forumThreads)
      .set({ 
        replyCount: sql`${forumThreads.replyCount} + ${increment}` 
      })
      .where(eq(forumThreads.id, threadId));
  }
  
  async updateForumThreadActivity(threadId: string): Promise<void> {
    await db
      .update(forumThreads)
      .set({ lastActivityAt: sql`NOW()` })
      .where(eq(forumThreads.id, threadId));
  }
  
  async createForumReply(insertReply: InsertForumReply): Promise<ForumReply> {
    // Validate before transaction
    const thread = await this.getForumThreadById(insertReply.threadId);
    if (!thread) throw new Error("Thread not found");
    
    const user = await this.getUser(insertReply.userId);
    if (!user) throw new Error("User not found");
    
    if (insertReply.parentId) {
      const [parent] = await db.select().from(forumReplies).where(eq(forumReplies.id, insertReply.parentId));
      if (!parent) throw new Error("Parent reply not found");
    }
    
    const metaDescription = generateMetaDescription(insertReply.body);
    const tempId = randomUUID();
    const slug = generateReplySlug(thread.title, user.username, tempId);
    
    // Use transaction for atomic multi-step operation
    return await db.transaction(async (tx) => {
      // 1. Create reply record
      const [reply] = await tx.insert(forumReplies).values({
        threadId: insertReply.threadId,
        userId: insertReply.userId,
        parentId: insertReply.parentId || null,
        body: insertReply.body,
        slug,
        metaDescription,
        imageUrls: insertReply.imageUrls || null,
      }).returning();
      
      // 2. Update thread reply count and activity
      await tx.update(forumThreads)
        .set({ 
          replyCount: sql`${forumThreads.replyCount} + 1`,
          lastActivityAt: new Date()
        })
        .where(eq(forumThreads.id, insertReply.threadId));
      
      // 3. Update category stats
      const category = await tx.select().from(forumCategories).where(eq(forumCategories.slug, thread.categorySlug));
      if (category.length > 0) {
        await tx.update(forumCategories)
          .set({ 
            postCount: sql`${forumCategories.postCount} + 1`,
            updatedAt: new Date()
          })
          .where(eq(forumCategories.slug, thread.categorySlug));
      }
      
      // 4. Create activity record
      await tx.insert(activityFeed).values({
        userId: insertReply.userId,
        activityType: "reply_posted",
        entityType: "reply",
        entityId: reply.id,
        title: `Reply to: ${thread.title}`,
        description: metaDescription,
      });
      
      return reply;
    });
  }
  
  async listForumReplies(threadId: string): Promise<ForumReply[]> {
    return await db
      .select()
      .from(forumReplies)
      .where(eq(forumReplies.threadId, threadId))
      .orderBy(forumReplies.createdAt);
  }
  
  async markReplyAsAccepted(replyId: string): Promise<ForumReply | null> {
    const [reply] = await db.select().from(forumReplies).where(eq(forumReplies.id, replyId));
    if (!reply) return null;
    
    await db
      .update(forumReplies)
      .set({ isAccepted: false })
      .where(eq(forumReplies.threadId, reply.threadId));
    
    await db
      .update(forumReplies)
      .set({ isAccepted: true })
      .where(eq(forumReplies.id, replyId));
    
    const [updatedReply] = await db.select().from(forumReplies).where(eq(forumReplies.id, replyId));
    return updatedReply || null;
  }
  
  async markReplyAsHelpful(replyId: string): Promise<ForumReply | null> {
    await db
      .update(forumReplies)
      .set({ helpful: sql`${forumReplies.helpful} + 1` })
      .where(eq(forumReplies.id, replyId));
    
    const [updatedReply] = await db.select().from(forumReplies).where(eq(forumReplies.id, replyId));
    return updatedReply || null;
  }
  
  async listForumCategories(): Promise<ForumCategory[]> {
    return await db
      .select()
      .from(forumCategories)
      .where(eq(forumCategories.isActive, true))
      .orderBy(forumCategories.sortOrder);
  }
  
  async getForumCategoryBySlug(slug: string): Promise<ForumCategory | undefined> {
    const [category] = await db.select().from(forumCategories).where(eq(forumCategories.slug, slug));
    return category;
  }
  
  async updateCategoryStats(categorySlug: string): Promise<void> {
    const category = await this.getForumCategoryBySlug(categorySlug);
    if (!category) return;
    
    const threads = await db
      .select()
      .from(forumThreads)
      .where(and(
        eq(forumThreads.categorySlug, categorySlug),
        eq(forumThreads.status, "approved")
      ));
    
    const threadCount = threads.length;
    const totalPosts = threads.reduce((sum, t) => sum + t.replyCount, 0);
    
    await db
      .update(forumCategories)
      .set({
        threadCount,
        postCount: totalPosts + threadCount,
        updatedAt: sql`NOW()`,
      })
      .where(eq(forumCategories.slug, categorySlug));
  }
  
  async createUserBadge(userId: string, badgeType: string): Promise<UserBadge> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const hasBadge = await this.hasUserBadge(userId, badgeType);
    if (hasBadge) throw new Error("User already has this badge");
    
    const [badge] = await db.insert(userBadges).values({
      userId,
      badgeType: badgeType as "verified_trader" | "top_contributor" | "ea_expert" | "helpful_member" | "early_adopter",
    }).returning();
    
    await this.createActivity({
      userId,
      activityType: "badge_earned",
      entityType: "badge",
      entityId: badge.id,
      title: `Earned badge: ${badgeType.replace(/_/g, ' ')}`,
    });
    
    return badge;
  }
  
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.awardedAt));
  }
  
  async hasUserBadge(userId: string, badgeType: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(userBadges)
      .where(and(
        eq(userBadges.userId, userId),
        eq(userBadges.badgeType, badgeType as any)
      ))
      .limit(1);
    return !!result;
  }
  
  async createActivity(insertActivity: InsertActivityFeed): Promise<ActivityFeed> {
    const user = await this.getUser(insertActivity.userId);
    if (!user) throw new Error("User not found");
    
    const [activity] = await db.insert(activityFeed).values({
      userId: insertActivity.userId,
      activityType: insertActivity.activityType as "thread_created" | "reply_posted" | "content_published" | "purchase_made" | "review_posted" | "badge_earned",
      entityType: insertActivity.entityType as "thread" | "reply" | "content" | "purchase" | "review" | "badge",
      entityId: insertActivity.entityId,
      title: insertActivity.title,
      description: insertActivity.description || null,
    }).returning();
    
    return activity;
  }
  
  async getRecentActivity(limit = 50): Promise<ActivityFeed[]> {
    return await db
      .select()
      .from(activityFeed)
      .orderBy(desc(activityFeed.createdAt))
      .limit(limit);
  }
  
  async getUserActivity(userId: string, limit = 50): Promise<ActivityFeed[]> {
    return await db
      .select()
      .from(activityFeed)
      .where(eq(activityFeed.userId, userId))
      .orderBy(desc(activityFeed.createdAt))
      .limit(limit);
  }
  
  async getLeaderboard(type: "coins" | "contributions" | "uploads", limit = 10): Promise<User[]> {
    if (type === "coins") {
      return await db
        .select()
        .from(users)
        .orderBy(desc(users.totalCoins))
        .limit(limit);
    }
    
    if (type === "contributions") {
      const allUsers = await db.select().from(users);
      const userContributions = new Map<string, number>();
      
      allUsers.forEach(u => userContributions.set(u.id, 0));
      
      const threads = await db.select().from(forumThreads);
      const replies = await db.select().from(forumReplies);
      
      threads.forEach(t => {
        userContributions.set(t.authorId, (userContributions.get(t.authorId) || 0) + 1);
      });
      replies.forEach(r => {
        userContributions.set(r.userId, (userContributions.get(r.userId) || 0) + 1);
      });
      
      return allUsers
        .sort((a, b) => (userContributions.get(b.id) || 0) - (userContributions.get(a.id) || 0))
        .slice(0, limit);
    }
    
    if (type === "uploads") {
      const allUsers = await db.select().from(users);
      const userUploads = new Map<string, number>();
      
      allUsers.forEach(u => userUploads.set(u.id, 0));
      
      const contents = await db.select().from(content);
      contents.forEach(c => {
        userUploads.set(c.authorId, (userUploads.get(c.authorId) || 0) + 1);
      });
      
      return allUsers
        .sort((a, b) => (userUploads.get(b.id) || 0) - (userUploads.get(a.id) || 0))
        .slice(0, limit);
    }
    
    return [];
  }

  async getTopUsersByCoins(limit: number) {
    const results = await db
      .select({
        userId: userWallet.userId,
        username: users.username,
        balance: userWallet.balance,
      })
      .from(userWallet)
      .innerJoin(users, eq(userWallet.userId, users.id))
      .orderBy(desc(userWallet.balance))
      .limit(limit);

    return results.map((r, index) => ({ ...r, rank: index + 1 }));
  }

  async getTopContributors(limit: number) {
    const results = await db
      .select({
        userId: forumReplies.userId,
        username: users.username,
        helpfulCount: sql<number>`count(case when ${forumReplies.helpful} > 0 then 1 end)`,
        acceptedCount: sql<number>`count(case when ${forumReplies.isAccepted} then 1 end)`,
      })
      .from(forumReplies)
      .innerJoin(users, eq(forumReplies.userId, users.id))
      .groupBy(forumReplies.userId, users.username)
      .orderBy(desc(sql`count(case when ${forumReplies.helpful} > 0 then 1 end) + count(case when ${forumReplies.isAccepted} then 1 end)`))
      .limit(limit);

    return results.map((r, index) => ({
      ...r,
      totalContributions: r.helpfulCount + r.acceptedCount,
      rank: index + 1,
    }));
  }

  async getTopSellers(limit: number) {
    const results = await db
      .select({
        userId: contentPurchases.sellerId,
        username: users.username,
        totalRevenue: sql<number>`sum(${contentPurchases.priceCoins})`,
        salesCount: sql<number>`count(*)`,
      })
      .from(contentPurchases)
      .innerJoin(users, eq(contentPurchases.sellerId, users.id))
      .where(gt(contentPurchases.priceCoins, 0))
      .groupBy(contentPurchases.sellerId, users.username)
      .orderBy(desc(sql`sum(${contentPurchases.priceCoins})`))
      .limit(limit);

    return results.map((r, index) => ({ ...r, rank: index + 1 }));
  }

  async createUserFollow(data: InsertUserFollow): Promise<UserFollow> {
    const [userFollow] = await db.insert(userFollows).values({
      followerId: data.followerId,
      followingId: data.followingId,
    }).returning();
    return userFollow;
  }

  async deleteUserFollow(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(userFollows)
      .where(
        and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followingId, followingId)
        )
      );
  }

  async getUserFollowers(userId: string): Promise<User[]> {
    const follows = await db
      .select()
      .from(userFollows)
      .where(eq(userFollows.followingId, userId));
    
    const followerIds = follows.map((f) => f.followerId);
    if (followerIds.length === 0) return [];
    
    return await db
      .select()
      .from(users)
      .where(sql`${users.id} IN ${followerIds}`);
  }

  async getUserFollowing(userId: string): Promise<User[]> {
    const follows = await db
      .select()
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));
    
    const followingIds = follows.map((f) => f.followingId);
    if (followingIds.length === 0) return [];
    
    return await db
      .select()
      .from(users)
      .where(sql`${users.id} IN ${followingIds}`);
  }

  async checkIfFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(userFollows)
      .where(
        and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followingId, followingId)
        )
      )
      .limit(1);
    
    return !!follow;
  }

  // Ledger System Implementation
  async createUserWallet(userId: string): Promise<UserWallet> {
    const walletId = randomUUID();
    const [wallet] = await db.insert(userWallet).values({
      walletId,
      userId,
      balance: 0,
      availableBalance: 0,
      status: 'active',
    }).returning();
    return wallet;
  }

  async getUserWallet(userId: string): Promise<UserWallet | null> {
    const wallets = await db.select().from(userWallet).where(eq(userWallet.userId, userId));
    
    if (wallets.length === 0) {
      // Auto-create wallet if doesn't exist
      return this.createUserWallet(userId);
    }
    
    return wallets[0];
  }

  async beginLedgerTransaction(
    type: string,
    initiatorUserId: string,
    entries: Array<{
      userId: string;
      direction: 'debit' | 'credit';
      amount: number;
      memo: string;
    }>,
    context?: Record<string, any>,
    externalRef?: string
  ): Promise<CoinLedgerTransaction> {
    return await db.transaction(async (tx) => {
      // Step 1: Create ledger transaction header
      const ledgerTxId = randomUUID();
      const [ledgerTx] = await tx.insert(coinLedgerTransactions).values({
        id: ledgerTxId,
        type,
        initiatorUserId,
        context: context || {},
        externalRef,
        status: 'pending',
      }).returning();

      // Step 2: Create journal entries
      for (const entry of entries) {
        // Get or create wallet
        let wallet = await tx.select().from(userWallet)
          .where(eq(userWallet.userId, entry.userId))
          .for('update'); // Lock wallet row

        if (wallet.length === 0) {
          // Create wallet if doesn't exist
          const walletId = randomUUID();
          await tx.insert(userWallet).values({
            walletId,
            userId: entry.userId,
            balance: 0,
            availableBalance: 0,
            status: 'active',
          });
          wallet = await tx.select().from(userWallet)
            .where(eq(userWallet.userId, entry.userId))
            .for('update');
        }

        const currentWallet = wallet[0];
        const balanceBefore = currentWallet.balance;
        
        // Calculate balance after
        const balanceAfter = entry.direction === 'credit'
          ? balanceBefore + entry.amount
          : balanceBefore - entry.amount;

        // Create journal entry (triggers will validate and update wallet)
        await tx.insert(coinJournalEntries).values({
          id: randomUUID(),
          ledgerTransactionId: ledgerTxId,
          walletId: currentWallet.walletId,
          direction: entry.direction,
          amount: entry.amount,
          balanceBefore,
          balanceAfter,
          memo: entry.memo,
        });
      }

      // Step 3: Close ledger transaction (triggers validate balance)
      const [closedTx] = await tx.update(coinLedgerTransactions)
        .set({ status: 'closed', closedAt: new Date() })
        .where(eq(coinLedgerTransactions.id, ledgerTxId))
        .returning();

      return closedTx;
    });
  }

  async getLedgerTransactionHistory(userId: string, limit = 50): Promise<CoinJournalEntry[]> {
    const wallet = await this.getUserWallet(userId);
    if (!wallet) return [];

    return await db.select()
      .from(coinJournalEntries)
      .where(eq(coinJournalEntries.walletId, wallet.walletId))
      .orderBy(desc(coinJournalEntries.createdAt))
      .limit(limit);
  }

  async reconcileWallets(): Promise<{driftCount: number; maxDelta: number}> {
    const wallets = await db.select().from(userWallet);
    let driftCount = 0;
    let maxDelta = 0;

    for (const wallet of wallets) {
      // Calculate balance from journal entries
      const entries = await db.select().from(coinJournalEntries)
        .where(eq(coinJournalEntries.walletId, wallet.walletId));

      const calculatedBalance = entries.reduce((sum, entry) => {
        return sum + (entry.direction === 'credit' ? entry.amount : -entry.amount);
      }, 0);

      const delta = Math.abs(wallet.balance - calculatedBalance);
      if (delta > 0) {
        driftCount++;
        maxDelta = Math.max(maxDelta, delta);
        
        // Log drift (could create correcting entry here)
        console.warn(`Wallet ${wallet.walletId} drift detected: ${delta} coins`);
      }
    }

    return { driftCount, maxDelta };
  }

  // Backfill opening balances (run once during migration)
  async backfillOpeningBalances(): Promise<{created: number; skipped: number}> {
    const allUsers = await db.select().from(users);
    let created = 0;
    let skipped = 0;

    for (const user of allUsers) {
      // Check if wallet exists
      const existingWallet = await db.select().from(userWallet)
        .where(eq(userWallet.userId, user.id));

      if (existingWallet.length > 0) {
        skipped++; // Already has wallet - skip to prevent duplicate credits
        continue;
      }

      // Check if already backfilled by looking for opening_balance transaction
      const existingOpening = await db.select().from(coinLedgerTransactions)
        .where(and(
          eq(coinLedgerTransactions.type, 'opening_balance'),
          eq(coinLedgerTransactions.initiatorUserId, user.id)
        ))
        .limit(1);

      if (existingOpening.length > 0) {
        skipped++; // Already backfilled
        continue;
      }

      // Create opening balance ledger transaction
      if (user.totalCoins > 0) {
        await this.beginLedgerTransaction(
          'opening_balance',
          user.id,
          [{
            userId: user.id,
            direction: 'credit',
            amount: user.totalCoins,
            memo: 'Opening balance migration from legacy coin system',
          }, {
            userId: 'system', // Platform account
            direction: 'debit',
            amount: user.totalCoins,
            memo: 'Opening balance migration offset',
          }],
          { migratedFrom: 'users.totalCoins' }
        );
        created++;
      } else {
        // Create empty wallet
        await this.createUserWallet(user.id);
        created++;
      }
    }

    return { created, skipped };
  }
  
  // Badge System
  private async hasBadge(userId: string, badge: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user?.badges?.includes(badge) || false;
  }

  async awardBadge(userId: string, badge: string): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return;

    const currentBadges = user.badges || [];
    if (currentBadges.includes(badge)) return;

    await db.update(users)
      .set({ badges: [...currentBadges, badge] })
      .where(eq(users.id, userId));
  }

  async checkAndAwardBadges(userId: string): Promise<string[]> {
    const newBadges: string[] = [];

    // Check EA Master (5+ published EAs)
    const publishedContent = await db.select({ count: sql<number>`count(*)` })
      .from(content)
      .where(and(eq(content.authorId, userId), eq(content.type, 'ea')));
    
    if (publishedContent[0].count >= 5) {
      const hadBadge = await this.hasBadge(userId, BADGE_TYPES.EA_MASTER);
      if (!hadBadge) {
        await this.awardBadge(userId, BADGE_TYPES.EA_MASTER);
        newBadges.push(BADGE_TYPES.EA_MASTER);
      }
    }

    // Check Helpful (50+ helpful replies)
    const helpfulReplies = await db.select({ count: sql<number>`count(*)` })
      .from(forumReplies)
      .where(and(eq(forumReplies.userId, userId), gt(forumReplies.helpful, 0)));
    
    if (helpfulReplies[0].count >= 50) {
      const hadBadge = await this.hasBadge(userId, BADGE_TYPES.HELPFUL);
      if (!hadBadge) {
        await this.awardBadge(userId, BADGE_TYPES.HELPFUL);
        newBadges.push(BADGE_TYPES.HELPFUL);
      }
    }

    // Check Top Contributor (top 10)
    const topContributors = await this.getTopContributors(10);
    const isTopContributor = topContributors.some(c => c.userId === userId);
    
    if (isTopContributor) {
      const hadBadge = await this.hasBadge(userId, BADGE_TYPES.TOP_CONTRIBUTOR);
      if (!hadBadge) {
        await this.awardBadge(userId, BADGE_TYPES.TOP_CONTRIBUTOR);
        newBadges.push(BADGE_TYPES.TOP_CONTRIBUTOR);
      }
    }

    return newBadges;
  }
  
  async getOnboardingProgress(userId: string) {
    const [user] = await db.select({
      completed: users.onboardingCompleted,
      dismissed: users.onboardingDismissed,
      progress: users.onboardingProgress,
    })
    .from(users)
    .where(eq(users.id, userId));

    if (!user) return null;

    return {
      completed: user.completed || false,
      dismissed: user.dismissed || false,
      progress: (user.progress as any) || {
        profileCreated: false,
        firstReply: false,
        firstReport: false,
        firstUpload: false,
        socialLinked: false,
      },
    };
  }

  async markOnboardingStep(userId: string, step: string): Promise<void> {
    // Get current progress
    const current = await this.getOnboardingProgress(userId);
    if (!current || current.progress[step]) return; // Already completed

    // Award coins based on step
    const coinRewards: Record<string, number> = {
      profileCreated: 10,
      firstReply: 15,
      firstReport: 20,
      firstUpload: 50,
      socialLinked: 30,
    };

    const coinsToAward = coinRewards[step] || 0;

    // Update progress
    const newProgress = { ...current.progress, [step]: true };
    
    // Mark complete when essential steps are done (socialLinked is optional/future feature)
    const allEssentialComplete = ['profileCreated', 'firstReply', 'firstReport', 'firstUpload'].every(s => newProgress[s]);
    
    await db.update(users)
      .set({ 
        onboardingProgress: newProgress,
        onboardingCompleted: allEssentialComplete,
      })
      .where(eq(users.id, userId));

    // Award coins if applicable
    if (coinsToAward > 0) {
      try {
        await this.beginLedgerTransaction(
          'earn',
          userId,
          [
            {
              userId,
              direction: 'credit',
              amount: coinsToAward,
              memo: `Onboarding: ${step} (+${coinsToAward} coins)`,
            },
            {
              userId: 'system',
              direction: 'debit',
              amount: coinsToAward,
              memo: 'Platform onboarding reward',
            },
          ],
          { onboardingStep: step }
        );
      } catch (error) {
        console.error('Failed to award onboarding coins:', error);
      }
    }
  }

  async dismissOnboarding(userId: string): Promise<void> {
    await db.update(users)
      .set({ onboardingDismissed: true })
      .where(eq(users.id, userId));
  }

  // Ranking System Methods
  async getAllForumThreads(): Promise<ForumThread[]> {
    return await db.select().from(forumThreads);
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserStats(userId: string): Promise<{
    threadsCreated: number;
    repliesPosted: number;
    likesReceived: number;
    bestAnswers: number;
    contentSales: number;
    followersCount: number;
    uploadsCount: number;
  }> {
    // Count threads created
    const threadsCount = await db.select({ count: count(forumThreads.id) })
      .from(forumThreads)
      .where(eq(forumThreads.authorId, userId));
    
    // Count replies posted
    const repliesCount = await db.select({ count: count(forumReplies.id) })
      .from(forumReplies)
      .where(eq(forumReplies.userId, userId));
    
    // Count content uploads
    const uploadsCount = await db.select({ count: count(content.id) })
      .from(content)
      .where(eq(content.authorId, userId));
    
    // Count content sales
    const salesCount = await db.select({ count: count(contentPurchases.id) })
      .from(contentPurchases)
      .where(eq(contentPurchases.sellerId, userId));
    
    // Count followers
    const followersCount = await db.select({ count: count(userFollows.id) })
      .from(userFollows)
      .where(eq(userFollows.followingId, userId));

    return {
      threadsCreated: threadsCount[0]?.count || 0,
      repliesPosted: repliesCount[0]?.count || 0,
      likesReceived: 0, // TODO: Implement likes tracking
      bestAnswers: 0, // TODO: Implement best answers tracking
      contentSales: salesCount[0]?.count || 0,
      followersCount: followersCount[0]?.count || 0,
      uploadsCount: uploadsCount[0]?.count || 0,
    };
  }

  async getContentSalesStats(contentId: string): Promise<{
    totalSales: number;
    reviewCount: number;
    avgRating: number;
  }> {
    // Count total purchases
    const salesCount = await db.select({ count: count() })
      .from(contentPurchases)
      .where(eq(contentPurchases.contentId, contentId));
    
    // Count reviews and calculate average rating
    const reviews = await db.select()
      .from(contentReviews)
      .where(eq(contentReviews.contentId, contentId));
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return {
      totalSales: salesCount[0]?.count || 0,
      reviewCount: reviews.length,
      avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
    };
  }

  async updateThreadScore(threadId: string, score: number): Promise<void> {
    await db.update(forumThreads)
      .set({ 
        engagementScore: score,
        lastScoreUpdate: new Date()
      })
      .where(eq(forumThreads.id, threadId));
  }

  async updateUserReputation(userId: string, reputation: number): Promise<void> {
    await db.update(users)
      .set({ 
        reputationScore: reputation,
        lastReputationUpdate: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateContentSalesScore(contentId: string, score: number): Promise<void> {
    await db.update(content)
      .set({ 
        salesScore: score,
        lastSalesUpdate: new Date()
      })
      .where(eq(content.id, contentId));
  }

  async sendMessage(senderId: string, recipientId: string, body: string): Promise<any> {
    const conversationResults = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(
            eq(conversations.participant1Id, senderId),
            eq(conversations.participant2Id, recipientId)
          ),
          and(
            eq(conversations.participant1Id, recipientId),
            eq(conversations.participant2Id, senderId)
          )
        )
      )
      .limit(1);

    let conversationId: string;

    if (conversationResults.length > 0) {
      conversationId = conversationResults[0].id;
      await db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, conversationId));
    } else {
      const newConversation = await db
        .insert(conversations)
        .values({
          participant1Id: senderId,
          participant2Id: recipientId,
        })
        .returning();
      conversationId = newConversation[0].id;
    }

    const newMessage = await db
      .insert(messages)
      .values({
        conversationId,
        senderId,
        recipientId,
        body,
      })
      .returning();

    return newMessage[0];
  }

  async getConversations(userId: string): Promise<Array<{
    id: string;
    participant: User;
    lastMessage: {
      text: string;
      timestamp: Date;
      isRead: boolean;
      isSentByMe: boolean;
    };
    unreadCount: number;
  }>> {
    const userConversations = await db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));

    const result = [];

    for (const conv of userConversations) {
      const otherUserId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
      const otherUser = await this.getUser(otherUserId);

      if (!otherUser) continue;

      const lastMessageResult = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      const unreadMessages = await db
        .select({ count: count() })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conv.id),
            eq(messages.recipientId, userId),
            eq(messages.isRead, false)
          )
        );

      const unreadCount = unreadMessages[0]?.count || 0;

      if (lastMessageResult.length > 0) {
        const lastMsg = lastMessageResult[0];
        result.push({
          id: conv.id,
          participant: otherUser,
          lastMessage: {
            text: lastMsg.body,
            timestamp: lastMsg.createdAt,
            isRead: lastMsg.isRead,
            isSentByMe: lastMsg.senderId === userId,
          },
          unreadCount: Number(unreadCount),
        });
      }
    }

    return result;
  }

  async getConversationMessages(conversationId: string, userId: string): Promise<Array<{
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
    isRead: boolean;
  }>> {
    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (conversation.length === 0) {
      throw new Error('Conversation not found');
    }

    const conv = conversation[0];
    if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
      throw new Error('Unauthorized');
    }

    const messageResults = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(50);

    // Return in ascending order for display
    const sortedMessages = messageResults.reverse();

    return sortedMessages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      text: msg.body,
      timestamp: msg.createdAt,
      isRead: msg.isRead,
      deliveredAt: msg.deliveredAt,
      readAt: msg.readAt,
    }));
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    const messageResult = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (messageResult.length === 0) {
      throw new Error('Message not found');
    }

    const message = messageResult[0];
    if (message.recipientId !== userId) {
      throw new Error('Unauthorized');
    }

    await db
      .update(messages)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(messages.id, messageId));
  }

  async addMessageReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    // Check if reaction already exists
    const existing = await db
      .select()
      .from(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, userId),
          eq(messageReactions.emoji, emoji)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(messageReactions).values({
        messageId,
        userId,
        emoji,
      });
    }
  }

  async removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await db
      .delete(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, userId),
          eq(messageReactions.emoji, emoji)
        )
      );
  }

  async getMessageReactions(messageId: string): Promise<Array<{ emoji: string; count: number; userIds: string[] }>> {
    const reactions = await db
      .select()
      .from(messageReactions)
      .where(eq(messageReactions.messageId, messageId));

    const grouped = reactions.reduce((acc, r) => {
      if (!acc[r.emoji]) {
        acc[r.emoji] = { emoji: r.emoji, count: 0, userIds: [] };
      }
      acc[r.emoji].count++;
      acc[r.emoji].userIds.push(r.userId);
      return acc;
    }, {} as Record<string, { emoji: string; count: number; userIds: string[] }>);

    return Object.values(grouped);
  }

  async searchMessages(userId: string, query: string, filterUserId?: string): Promise<Array<{
    id: string;
    conversationId: string;
    senderId: string;
    senderUsername: string;
    text: string;
    timestamp: Date;
  }>> {
    // Get user's conversations
    const userConvs = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId)
        )
      );
    
    const conversationIds = userConvs.map(c => c.id);
    if (conversationIds.length === 0) return [];

    // Build search query with ILIKE for case-insensitive search
    let whereConditions = [
      inArray(messages.conversationId, conversationIds),
      sql`LOWER(${messages.body}) LIKE LOWER(${`%${query}%`})`
    ];

    if (filterUserId) {
      whereConditions.push(eq(messages.senderId, filterUserId));
    }

    const results = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        senderUsername: users.username,
        text: messages.body,
        timestamp: messages.createdAt,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(messages.createdAt))
      .limit(100);

    return results;
  }

  async getDashboardPreferences(userId: string): Promise<DashboardPreferences | null> {
    const result = await db
      .select()
      .from(dashboardPreferences)
      .where(eq(dashboardPreferences.userId, userId))
      .limit(1);

    return result[0] || null;
  }

  async saveDashboardPreferences(userId: string, preferences: InsertDashboardPreferences): Promise<DashboardPreferences> {
    const existing = await this.getDashboardPreferences(userId);

    if (existing) {
      const updated = await db
        .update(dashboardPreferences)
        .set({
          widgetOrder: preferences.widgetOrder,
          enabledWidgets: preferences.enabledWidgets,
          layoutType: preferences.layoutType as "default" | "compact" | "comfortable" | undefined,
          updatedAt: new Date(),
        })
        .where(eq(dashboardPreferences.userId, userId))
        .returning();

      return updated[0];
    } else {
      const created = await db
        .insert(dashboardPreferences)
        .values({
          userId,
          widgetOrder: preferences.widgetOrder,
          enabledWidgets: preferences.enabledWidgets,
          layoutType: preferences.layoutType as "default" | "compact" | "comfortable" | undefined,
        })
        .returning();

      return created[0];
    }
  }

  async createWithdrawalRequest(userId: string, data: Omit<InsertWithdrawalRequest, 'userId'>): Promise<WithdrawalRequest> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.totalCoins < data.amount) {
      throw new Error('Insufficient balance');
    }

    const [withdrawal] = await db.insert(withdrawalRequests).values({
      userId,
      amount: data.amount,
      cryptoType: data.cryptoType,
      walletAddress: data.walletAddress,
      status: (data.status || 'pending') as "pending" | "processing" | "completed" | "failed" | "cancelled",
      exchangeRate: data.exchangeRate,
      cryptoAmount: data.cryptoAmount,
      processingFee: data.processingFee,
      transactionHash: data.transactionHash,
      adminNotes: data.adminNotes,
    }).returning();

    await db
      .update(users)
      .set({ totalCoins: user.totalCoins - data.amount })
      .where(eq(users.id, userId));

    return withdrawal;
  }

  async getUserWithdrawals(userId: string): Promise<WithdrawalRequest[]> {
    return await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.userId, userId))
      .orderBy(desc(withdrawalRequests.requestedAt));
  }

  async getWithdrawalById(withdrawalId: string, userId: string): Promise<WithdrawalRequest | null> {
    const [withdrawal] = await db
      .select()
      .from(withdrawalRequests)
      .where(and(
        eq(withdrawalRequests.id, withdrawalId),
        eq(withdrawalRequests.userId, userId)
      ))
      .limit(1);

    return withdrawal || null;
  }

  async cancelWithdrawalRequest(withdrawalId: string, userId: string): Promise<WithdrawalRequest | null> {
    const withdrawal = await this.getWithdrawalById(withdrawalId, userId);
    
    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    if (withdrawal.status !== 'pending') {
      throw new Error('Can only cancel pending withdrawals');
    }

    const [cancelled] = await db
      .update(withdrawalRequests)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(and(
        eq(withdrawalRequests.id, withdrawalId),
        eq(withdrawalRequests.userId, userId)
      ))
      .returning();

    const user = await this.getUser(userId);
    if (user) {
      await db
        .update(users)
        .set({ totalCoins: user.totalCoins + withdrawal.amount })
        .where(eq(users.id, userId));
    }

    return cancelled;
  }

  // Notification System
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values({
      userId: notification.userId,
      type: notification.type as "reply" | "like" | "follow" | "purchase" | "badge" | "system",
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl || null,
    }).returning();
    return created;
  }

  async getUserNotifications(userId: string, limit = 20): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ))
      .returning();
    return updated || null;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return result[0]?.count || 0;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  // Earnings Summary
  async getUserEarningsSummary(userId: string): Promise<{
    totalEarned: number;
    weeklyEarned: number;
    breakdown: Array<{
      source: string;
      amount: number;
      percentage: number;
    }>;
  }> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get all earning transactions for the user
    const transactions = await db
      .select()
      .from(coinTransactions)
      .where(and(
        eq(coinTransactions.userId, userId),
        eq(coinTransactions.type, 'earn')
      ));

    // Categorize earnings by description patterns
    const categories: Record<string, number> = {
      'Content Sales': 0,
      'Thread Replies': 0,
      'Accepted Answers': 0,
      'Daily Check-ins': 0,
      'Referrals': 0,
      'Other': 0,
    };

    transactions.forEach(tx => {
      const desc = tx.description.toLowerCase();
      if (desc.includes('content') || desc.includes('purchase')) {
        categories['Content Sales'] += tx.amount;
      } else if (desc.includes('reply')) {
        categories['Thread Replies'] += tx.amount;
      } else if (desc.includes('accepted') || desc.includes('answer')) {
        categories['Accepted Answers'] += tx.amount;
      } else if (desc.includes('check-in') || desc.includes('daily')) {
        categories['Daily Check-ins'] += tx.amount;
      } else if (desc.includes('referral')) {
        categories['Referrals'] += tx.amount;
      } else {
        categories['Other'] += tx.amount;
      }
    });

    const totalEarned = Object.values(categories).reduce((sum, val) => sum + val, 0);
    
    const breakdown = Object.entries(categories)
      .map(([source, amount]) => ({
        source,
        amount,
        percentage: totalEarned > 0 ? Math.round((amount / totalEarned) * 100) : 0,
      }))
      .filter(item => item.amount > 0) // Only show categories with earnings
      .sort((a, b) => b.amount - a.amount); // Sort by amount descending

    return {
      totalEarned,
      weeklyEarned: user.weeklyEarned || 0,
      breakdown,
    };
  }
}

// Feature flag for gradual rollout
// Default to PostgreSQL since DATABASE_URL is configured
const USE_POSTGRES = process.env.USE_POSTGRES !== "false";

export const storage = USE_POSTGRES 
  ? new DrizzleStorage()
  : new MemStorage();
