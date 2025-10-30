/**
 * Orchestrated Storage - Modular storage implementation
 * 
 * This orchestrator delegates high-traffic operations to specialized domain modules
 * while maintaining backward compatibility by falling back to DrizzleStorage for
 * unmigrated methods.
 * 
 * Architecture:
 * - UserStorage: User CRUD, auth, profiles, badges, follows, activity
 * - ForumStorage: Threads, replies, categories
 * - ContentStorage: Content, purchases, reviews, likes
 * - DrizzleStorage: Fallback for all other operations
 */

import { DrizzleStorage } from '../storage';
import { UserStorage } from './domains/users';
import { ForumStorage } from './domains/forum';
import { ContentStorage } from './domains/content';
import type { IStorage } from '../storage';
import type {
  User,
  InsertUser,
  UpsertUser,
  UserFollow,
  InsertUserFollow,
  UserBadge,
  ActivityFeed,
  InsertActivityFeed,
  ForumThread,
  InsertForumThread,
  ForumReply,
  InsertForumReply,
  ForumCategory,
  Content,
  InsertContent,
  ContentPurchase,
  ContentReview,
  InsertContentReview,
  ContentLike,
  InsertContentLike,
  ContentReply,
  InsertContentReply
} from '@shared/schema';

class OrchestratedStorageBase {
  private users: UserStorage;
  private forum: ForumStorage;
  private content: ContentStorage;
  public fallback: DrizzleStorage;

  constructor() {
    this.users = new UserStorage();
    this.forum = new ForumStorage();
    this.content = new ContentStorage();
    this.fallback = new DrizzleStorage();
  }

  // ============================================================================
  // USER DOMAIN - Delegated to UserStorage
  // ============================================================================
  
  async getUser(id: string): Promise<User | undefined> {
    return this.users.getUser(id);
  }

  async getUserByUsername(username: string): Promise<any> {
    return this.users.getUserByUsername(username);
  }

  async getUserThreads(userId: string): Promise<ForumThread[]> {
    return this.users.getUserThreads(userId);
  }

  async createUser(user: InsertUser | UpsertUser): Promise<User> {
    return this.users.createUser(user);
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    return this.users.upsertUser(user);
  }

  async updateUserCoins(userId: string, coins: number): Promise<User | undefined> {
    return this.users.updateUserCoins(userId, coins);
  }

  async updateUserProfile(userId: string, data: Partial<User>): Promise<User | undefined> {
    return this.users.updateUserProfile(userId, data);
  }

  async recordActivity(userId: string, minutes: number): Promise<{coinsEarned: number, totalMinutes: number}> {
    return this.users.recordActivity(userId, minutes);
  }

  async getTodayActivity(userId: string): Promise<{activeMinutes: number, coinsEarned: number} | null> {
    return this.users.getTodayActivity(userId);
  }

  async checkCanPostJournal(userId: string): Promise<boolean> {
    return this.users.checkCanPostJournal(userId);
  }

  async markJournalPosted(userId: string): Promise<void> {
    return this.users.markJournalPosted(userId);
  }

  async createUserFollow(data: InsertUserFollow): Promise<UserFollow> {
    return this.users.createUserFollow(data);
  }

  async deleteUserFollow(followerId: string, followingId: string): Promise<void> {
    return this.users.deleteUserFollow(followerId, followingId);
  }

  async getFollow(followerId: string, followingId: string): Promise<UserFollow | null> {
    return this.users.getFollow(followerId, followingId);
  }

  async getUserFollowers(userId: string): Promise<User[]> {
    return this.users.getUserFollowers(userId);
  }

  async getUserFollowing(userId: string): Promise<User[]> {
    return this.users.getUserFollowing(userId);
  }

  async checkIfFollowing(followerId: string, followingId: string): Promise<boolean> {
    return this.users.checkIfFollowing(followerId, followingId);
  }

  async createUserBadge(userId: string, badgeType: string): Promise<UserBadge> {
    return this.users.createUserBadge(userId, badgeType);
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return this.users.getUserBadges(userId);
  }

  async hasUserBadge(userId: string, badgeType: string): Promise<boolean> {
    return this.users.hasUserBadge(userId, badgeType);
  }

  async createActivity(insertActivity: InsertActivityFeed): Promise<ActivityFeed> {
    return this.users.createActivity(insertActivity);
  }

  async getRecentActivity(limit = 50): Promise<ActivityFeed[]> {
    return this.users.getRecentActivity(limit);
  }

  async getUserActivity(userId: string, limit = 50): Promise<ActivityFeed[]> {
    return this.users.getUserActivity(userId, limit);
  }

  async getLeaderboard(type: "coins" | "contributions" | "uploads", limit = 10): Promise<User[]> {
    return this.users.getLeaderboard(type, limit);
  }

  async getTopUsersByCoins(limit: number) {
    return this.users.getTopUsersByCoins(limit);
  }

  async getTopContributors(limit: number) {
    return this.users.getTopContributors(limit);
  }

  async getTopSellers(limit: number) {
    return this.users.getTopSellers(limit);
  }

  // ============================================================================
  // FORUM DOMAIN - Delegated to ForumStorage
  // ============================================================================

  async createForumThread(thread: InsertForumThread, authorId: string): Promise<ForumThread> {
    return this.forum.createForumThread(thread, authorId);
  }

  async getForumThreadById(id: string): Promise<ForumThread | undefined> {
    return this.forum.getForumThreadById(id);
  }

  async getForumThreadBySlug(slug: string): Promise<ForumThread | undefined> {
    return this.forum.getForumThreadBySlug(slug);
  }

  async listForumThreads(filters?: { categorySlug?: string; status?: string; isPinned?: boolean; limit?: number }): Promise<ForumThread[]> {
    return this.forum.listForumThreads(filters);
  }

  async updateForumThreadReplyCount(threadId: string, increment: number): Promise<void> {
    return this.forum.updateForumThreadReplyCount(threadId, increment);
  }

  async updateForumThreadActivity(threadId: string): Promise<void> {
    return this.forum.updateForumThreadActivity(threadId);
  }

  async createForumReply(reply: InsertForumReply): Promise<ForumReply> {
    return this.forum.createForumReply(reply);
  }

  async listForumReplies(threadId: string): Promise<ForumReply[]> {
    return this.forum.listForumReplies(threadId);
  }

  async markReplyAsAccepted(replyId: string): Promise<ForumReply | null> {
    return this.forum.markReplyAsAccepted(replyId);
  }

  async markReplyAsHelpful(replyId: string): Promise<ForumReply | null> {
    return this.forum.markReplyAsHelpful(replyId);
  }

  async listForumCategories(): Promise<ForumCategory[]> {
    return this.forum.listForumCategories();
  }

  async getForumCategoryBySlug(slug: string): Promise<ForumCategory | undefined> {
    return this.forum.getForumCategoryBySlug(slug);
  }

  async updateCategoryStats(categorySlug: string): Promise<void> {
    return this.forum.updateCategoryStats(categorySlug);
  }

  // ============================================================================
  // CONTENT DOMAIN - Delegated to ContentStorage
  // ============================================================================

  async createContent(insertContent: InsertContent): Promise<Content> {
    return this.content.createContent(insertContent);
  }

  async getContent(id: string): Promise<Content | undefined> {
    return this.content.getContent(id);
  }

  async getContentBySlug(slug: string): Promise<Content | undefined> {
    return this.content.getContentBySlug(slug);
  }

  async getAllContent(filters?: { type?: string; category?: string; status?: string }): Promise<Content[]> {
    return this.content.getAllContent(filters);
  }

  async getUserContent(userId: string): Promise<Content[]> {
    return this.content.getUserContent(userId);
  }

  async updateContentViews(contentId: string): Promise<void> {
    return this.content.updateContentViews(contentId);
  }

  async updateContentDownloads(contentId: string): Promise<void> {
    return this.content.updateContentDownloads(contentId);
  }

  async purchaseContent(contentId: string, buyerId: string): Promise<ContentPurchase> {
    // Content storage needs access to wallet methods from fallback
    return this.content.purchaseContent(
      contentId, 
      buyerId,
      this.fallback.getUserWallet.bind(this.fallback),
      this.fallback.beginLedgerTransaction.bind(this.fallback)
    );
  }

  async getUserPurchases(userId: string): Promise<ContentPurchase[]> {
    return this.content.getUserPurchases(userId);
  }

  async hasPurchased(userId: string, contentId: string): Promise<boolean> {
    return this.content.hasPurchased(userId, contentId);
  }

  async createReview(review: InsertContentReview): Promise<ContentReview> {
    return this.content.createReview(review);
  }

  async getContentReviews(contentId: string): Promise<ContentReview[]> {
    return this.content.getContentReviews(contentId);
  }

  async getUserReviewCount(userId: string): Promise<number> {
    // Content storage handles content reviews, fallback handles broker reviews
    const contentReviewCount = await this.content.getUserReviewCount(userId);
    const totalReviewCount = await this.fallback.getUserReviewCount(userId);
    return totalReviewCount; // Fallback already includes both
  }

  async likeContent(like: InsertContentLike): Promise<ContentLike | null> {
    return this.content.likeContent(like);
  }

  async hasLiked(userId: string, contentId: string): Promise<boolean> {
    return this.content.hasLiked(userId, contentId);
  }

  async createReply(reply: InsertContentReply): Promise<ContentReply> {
    return this.content.createReply(reply);
  }

  async getContentReplies(contentId: string): Promise<ContentReply[]> {
    return this.content.getContentReplies(contentId);
  }

  async updateReplyHelpful(replyId: string): Promise<void> {
    return this.content.updateReplyHelpful(replyId);
  }

  // ============================================================================
  // FALLBACK - All other methods delegated to DrizzleStorage
  // ============================================================================
  
  // Coin transactions
  async trackOnboardingProgress(userId: string, task: string) {
    return this.fallback.trackOnboardingProgress(userId, task);
  }
  async createCoinTransaction(transaction: any) {
    return this.fallback.createCoinTransaction(transaction);
  }
  async getUserTransactions(userId: string, limit?: number) {
    return this.fallback.getUserTransactions(userId, limit);
  }
  async createRechargeOrder(order: any) {
    return this.fallback.createRechargeOrder(order);
  }
  async getRechargeOrder(id: string) {
    return this.fallback.getRechargeOrder(id);
  }
  async updateRechargeOrderStatus(id: string, status: any, paymentId?: string) {
    return this.fallback.updateRechargeOrderStatus(id, status, paymentId);
  }

  // Brokers
  async createBroker(broker: any) {
    return this.fallback.createBroker(broker);
  }
  async getBroker(id: string) {
    return this.fallback.getBroker(id);
  }
  async getBrokerBySlug(slug: string) {
    return this.fallback.getBrokerBySlug(slug);
  }
  async getAllBrokers(filters?: any) {
    return this.fallback.getAllBrokers(filters);
  }
  async searchBrokers(query: string, limit?: number) {
    return this.fallback.searchBrokers(query, limit);
  }
  async createBrokerReview(review: any) {
    return this.fallback.createBrokerReview(review);
  }
  async getBrokerReview(reviewId: string) {
    return this.fallback.getBrokerReview(reviewId);
  }
  async getBrokerReviews(brokerId: string, filters?: any) {
    return this.fallback.getBrokerReviews(brokerId, filters);
  }
  async updateBrokerReviewStatus(reviewId: string, status: string) {
    return this.fallback.updateBrokerReviewStatus(reviewId, status);
  }
  async updateBrokerRating(brokerId: string) {
    return this.fallback.updateBrokerRating(brokerId);
  }

  // Notifications
  async createNotification(notification: any) {
    return this.fallback.createNotification(notification);
  }
  async getUserNotifications(userId: string, limit?: number) {
    return this.fallback.getUserNotifications(userId, limit);
  }
  async markNotificationAsRead(id: string, userId: string) {
    return this.fallback.markNotificationAsRead(id, userId);
  }
  async markAllNotificationsAsRead(userId: string) {
    return this.fallback.markAllNotificationsAsRead(userId);
  }
  async getUnreadNotificationCount(userId: string) {
    return this.fallback.getUnreadNotificationCount(userId);
  }

  // Ledger & Wallet
  async createUserWallet(userId: string) {
    return this.fallback.createUserWallet(userId);
  }
  async getUserWallet(userId: string) {
    return this.fallback.getUserWallet(userId);
  }
  async beginLedgerTransaction(type: string, userId: string, entries: any[], metadata?: any) {
    return this.fallback.beginLedgerTransaction(type, userId, entries, metadata);
  }
  async getLedgerTransactionHistory(userId: string, limit?: number) {
    return this.fallback.getLedgerTransactionHistory(userId, limit);
  }
  async getWalletBalance(userId: string) {
    return this.fallback.getWalletBalance(userId);
  }
  async transferCoins(fromUserId: string, toUserId: string, amount: number, description: string) {
    return this.fallback.transferCoins(fromUserId, toUserId, amount, description);
  }
  async createWithdrawalRequest(userId: string, data: any) {
    return this.fallback.createWithdrawalRequest(userId, data);
  }
  async getUserWithdrawals(userId: string) {
    return this.fallback.getUserWithdrawals(userId);
  }
  async getWithdrawalById(id: string, userId: string) {
    return this.fallback.getWithdrawalById(id, userId);
  }

  // Daily limits & tracking
  async getDailyActivityLimit(userId: string, date: string) {
    return this.fallback.getDailyActivityLimit(userId, date);
  }
  async updateDailyActivityLimit(userId: string, date: string, actionsUsed: number) {
    return this.fallback.updateDailyActivityLimit(userId, date, actionsUsed);
  }

  // Profile & Settings
  async getProfileByUsername(username: string) {
    return this.fallback.getProfileByUsername(username);
  }
  async updateProfile(userId: string, profile: any) {
    return this.fallback.updateProfile(userId, profile);
  }
  async getUserSettings(userId: string) {
    return this.fallback.getUserSettings(userId);
  }
  async updateUserSettings(userId: string, settings: any) {
    return this.fallback.updateUserSettings(userId, settings);
  }

  // Dashboard
  async getDashboardPreferences(userId: string) {
    return this.fallback.getDashboardPreferences(userId);
  }
  async updateDashboardPreferences(userId: string, preferences: any) {
    return this.fallback.updateDashboardPreferences(userId, preferences);
  }
  async getUserEarningsSummary(userId: string) {
    return this.fallback.getUserEarningsSummary(userId);
  }
  async getSalesDashboard(userId: string, days: number) {
    return this.fallback.getSalesDashboard(userId, days);
  }
  async getEarningsBreakdown(userId: string) {
    return this.fallback.getEarningsBreakdown(userId);
  }
  async getActivityFeed(userId: string, limit: number) {
    return this.fallback.getActivityFeed(userId, limit);
  }
  async getDashboardSettings(userId: string) {
    return this.fallback.getDashboardSettings(userId);
  }
  async updateDashboardSettings(userId: string, settings: any) {
    return this.fallback.updateDashboardSettings(userId, settings);
  }

  // Onboarding
  async getOnboardingProgress(userId: string) {
    return this.fallback.getOnboardingProgress(userId);
  }
  async markOnboardingStep(userId: string, step: string) {
    return this.fallback.markOnboardingStep(userId, step);
  }
  async dismissOnboarding(userId: string) {
    return this.fallback.dismissOnboarding(userId);
  }

  // Badge automation
  async checkAndAwardBadges(userId: string) {
    return this.fallback.checkAndAwardBadges(userId);
  }

  // Dashboard preferences
  async saveDashboardPreferences(userId: string, preferences: any) {
    return this.fallback.saveDashboardPreferences(userId, preferences);
  }

  // Withdrawals
  async cancelWithdrawalRequest(id: string, userId: string) {
    return this.fallback.cancelWithdrawalRequest(id, userId);
  }

  // Forum - additional methods
  async getAllForumThreads(filters?: any) {
    return this.fallback.getAllForumThreads(filters);
  }
  async getAllUsers(filters?: any) {
    return this.fallback.getAllUsers(filters);
  }

  // Messaging
  async sendMessage(message: any) {
    return this.fallback.sendMessage(message);
  }
  async getConversations(userId: string) {
    return this.fallback.getConversations(userId);
  }
  async getConversationMessages(conversationId: string, userId: string) {
    return this.fallback.getConversationMessages(conversationId, userId);
  }
  async markMessageAsRead(messageId: string) {
    return this.fallback.markMessageAsRead(messageId);
  }

  // Support
  async getSupportTickets(filters?: any) {
    return this.fallback.getSupportTickets(filters);
  }
  async createSupportTicket(ticket: any) {
    return this.fallback.createSupportTicket(ticket);
  }
  async updateSupportTicket(id: string, updates: any) {
    return this.fallback.updateSupportTicket(id, updates);
  }

  // Announcements
  async getAnnouncements(filters?: any) {
    return this.fallback.getAnnouncements(filters);
  }
  async createAnnouncement(announcement: any) {
    return this.fallback.createAnnouncement(announcement);
  }
  async updateAnnouncement(id: string, updates: any) {
    return this.fallback.updateAnnouncement(id, updates);
  }
  async deleteAnnouncement(id: string) {
    return this.fallback.deleteAnnouncement(id);
  }

  // Email templates - additional
  async getEmailTemplate(id: string) {
    return this.fallback.getEmailTemplate(id);
  }

  // Admin roles
  async getAdminRoles() {
    return this.fallback.getAdminRoles();
  }
  async grantAdminRole(userId: string, role: string) {
    return this.fallback.grantAdminRole(userId, role);
  }
  async revokeAdminRole(userId: string, role: string) {
    return this.fallback.revokeAdminRole(userId, role);
  }

  // Security
  async getSecurityEvents(filters?: any) {
    return this.fallback.getSecurityEvents(filters);
  }
  async getIpBans() {
    return this.fallback.getIpBans();
  }
  async getAdminActionLogs(filters?: any) {
    return this.fallback.getAdminActionLogs(filters);
  }
  async getRecentAdminActions(limit?: number) {
    return this.fallback.getRecentAdminActions(limit);
  }

  // Performance
  async getPerformanceMetrics() {
    return this.fallback.getPerformanceMetrics();
  }
  async getPerformanceAlerts() {
    return this.fallback.getPerformanceAlerts();
  }

  // Automation
  async getAutomationRules() {
    return this.fallback.getAutomationRules();
  }
  async createAutomationRule(rule: any) {
    return this.fallback.createAutomationRule(rule);
  }
  async updateAutomationRule(id: string, updates: any) {
    return this.fallback.updateAutomationRule(id, updates);
  }

  // A/B Testing
  async getAbTests() {
    return this.fallback.getAbTests();
  }
  async createAbTest(test: any) {
    return this.fallback.createAbTest(test);
  }
  async updateAbTest(id: string, updates: any) {
    return this.fallback.updateAbTest(id, updates);
  }

  // Feature flags - additional
  async getFeatureFlag(key: string) {
    return this.fallback.getFeatureFlag(key);
  }
  async createFeatureFlag(flag: any) {
    return this.fallback.createFeatureFlag(flag);
  }

  // API keys
  async getApiKeys(userId?: string) {
    return this.fallback.getApiKeys(userId);
  }
  async createApiKey(userId: string, data: any) {
    return this.fallback.createApiKey(userId, data);
  }
  async revokeApiKey(id: string) {
    return this.fallback.revokeApiKey(id);
  }

  // Webhooks
  async getWebhooks(userId?: string) {
    return this.fallback.getWebhooks(userId);
  }
  async createWebhook(webhook: any) {
    return this.fallback.createWebhook(webhook);
  }
  async updateWebhook(id: string, updates: any) {
    return this.fallback.updateWebhook(id, updates);
  }
  async deleteWebhook(id: string) {
    return this.fallback.deleteWebhook(id);
  }

  // Referrals
  async getReferrals(userId: string) {
    return this.fallback.getReferrals(userId);
  }
  async getReferralStats(userId: string) {
    return this.fallback.getReferralStats(userId);
  }
  async generateReferralCode(userId: string) {
    return this.fallback.generateReferralCode(userId);
  }

  // Goals
  async getGoals(userId: string) {
    return this.fallback.getGoals(userId);
  }

  // Admin stats
  async getAdminOverviewStats() {
    return this.fallback.getAdminOverviewStats();
  }
  async getUserGrowthSeries(days: number) {
    return this.fallback.getUserGrowthSeries(days);
  }

  // System settings - individual
  async getSystemSetting(key: string) {
    return this.fallback.getSystemSetting(key);
  }
  async updateSystemSetting(key: string, value: any) {
    return this.fallback.updateSystemSetting(key, value);
  }

  // Stats
  async getContentSalesStats(contentId: string) {
    return this.fallback.getContentSalesStats(contentId);
  }

  // Admin operations
  async getAdminUsers(filters: any) {
    return this.fallback.getAdminUsers(filters);
  }
  async getUserById(id: string) {
    return this.fallback.getUserById(id);
  }
  async updateUser(id: string, updates: any) {
    return this.fallback.updateUser(id, updates);
  }
  async deleteUser(id: string) {
    return this.fallback.deleteUser(id);
  }
  async getUserActivityLog(userId: string, limit?: number) {
    return this.fallback.getUserActivityLog(userId, limit);
  }
  async getUserStats(userId: string) {
    return this.fallback.getUserStats(userId);
  }
  async getAdminContents(filters: any) {
    return this.fallback.getAdminContents(filters);
  }
  async updateContent(id: string, updates: any) {
    return this.fallback.updateContent(id, updates);
  }
  async deleteContent(id: string) {
    return this.fallback.deleteContent(id);
  }
  async getContentDetails(params: any) {
    return this.fallback.getContentDetails(params);
  }
  async getAdminReviews(filters: any) {
    return this.fallback.getAdminReviews(filters);
  }
  async getReviewDetails(reviewId: string, reviewType: string) {
    return this.fallback.getReviewDetails(reviewId, reviewType);
  }
  async updateContentReviewStatus(reviewId: string, status: string) {
    return this.fallback.updateContentReviewStatus(reviewId, status);
  }
  async deleteReview(reviewId: string, reviewType: string) {
    return this.fallback.deleteReview(reviewId, reviewType);
  }
  async getAdminTransactions(filters: any) {
    return this.fallback.getAdminTransactions(filters);
  }
  async getTransactionDetails(transactionId: string) {
    return this.fallback.getTransactionDetails(transactionId);
  }
  async refundTransaction(transactionId: string, adminId: string, reason?: string) {
    return this.fallback.refundTransaction(transactionId, adminId, reason);
  }
  async getDashboardStats() {
    return this.fallback.getDashboardStats();
  }
  async getUserGrowthStats(days: number) {
    return this.fallback.getUserGrowthStats(days);
  }
  async getRevenueStats(days: number) {
    return this.fallback.getRevenueStats(days);
  }
  async getContentStats() {
    return this.fallback.getContentStats();
  }
  async getEngagementMetrics(days: number) {
    return this.fallback.getEngagementMetrics(days);
  }
  async getTopContent(limit: number) {
    return this.fallback.getTopContent(limit);
  }
  async getContentByAuthor(authorId: string, limit?: number) {
    return this.fallback.getContentByAuthor(authorId, limit);
  }
  async getContentQualityScores() {
    return this.fallback.getContentQualityScores();
  }
  async getRecentReviews(limit: number) {
    return this.fallback.getRecentReviews(limit);
  }
  async getReviewStats() {
    return this.fallback.getReviewStats();
  }
  async getFlaggedContent(limit: number) {
    return this.fallback.getFlaggedContent(limit);
  }
  async searchContent(query: string, filters?: any) {
    return this.fallback.searchContent(query, filters);
  }
  async getSystemLogs(filters: any) {
    return this.fallback.getSystemLogs(filters);
  }
  async createSystemLog(log: any) {
    return this.fallback.createSystemLog(log);
  }
  async getSystemHealth() {
    return this.fallback.getSystemHealth();
  }
  async getAuditLogs(filters: any) {
    return this.fallback.getAuditLogs(filters);
  }
  async createAuditLog(log: any) {
    return this.fallback.createAuditLog(log);
  }
  async getUserTrendSeries(days: number) {
    return this.fallback.getUserTrendSeries(days);
  }
  async getRevenueTrendSeries(days: number) {
    return this.fallback.getRevenueTrendSeries(days);
  }
  async getContentTrendSeries(days: number) {
    return this.fallback.getContentTrendSeries(days);
  }
  async getEngagementTrendSeries(days: number) {
    return this.fallback.getEngagementTrendSeries(days);
  }
  async exportUsers(format: string, filters?: any) {
    return this.fallback.exportUsers(format, filters);
  }
  async exportContent(format: string, filters?: any) {
    return this.fallback.exportContent(format, filters);
  }
  async exportTransactions(format: string, filters?: any) {
    return this.fallback.exportTransactions(format, filters);
  }
  async getEmailTemplates() {
    return this.fallback.getEmailTemplates();
  }
  async createEmailTemplate(template: any) {
    return this.fallback.createEmailTemplate(template);
  }
  async updateEmailTemplate(id: string, updates: any) {
    return this.fallback.updateEmailTemplate(id, updates);
  }
  async deleteEmailTemplate(id: string) {
    return this.fallback.deleteEmailTemplate(id);
  }
  async sendBulkEmail(recipientIds: string[], templateId: string, variables?: any) {
    return this.fallback.sendBulkEmail(recipientIds, templateId, variables);
  }
  async getEmailCampaigns() {
    return this.fallback.getEmailCampaigns();
  }
  async createEmailCampaign(campaign: any) {
    return this.fallback.createEmailCampaign(campaign);
  }
  async getSystemSettings() {
    return this.fallback.getSystemSettings();
  }
  async updateSystemSettings(settings: any) {
    return this.fallback.updateSystemSettings(settings);
  }
  async getFeatureFlags() {
    return this.fallback.getFeatureFlags();
  }
  async updateFeatureFlag(key: string, enabled: boolean) {
    return this.fallback.updateFeatureFlag(key, enabled);
  }
  async getSiteConfig() {
    return this.fallback.getSiteConfig();
  }
  async updateSiteConfig(config: any) {
    return this.fallback.updateSiteConfig(config);
  }
  async createFeedback(feedback: any) {
    return this.fallback.createFeedback(feedback);
  }
  async getFeedback(filters?: any) {
    return this.fallback.getFeedback(filters);
  }
  async updateFeedbackStatus(id: string, status: string) {
    return this.fallback.updateFeedbackStatus(id, status);
  }
  async createGoal(userId: string, goal: any) {
    return this.fallback.createGoal(userId, goal);
  }
  async updateGoal(goalId: number, updates: any) {
    return this.fallback.updateGoal(goalId, updates);
  }
  async getUserAchievements(userId: string) {
    return this.fallback.getUserAchievements(userId);
  }
  async getCampaigns(userId: string) {
    return this.fallback.getCampaigns(userId);
  }
  async createCampaign(userId: string, campaign: any) {
    return this.fallback.createCampaign(userId, campaign);
  }
  async getCustomerList(userId: string) {
    return this.fallback.getCustomerList(userId);
  }
  async getTotalRevenue(period?: string) {
    return this.fallback.getTotalRevenue(period);
  }
  async getRevenueBySource() {
    return this.fallback.getRevenueBySource();
  }
  async getRevenuePeriod(period: any) {
    return this.fallback.getRevenuePeriod(period);
  }
  async getAllWithdrawals(filters?: any) {
    return this.fallback.getAllWithdrawals(filters);
  }
  async completeWithdrawal(id: string, adminId: string, transactionId: string, notes?: string) {
    return this.fallback.completeWithdrawal(id, adminId, transactionId, notes);
  }
  async getRecentTransactions(limit?: number, period?: string) {
    return this.fallback.getRecentTransactions(limit, period);
  }
  async getAllTransactions(filters?: any) {
    return this.fallback.getAllTransactions(filters);
  }
  async exportTransactionsCSV(filters?: any) {
    return this.fallback.exportTransactionsCSV(filters);
  }
  async getFinancialStats() {
    return this.fallback.getFinancialStats();
  }
  async createContentRevision(revision: any) {
    return this.fallback.createContentRevision(revision);
  }
  async getContentRevisions(contentType: string, contentId: string) {
    return this.fallback.getContentRevisions(contentType, contentId);
  }
}

/**
 * Creates an orchestrated storage instance with automatic fallback delegation.
 * 
 * This function wraps OrchestratedStorageBase in a JavaScript Proxy that:
 * 1. First checks if a method exists on the orchestrator (migrated to domain modules)
 * 2. If not found, automatically delegates to DrizzleStorage fallback
 * 3. Logs which methods are being delegated for monitoring migration progress
 * 
 * This ensures ALL IStorage methods work, even if not explicitly implemented.
 */
const createOrchestratedStorage = (): IStorage => {
  const base = new OrchestratedStorageBase();
  
  return new Proxy(base as any, {
    get(target, prop: string) {
      // If the method exists on the orchestrator, use it
      if (prop in target && typeof (target as any)[prop] === 'function') {
        return (target as any)[prop].bind(target);
      }
      
      // Otherwise, delegate to DrizzleStorage fallback
      if (prop in target.fallback && typeof (target.fallback as any)[prop] === 'function') {
        console.log(`[STORAGE] Delegating unmigrated method '${prop}' to DrizzleStorage`);
        return (target.fallback as any)[prop].bind(target.fallback);
      }
      
      // Return the property as-is (for non-methods)
      return (target as any)[prop];
    }
  }) as IStorage;
};

// Export a single instance (singleton pattern with Proxy delegation)
export const storage = createOrchestratedStorage();
export default storage;
