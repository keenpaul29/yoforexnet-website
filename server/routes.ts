import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { setupAuth, isAuthenticated } from "./replitAuth.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { 
  insertCoinTransactionSchema, 
  insertRechargeOrderSchema,
  insertWithdrawalRequestSchema,
  insertContentSchema,
  publishContentSchema,
  insertContentPurchaseSchema,
  insertContentReviewSchema,
  insertContentLikeSchema,
  insertContentReplySchema,
  insertBrokerSchema,
  insertBrokerReviewSchema,
  insertForumThreadSchema,
  insertForumReplySchema,
  insertUserFollowSchema,
  insertMessageSchema,
  updateUserProfileSchema,
  BADGE_METADATA,
  type BadgeType,
  coinTransactions,
  profiles
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, gt, asc } from "drizzle-orm";
import {
  sanitizeRequestBody,
  validateCoinAmount,
  validatePrice,
  validateSufficientCoins,
  runValidators,
} from "./validation.js";
import {
  coinOperationLimiter,
  contentCreationLimiter,
  reviewReplyLimiter,
  adminOperationLimiter,
} from "./rateLimiting.js";
import { generateSlug, generateFocusKeyword, generateMetaDescription as generateMetaDescriptionOld, generateImageAltTexts } from './seo.js';
import { emailService } from './services/emailService.js';
import { 
  RECHARGE_PACKAGES, 
  EARNING_REWARDS, 
  DAILY_LIMITS,
  calculateCommission, 
  calculateWithdrawal,
  coinsToUSD,
  formatCoinPrice
} from '../shared/coinUtils.js';
import {
  generateFullSlug,
  generateMetaDescription,
  deduplicateTags,
  countWords,
} from '../shared/threadUtils.js';

// Helper function to get authenticated user ID from session
function getAuthenticatedUserId(req: any): string {
  const claims = req.user?.claims;
  if (!claims?.sub) {
    throw new Error("No authenticated user");
  }
  return claims.sub;
}

// Helper function to check if user is admin
function isAdmin(user: any): boolean {
  if (!user) return false;
  const claims = user?.claims;
  if (!claims) return false;
  // Check if user has admin role
  return claims.role === 'admin' || claims.role === 'moderator' || claims.role === 'superadmin';
}

// System metric helpers
async function getServerCpu(): Promise<number> {
  // Simple approximation - in production use OS module
  return Math.random() * 100;
}

async function getServerMemory(): Promise<{used: number; total: number; percentage: number}> {
  const totalMem = process.memoryUsage().heapTotal / 1024 / 1024;
  const usedMem = process.memoryUsage().heapUsed / 1024 / 1024;
  return {
    used: Math.round(usedMem),
    total: Math.round(totalMem),
    percentage: Math.round((usedMem / totalMem) * 100)
  };
}

async function getDbQueryTime(): Promise<number> {
  // Mock implementation - in production track actual query times
  return Math.random() * 100;
}

async function getErrorRate(): Promise<number> {
  // Mock implementation - in production track actual errors
  return Math.random() * 5;
}

// Configure multer for file uploads
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.set', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
  }
};

const upload = multer({
  storage: uploadStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth (OIDC) - must be called before any routes
  await setupAuth(app);

  // FILE UPLOAD ENDPOINT
  app.post("/api/upload", isAuthenticated, upload.array('files', 10), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      // Generate URLs for uploaded files
      const fileUrls = req.files.map((file: Express.Multer.File) => {
        return `/uploads/${file.filename}`;
      });

      res.json({ 
        urls: fileUrls,
        message: "Thanks! This helps others.",
        count: fileUrls.length
      });
    } catch (error: any) {
      console.error('File upload error:', error);
      res.status(500).json({ error: error.message || "Failed to upload files" });
    }
  });

  // Get current authenticated user
  app.get("/api/me", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const claims = (req.user as any)?.claims;
    if (!claims?.sub) {
      return res.status(401).json({ error: "Invalid session" });
    }
    
    const user = await storage.getUser(claims.sub);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Mark profileCreated onboarding step on first successful authentication
    try {
      await storage.markOnboardingStep(claims.sub, 'profileCreated');
    } catch (error) {
      // Don't fail the request if onboarding step fails
      console.error('Failed to mark profileCreated:', error);
    }
    
    res.json(user);
  });

  // TEST EMAIL ENDPOINT - Send test email (Admin only)
  app.post("/api/test-email", isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin
      if (!isAdmin(req.user)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { to, type } = req.body;
      
      if (!to) {
        return res.status(400).json({ error: "Email address required" });
      }

      console.log(`[EMAIL TEST] Sending test email to: ${to}`);
      console.log(`[EMAIL TEST] BREVO_SMTP_HOST: ${process.env.BREVO_SMTP_HOST ? 'SET' : 'NOT SET'}`);
      console.log(`[EMAIL TEST] BREVO_SMTP_USER: ${process.env.BREVO_SMTP_USER ? process.env.BREVO_SMTP_USER.substring(0, 10) + '...' : 'NOT SET'}`);
      console.log(`[EMAIL TEST] BREVO_FROM_EMAIL: ${process.env.BREVO_FROM_EMAIL}`);
      console.log(`[EMAIL TEST] BASE_URL: ${process.env.BASE_URL}`);

      // Send a welcome/verification email as test
      await emailService.sendEmailVerification(
        to,
        "TestUser",
        "test-verification-token-123"
      );

      console.log(`[EMAIL TEST] Email sent successfully to: ${to}`);
      res.json({ success: true, message: `Test email sent to ${to}` });
    } catch (error: any) {
      console.error('[EMAIL TEST] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // FEEDBACK ENDPOINT - Submit user feedback
  app.post("/api/feedback", async (req, res) => {
    try {
      const { type, subject, message, email } = req.body;
      
      if (!type || !subject || !message) {
        return res.status(400).json({ error: "Type, subject, and message are required" });
      }

      console.log(`[FEEDBACK] New feedback received:`);
      console.log(`  Type: ${type}`);
      console.log(`  Subject: ${subject}`);
      console.log(`  Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
      console.log(`  Email: ${email || 'Not provided'}`);

      // In a production app, you would:
      // 1. Store in database
      // 2. Send notification email to support team
      // 3. Create support ticket
      
      res.json({ 
        success: true, 
        message: "Feedback submitted successfully. Thank you for helping us improve!" 
      });
    } catch (error: any) {
      console.error('[FEEDBACK] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get user by ID (requires authentication - own profile or admin)
  app.get("/api/user/:userId", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const requestedUserId = req.params.userId;

      // Check if user is viewing their own profile or is an admin
      if (authenticatedUserId !== requestedUserId && !isAdmin(req.user)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const user = await storage.getUser(requestedUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Get user by username (public - but with sensitive data removed)
  app.get("/api/users/username/:username", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Remove sensitive data from public profile
      const { 
        password, 
        email, 
        totalCoins, 
        weeklyEarned, 
        ...publicProfile 
      } = user;
      
      res.json(publicProfile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Coin balance endpoint (requires authentication - own profile or admin)
  app.get("/api/user/:userId/coins", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const requestedUserId = req.params.userId;

      // Check if user is viewing their own coins or is an admin
      if (authenticatedUserId !== requestedUserId && !isAdmin(req.user)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const user = await storage.getUser(requestedUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        totalCoins: user.totalCoins,
        weeklyEarned: user.weeklyEarned,
        rank: user.rank
      });
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Transaction history endpoint (requires authentication - own profile or admin)
  app.get("/api/user/:userId/transactions", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const requestedUserId = req.params.userId;

      // Check if user is viewing their own transactions or is an admin
      if (authenticatedUserId !== requestedUserId && !isAdmin(req.user)) {
        return res.status(403).json({ error: "Access denied" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const transactions = await storage.getUserTransactions(requestedUserId, limit);
      res.json(transactions);
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Badge System Endpoints
  // GET /api/users/:userId/badges - Get user badges
  app.get("/api/users/:userId/badges", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const badges = user.badges || [];
      const badgeDetails = badges.map((badgeId: string) => ({
        id: badgeId,
        ...BADGE_METADATA[badgeId as BadgeType],
      }));

      res.json(badgeDetails);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/users/:userId/stats - Get user stats for TrustLevel widget
  app.get("/api/users/:userId/stats", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const reputationScore = user.reputationScore || 0;

      // Calculate level based on reputation score
      let currentLevel: "novice" | "contributor" | "verified" | "pro";
      let nextLevelXP: number;

      if (reputationScore < 500) {
        currentLevel = "novice";
        nextLevelXP = 500;
      } else if (reputationScore < 2000) {
        currentLevel = "contributor";
        nextLevelXP = 2000;
      } else if (reputationScore < 5000) {
        currentLevel = "verified";
        nextLevelXP = 5000;
      } else {
        currentLevel = "pro";
        nextLevelXP = 10000;
      }

      // Calculate achievements
      const userContent = await storage.getUserContent(req.params.userId);
      const badges = user.badges || [];
      
      // Get user's replies and count accepted answers
      const userActivity = await storage.getUserActivity(req.params.userId, 1000);
      const acceptedAnswersCount = userActivity.filter(
        (activity: any) => activity.action === 'answer_accepted' && activity.userId === req.params.userId
      ).length;

      const achievements = {
        uploads: userContent.length,
        verifiedSets: badges.filter((b: string) => b.includes('verified')).length,
        solutionsMarked: acceptedAnswersCount
      };

      res.json({
        currentLevel,
        xp: reputationScore,
        nextLevelXP,
        achievements
      });
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/me/check-badges - Check and award new badges
  app.post("/api/me/check-badges", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const newBadges = await storage.checkAndAwardBadges(userId);
      
      const badgeDetails = newBadges.map((badgeId: string) => ({
        id: badgeId,
        ...BADGE_METADATA[badgeId as BadgeType],
      }));

      res.json({ newBadges: badgeDetails });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/me/onboarding - Get onboarding progress
  app.get("/api/me/onboarding", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      const progress = await storage.getOnboardingProgress(userId);
      res.json(progress || {
        completed: false,
        dismissed: false,
        progress: {
          profileCreated: false,
          firstReply: false,
          firstReport: false,
          firstUpload: false,
          socialLinked: false,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/me/onboarding/dismiss - Dismiss onboarding widget
  app.post("/api/me/onboarding/dismiss", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      await storage.dismissOnboarding(userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/me/content - Get current user's published content
  app.get("/api/me/content", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const content = await storage.getUserContent(userId);
      res.json(content);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/me/purchases - Get current user's purchases with populated content details
  app.get("/api/me/purchases", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const purchases = await storage.getUserPurchases(userId);
      
      // Populate content details for each purchase
      const purchasesWithContent = await Promise.all(
        purchases.map(async (purchase: any) => {
          const content = await storage.getContent(purchase.contentId);
          return {
            ...purchase,
            content: content || null
          };
        })
      );
      
      res.json(purchasesWithContent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/me/dashboard-metrics - Get dashboard aggregate metrics
  app.get("/api/me/dashboard-metrics", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const content = await storage.getUserContent(userId);
      
      // Get content IDs to query sales
      const contentIds = content.map((c: any) => c.id);
      
      // Calculate total revenue from actual sales/downloads
      // Revenue comes from the downloads field which represents successful purchases
      const totalRevenue = content.reduce((sum: number, item: any) => {
        // Calculate revenue from downloads (80% commission for EA/indicators/articles, 75% for set files)
        const commission = item.type === 'source_code' ? 0.75 : 0.8;
        const salesRevenue = (item.downloads || 0) * item.priceCoins * commission;
        return sum + salesRevenue;
      }, 0);
      
      const totalDownloads = content.reduce((sum: number, item: any) => sum + (item.downloads || 0), 0);
      const totalViews = content.reduce((sum: number, item: any) => sum + (item.views || 0), 0);
      const avgRating = content.length > 0 
        ? content.reduce((sum: number, item: any) => sum + (item.averageRating || 0), 0) / content.length 
        : 0;

      res.json({
        totalRevenue: Math.floor(totalRevenue),
        totalDownloads,
        totalViews,
        avgRating,
        publishedCount: content.length
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/me/revenue-trend - Get 30-day revenue trend
  app.get("/api/me/revenue-trend", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      
      // Query coin transactions for last 30 days to get real revenue data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get all "earn" type transactions (revenue) from the last 30 days
      const revenueTransactions = await db
        .select({
          amount: coinTransactions.amount,
          createdAt: coinTransactions.createdAt,
        })
        .from(coinTransactions)
        .where(
          and(
            eq(coinTransactions.userId, userId),
            eq(coinTransactions.type, 'earn'),
            gt(coinTransactions.createdAt, thirtyDaysAgo)
          )
        )
        .orderBy(asc(coinTransactions.createdAt));
      
      // Group transactions by date and sum revenue
      const trendMap = new Map<string, { revenueCoins: number; downloads: number }>();
      
      revenueTransactions.forEach((transaction: any) => {
        const date = transaction.createdAt.toISOString().split('T')[0];
        const existing = trendMap.get(date) || { revenueCoins: 0, downloads: 0 };
        existing.revenueCoins += transaction.amount;
        trendMap.set(date, existing);
      });
      
      // Convert map to array and fill in missing dates with zeros
      const trend: { date: string; revenueCoins: number; downloads: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const data = trendMap.get(dateStr) || { revenueCoins: 0, downloads: 0 };
        trend.push({
          date: dateStr,
          revenueCoins: data.revenueCoins,
          downloads: data.downloads
        });
      }
      
      res.json(trend);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/dashboard/preferences - Get authenticated user's dashboard preferences
  app.get("/api/dashboard/preferences", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      const preferences = await storage.getDashboardPreferences(userId);
      
      if (!preferences) {
        return res.json({
          widgetOrder: ['stats', 'hot-threads', 'leaderboard', 'week-highlights', 'activity-feed', 'top-sellers'],
          enabledWidgets: ['stats', 'hot-threads', 'leaderboard', 'week-highlights', 'activity-feed'],
          layoutType: 'default'
        });
      }
      
      res.json(preferences);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/dashboard/preferences - Save authenticated user's dashboard preferences
  app.post("/api/dashboard/preferences", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      const { widgetOrder, enabledWidgets, layoutType } = req.body;
      
      if (!Array.isArray(widgetOrder) || !Array.isArray(enabledWidgets) || !layoutType) {
        return res.status(400).json({ error: "Invalid preferences data" });
      }
      
      const preferences = await storage.saveDashboardPreferences(userId, {
        userId,
        widgetOrder,
        enabledWidgets,
        layoutType
      });
      
      res.json(preferences);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Notification System Endpoints
  // GET /api/notifications - Get user's notifications
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const notifications = await storage.getUserNotifications(userId, limit);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/notifications/:id/read - Mark notification as read
  app.post("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      const notification = await storage.markNotificationAsRead(req.params.id, userId);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/notifications/unread-count - Get unread notification count
  app.get("/api/notifications/unread-count", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/notifications/mark-all-read - Mark all notifications as read
  app.post("/api/notifications/mark-all-read", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/activity/recent - Get recent platform activity
  app.get("/api/activity/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivity(limit);
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/user/earnings-summary - Get user earnings breakdown
  app.get("/api/user/earnings-summary", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    try {
      const summary = await storage.getUserEarningsSummary(userId);
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create coin transaction (earn/spend)
  app.post("/api/transactions", isAuthenticated, coinOperationLimiter, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // Sanitize inputs
      const sanitized = sanitizeRequestBody(req.body, []);
      
      // Validate schema
      const validated = insertCoinTransactionSchema.parse(sanitized);
      
      // Override userId with authenticated user ID
      validated.userId = authenticatedUserId;
      
      // Validate coin amount is positive
      const amountValidation = validateCoinAmount(validated.amount);
      if (!amountValidation.valid) {
        return res.status(400).json({ error: amountValidation.error });
      }
      
      // For spending transactions, verify user has sufficient coins
      if (validated.type === "spend") {
        const user = await storage.getUser(authenticatedUserId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        
        const balanceCheck = validateSufficientCoins(user.totalCoins, validated.amount);
        if (!balanceCheck.valid) {
          return res.status(400).json({ error: balanceCheck.error });
        }
      }
      
      const transaction = await storage.createCoinTransaction(validated);
      res.json(transaction);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Insufficient coins") {
          return res.status(400).json({ error: "Insufficient coins" });
        }
        if (error.message === "User not found") {
          return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Invalid transaction data" });
    }
  });

  // Create recharge order
  app.post("/api/recharge", isAuthenticated, coinOperationLimiter, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      const validated = insertRechargeOrderSchema.parse(req.body);
      // Override userId with authenticated user ID
      validated.userId = authenticatedUserId;
      
      const order = await storage.createRechargeOrder(validated);
      
      // TODO: Integrate with Stripe or crypto payment gateway here
      // For now, auto-complete for demo purposes
      const completedOrder = await storage.updateRechargeOrderStatus(
        order.id, 
        "completed",
        "demo-payment-id"
      );
      
      res.json(completedOrder);
    } catch (error) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(400).json({ error: "Invalid recharge data" });
    }
  });

  // Get recharge order status
  app.get("/api/recharge/:orderId", async (req, res) => {
    const order = await storage.getRechargeOrder(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  });

  // Get recharge packages
  app.get("/api/recharge/packages", async (req, res) => {
    res.json(RECHARGE_PACKAGES);
  });

  // ===== WITHDRAWAL ENDPOINTS =====
  
  // Create withdrawal request
  app.post("/api/withdrawals", isAuthenticated, coinOperationLimiter, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      const validated = insertWithdrawalRequestSchema.parse(req.body);
      
      // Calculate exchange rate and crypto amount based on hardcoded rates
      const EXCHANGE_RATES = {
        BTC: 50000,
        ETH: 3000,
      };
      
      const exchangeRate = EXCHANGE_RATES[validated.cryptoType];
      const cryptoAmount = validated.amount / exchangeRate;
      
      // Calculate processing fee: 5% or 100 coins (whichever is greater)
      const fivePercent = Math.floor(validated.amount * 0.05);
      const processingFee = Math.max(fivePercent, 100);
      
      const withdrawal = await storage.createWithdrawalRequest(authenticatedUserId, {
        ...validated,
        exchangeRate: exchangeRate.toString(),
        cryptoAmount: cryptoAmount.toString(),
        processingFee,
        status: 'pending',
      });
      
      // Send withdrawal request email (fire-and-forget)
      (async () => {
        try {
          const user = await storage.getUser(authenticatedUserId);
          if (user?.username) {
            await emailService.sendWithdrawalRequestReceived(
              user.username,
              validated.amount,
              validated.cryptoType,
              withdrawal.id
            );
          }
        } catch (emailError) {
          console.error('Failed to send withdrawal request email:', emailError);
        }
      })();
      
      res.json(withdrawal);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "User not found") {
          return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "Insufficient balance") {
          return res.status(400).json({ error: "Insufficient balance" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Invalid withdrawal data" });
    }
  });

  // Get user's withdrawal history
  app.get("/api/withdrawals", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const withdrawals = await storage.getUserWithdrawals(authenticatedUserId);
      res.json(withdrawals);
    } catch (error) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ error: "Failed to fetch withdrawals" });
    }
  });

  // Get specific withdrawal by ID
  app.get("/api/withdrawals/:id", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const withdrawal = await storage.getWithdrawalById(req.params.id, authenticatedUserId);
      
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }
      
      res.json(withdrawal);
    } catch (error) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ error: "Failed to fetch withdrawal" });
    }
  });

  // Cancel pending withdrawal
  app.post("/api/withdrawals/:id/cancel", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const withdrawal = await storage.cancelWithdrawalRequest(req.params.id, authenticatedUserId);
      
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }
      
      res.json(withdrawal);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Withdrawal not found") {
          return res.status(404).json({ error: "Withdrawal not found" });
        }
        if (error.message === "Can only cancel pending withdrawals") {
          return res.status(400).json({ error: "Can only cancel pending withdrawals" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(500).json({ error: "Failed to cancel withdrawal" });
    }
  });

  // Calculate withdrawal fees
  app.post("/api/withdrawals/calculate", async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount || amount < 1000) {
        return res.status(400).json({ error: "Minimum withdrawal is 1000 coins" });
      }
      
      const calculation = calculateWithdrawal(amount);
      res.json(calculation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== COIN EARNING ENDPOINTS =====

  // Daily check-in - COMMENTED OUT: getDailyActivityLimit and upsertDailyActivityLimit methods don't exist in storage
  /* app.post("/api/coins/daily-checkin", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already checked in today
      const existingLimit = await storage.getDailyActivityLimit(userId, today);
      if (existingLimit && existingLimit.checkinCount > 0) {
        return res.status(400).json({ error: "Already checked in today" });
      }
      
      // Get yesterday's date to check streak
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const yesterdayLimit = await storage.getDailyActivityLimit(userId, yesterday);
      
      let consecutiveDays = 1;
      if (yesterdayLimit && yesterdayLimit.consecutiveDays > 0) {
        consecutiveDays = yesterdayLimit.consecutiveDays + 1;
      }
      
      // Award daily check-in coin
      let coinsAwarded = EARNING_REWARDS.DAILY_CHECKIN;
      let bonusDescription = '';
      
      // Check for streak bonuses
      if (consecutiveDays === 7) {
        coinsAwarded += EARNING_REWARDS.WEEKLY_STREAK;
        bonusDescription = ' + 10 bonus (7-day streak!)';
      } else if (consecutiveDays === 30) {
        coinsAwarded += EARNING_REWARDS.MONTHLY_PERFECT;
        bonusDescription = ' + 50 bonus (30-day perfect streak!)';
      }
      
      // Update daily activity limit
      await storage.upsertDailyActivityLimit(userId, today, {
        checkinCount: 1,
        consecutiveDays,
      });
      
      // Award coins via ledger transaction
      await storage.beginLedgerTransaction(
        'earn',
        userId,
        [
          {
            userId,
            direction: 'credit',
            amount: coinsAwarded,
            memo: `Daily check-in (day ${consecutiveDays})${bonusDescription}`,
          },
          {
            userId: 'system',
            direction: 'debit',
            amount: coinsAwarded,
            memo: 'Platform reward for daily check-in',
          },
        ],
        { activityType: 'daily-checkin', consecutiveDays }
      );
      
      res.json({
        success: true,
        coinsAwarded,
        consecutiveDays,
        message: `+${coinsAwarded} coins! Day ${consecutiveDays} streak${bonusDescription}`,
      });
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ error: error.message });
    }
  }); */

  // ===== REFERRAL ENDPOINTS =====

  // Get user's referral link
  app.get("/api/referrals/link", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const baseUrl = process.env.BASE_URL || 'https://yoforex.com';
      const referralLink = `${baseUrl}/?ref=${user.id}`;
      
      res.json({
        referralLink,
        userId: user.id,
        username: user.username,
      });
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Get referral stats
  app.get("/api/referrals/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      
      // TODO: Implement referral tracking in storage
      // For now, return placeholder data
      res.json({
        totalReferrals: 0,
        activeReferrals: 0,
        totalEarned: 0,
        thisMonthEarned: 0,
        referrals: [],
      });
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ===== LEDGER SYSTEM ENDPOINTS =====
  
  // Admin-only endpoint to backfill opening balances (run once)
  app.post("/api/admin/backfill-wallets", isAuthenticated, async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    
    // Get user from database to check admin status
    const user = await storage.getUser(userId);
    
    // TODO: Replace with proper admin check
    // For now, block ALL access since this is a one-time migration
    // In production, add an 'isAdmin' field to users table
    return res.status(403).json({ 
      error: "Forbidden: Admin-only endpoint. Use CLI for one-time migration." 
    });

    /* DISABLED FOR SECURITY
    try {
      if (typeof (storage as any).backfillOpeningBalances !== 'function') {
        return res.status(400).json({ error: "Backfill not available (MemStorage in use)" });
      }
      const result = await storage.backfillOpeningBalances();
      res.json({ 
        message: "Wallets backfilled successfully",
        created: result.created,
        skipped: result.skipped
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
    */
  });

  // Get user wallet balance
  app.get("/api/wallet", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const wallet = await storage.getUserWallet(userId);
      res.json(wallet);
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      if (error.message.includes("does not support ledger operations")) {
        return res.status(400).json({ error: "Ledger operations not available (MemStorage in use)" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Get ledger history
  app.get("/api/ledger/history", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getLedgerTransactionHistory(userId, limit);
      res.json(history);
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      if (error.message.includes("does not support ledger operations")) {
        return res.status(400).json({ error: "Ledger operations not available (MemStorage in use)" });
      }
      res.status(500).json({ error: error.message });
    }
  });
  
  // POST /api/daily-checkin - Award daily active bonus
  app.post("/api/daily-checkin", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);

      // Check if user already checked in today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingCheckin = await storage.getLedgerTransactionHistory(userId, 100);
      const checkedInToday = existingCheckin.some(entry => {
        const entryDate = new Date(entry.createdAt);
        entryDate.setHours(0, 0, 0, 0);
        return entry.memo?.includes('Daily active bonus') && entryDate.getTime() === today.getTime();
      });

      if (checkedInToday) {
        return res.status(400).json({ error: 'Already checked in today' });
      }

      // AWARD COINS: +5 for daily active
      await storage.beginLedgerTransaction(
        'earn',
        userId,
        [
          {
            userId,
            direction: 'credit',
            amount: 5,
            memo: 'Daily active bonus',
          },
          {
            userId: 'system',
            direction: 'debit',
            amount: 5,
            memo: 'Platform daily reward',
          },
        ],
        { date: today.toISOString() }
      );

      res.json({ message: 'Daily bonus claimed', coins: 5 });
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      if (error.message.includes("does not support ledger operations")) {
        return res.status(400).json({ error: "Ledger operations not available (MemStorage in use)" });
      }
      res.status(500).json({ error: error.message });
    }
  });
  
  // GET /api/coins/summary - Get earning breakdown
  app.get("/api/coins/summary", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);

      const history = await storage.getLedgerTransactionHistory(userId, 1000);
      
      const summary = {
        totalEarned: 0,
        publishing: 0,
        helpful: 0,
        accepted: 0,
        daily: 0,
        reviews: 0,
        likes: 0,
      };

      history.forEach(entry => {
        if (entry.direction === 'credit' && entry.memo) {
          const amount = entry.amount;
          summary.totalEarned += amount;

          if (entry.memo.includes('Published')) summary.publishing += amount;
          else if (entry.memo.includes('helpful')) summary.helpful += amount;
          else if (entry.memo.includes('accepted')) summary.accepted += amount;
          else if (entry.memo.includes('Daily')) summary.daily += amount;
          else if (entry.memo.includes('review') || entry.memo.includes('scam')) summary.reviews += amount;
          else if (entry.memo.includes('like')) summary.likes += amount;
        }
      });

      res.json(summary);
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      if (error.message.includes("does not support ledger operations")) {
        return res.status(400).json({ error: "Ledger operations not available (MemStorage in use)" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // ===== MARKETPLACE ENDPOINTS =====
  
  // ===== PUBLISHING ENDPOINTS =====
  
  // Get forum categories for publishing
  app.get("/api/publish/categories", async (req, res) => {
    try {
      const categories = await storage.listForumCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  
  // Mock file upload endpoint (returns mock file data)
  app.post("/api/uploads/file", isAuthenticated, async (req, res) => {
    try {
      // Mock file upload - in production this would handle actual file storage
      const { name, size } = req.body;
      
      if (!name || !size) {
        return res.status(400).json({ error: "File name and size required" });
      }
      
      // Generate mock data
      const mockFileData = {
        name,
        size,
        url: `/uploads/files/${Date.now()}-${name}`,
        checksum: Math.random().toString(36).substring(2, 15),
      };
      
      res.json(mockFileData);
    } catch (error) {
      res.status(400).json({ error: "File upload failed" });
    }
  });
  
  // Mock image upload endpoint (returns mock image data)
  app.post("/api/uploads/image", isAuthenticated, async (req, res) => {
    try {
      // Mock image upload - in production this would handle actual image storage
      const { name, isCover, order } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Image name required" });
      }
      
      // Generate mock data
      const mockImageData = {
        url: `/uploads/images/${Date.now()}-${name}`,
        isCover: isCover || false,
        order: order || 0,
      };
      
      res.json(mockImageData);
    } catch (error) {
      res.status(400).json({ error: "Image upload failed" });
    }
  });
  
  // Publish content with validation
  app.post("/api/publish", isAuthenticated, contentCreationLimiter, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // Sanitize inputs - allow HTML in description
      const sanitized = sanitizeRequestBody(req.body, ['description', 'changelog']);
      
      // Use shared publishContentSchema with server-injected authorId
      const validated = publishContentSchema.parse({ ...sanitized, authorId: authenticatedUserId });
      
      // Validate price if provided
      if (validated.priceCoins !== undefined && validated.priceCoins !== null) {
        const priceValidation = validatePrice(validated.priceCoins);
        if (!priceValidation.valid) {
          return res.status(400).json({ error: priceValidation.error });
        }
      }
      
      const content = await storage.createContent(validated);
      
      // Check and award badges after content publishing
      try {
        await storage.checkAndAwardBadges(authenticatedUserId);
      } catch (error) {
        console.error('Badge check failed:', error);
      }
      
      res.json(content);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
        // Return Zod validation errors
        if (error.name === "ZodError") {
          return res.status(400).json({ 
            error: "Validation failed", 
            details: (error as any).errors 
          });
        }
      }
      res.status(400).json({ error: "Invalid content data" });
    }
  });
  
  // Create content (EA, Indicator, Article, Source Code)
  app.post("/api/content", isAuthenticated, contentCreationLimiter, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // Sanitize inputs - allow HTML in description
      const sanitized = sanitizeRequestBody(req.body, ['description']);
      
      // Validate schema
      const validated = insertContentSchema.parse(sanitized);
      
      // Override authorId with authenticated user ID
      validated.authorId = authenticatedUserId;
      
      // Validate price if provided
      if (validated.priceCoins !== undefined && validated.priceCoins !== null) {
        const priceValidation = validatePrice(validated.priceCoins);
        if (!priceValidation.valid) {
          return res.status(400).json({ error: priceValidation.error });
        }
      }
      
      // AUTO-GENERATE SEO METADATA
      const slug = await generateSlug(validated.title, 'content');
      const focusKeyword = generateFocusKeyword(validated.title);
      const metaDescription = generateMetaDescription(validated.description);
      const imageAltTexts = validated.images 
        ? generateImageAltTexts(validated.title, validated.images.length)
        : [];
      
      const content = await storage.createContent({
        ...validated,
      });
      
      // AWARD COINS: Publishing rewards based on content type
      let publishReward = 0;
      let rewardMemo = '';
      
      if (validated.type === 'ea' || validated.type === 'indicator') {
        publishReward = EARNING_REWARDS.PUBLISH_EA_INDICATOR;
        rewardMemo = `Published ${validated.type}: ${validated.title}`;
      } else if (validated.type === 'article') {
        publishReward = EARNING_REWARDS.PUBLISH_ARTICLE;
        rewardMemo = `Published article: ${validated.title}`;
      } else if (validated.files && validated.files.some((f) => f.name.endsWith('.set'))) {
        publishReward = EARNING_REWARDS.PUBLISH_SET_FILE;
        rewardMemo = `Shared set file: ${validated.title}`;
      }
      
      if (publishReward > 0) {
        try {
          await storage.beginLedgerTransaction(
            'earn',
            authenticatedUserId,
            [
              {
                userId: authenticatedUserId,
                direction: 'credit',
                amount: publishReward,
                memo: rewardMemo,
              },
              {
                userId: 'system',
                direction: 'debit',
                amount: publishReward,
                memo: 'Platform reward for content publishing',
              },
            ],
            { contentId: content.id, contentType: validated.type }
          );
        } catch (error) {
          console.error('Failed to award publishing coins:', error);
        }
      }

      // Track onboarding progress for first upload
      if (validated.type === 'ea' || validated.type === 'indicator') {
        try {
          await storage.trackOnboardingProgress(authenticatedUserId, 'firstUpload');
        } catch (error) {
          console.error('Onboarding tracking failed:', error);
        }
      }
      
      // Send content published email (fire-and-forget)
      (async () => {
        try {
          const user = await storage.getUser(authenticatedUserId);
          if (user?.username) {
            await emailService.sendProductPublished(
              user.username,
              validated.title,
              content.slug,
              validated.type
            );
          }
        } catch (emailError) {
          console.error('Failed to send content published email:', emailError);
        }
      })();
      
      res.json(content);
    } catch (error) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(400).json({ error: "Invalid content data" });
    }
  });
  
  // Get all content with filters
  app.get("/api/content", async (req, res) => {
    const filters = {
      type: req.query.type as string | undefined,
      category: req.query.category as string | undefined,
      status: req.query.status as string | undefined,
    };
    const content = await storage.getAllContent(filters);
    res.json(content);
  });
  
  // Get content by ID
  app.get("/api/content/:id", async (req, res) => {
    const content = await storage.getContent(req.params.id);
    if (!content) {
      return res.status(404).json({ error: "Content not found" });
    }
    
    // Update view count
    await storage.updateContentViews(req.params.id);
    
    res.json(content);
  });
  
  // Get content by slug
  app.get("/api/content/slug/:slug", async (req, res) => {
    const content = await storage.getContentBySlug(req.params.slug);
    if (!content) {
      return res.status(404).json({ error: "Content not found" });
    }
    
    // Update view count
    await storage.updateContentViews(content.id);
    
    res.json(content);
  });
  
  // Get user's published content
  app.get("/api/user/:userId/content", async (req, res) => {
    const content = await storage.getUserContent(req.params.userId);
    res.json(content);
  });
  
  // Purchase content (user-to-user transaction)
  app.post("/api/content/purchase", isAuthenticated, async (req, res) => {
    try {
      const buyerId = getAuthenticatedUserId(req);
      const { contentId } = req.body;

      if (!contentId) {
        return res.status(400).json({ error: "contentId is required" });
      }

      // Check if already purchased
      const alreadyPurchased = await storage.hasPurchased(buyerId, contentId);
      if (alreadyPurchased) {
        return res.status(400).json({ error: 'Already purchased this content' });
      }

      // Get content to check if it's free
      const item = await storage.getContent(contentId);
      if (!item) {
        return res.status(404).json({ error: 'Content not found' });
      }

      // Execute purchase (handles both free and paid content)
      const purchase = await storage.purchaseContent(contentId, buyerId);
      
      // Send purchase emails to both buyer and seller (fire-and-forget)
      (async () => {
        try {
          const buyer = await storage.getUser(buyerId);
          const seller = await storage.getUser(item.authorId);
          
          if (buyer?.username && item.priceCoins > 0) {
            // Send receipt to buyer
            const downloadUrl = `${process.env.BASE_URL}/content/${item.slug}`;
            await emailService.sendPurchaseReceipt(
              buyer.username,
              item.title,
              item.priceCoins,
              purchase.id,
              downloadUrl
            );
          }
          
          if (seller?.username && item.priceCoins > 0) {
            // Calculate seller earnings using commission rate (80/20 split)
            const contentType = item.type as keyof typeof calculateCommission;
            const commission = calculateCommission(item.priceCoins, contentType);
            
            // Send sale notification to seller
            await emailService.sendProductSold(
              seller.username,
              item.title,
              buyer?.username || 'A user',
              item.priceCoins,
              commission.sellerAmount
            );
          }
        } catch (emailError) {
          console.error('Failed to send purchase emails:', emailError);
        }
      })();
      
      res.json(purchase);
    } catch (error: any) {
      if (error.message === "Content not found") {
        return res.status(404).json({ error: "Content not found" });
      }
      if (error.message === "Already purchased") {
        return res.status(400).json({ error: "Already purchased this content" });
      }
      if (error.message === "Cannot purchase own content") {
        return res.status(400).json({ error: "Cannot purchase own content" });
      }
      if (error.message.includes('Insufficient balance')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('Overdraft')) {
        return res.status(400).json({ error: 'Insufficient coins for purchase' });
      }
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/content/:contentId/can-purchase - Check if user can purchase
  app.get("/api/content/:contentId/can-purchase", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { contentId } = req.params;

      // Check if already purchased
      const alreadyPurchased = await storage.hasPurchased(userId, contentId);
      if (alreadyPurchased) {
        return res.json({ canPurchase: false, reason: 'Already purchased' });
      }

      // Get content
      const item = await storage.getContent(contentId);
      if (!item) {
        return res.status(404).json({ error: 'Content not found' });
      }

      // Check if free
      if (item.isFree || item.priceCoins === 0) {
        return res.json({ canPurchase: true, isFree: true });
      }

      // Check balance
      const wallet = await storage.getUserWallet(userId);
      const canAfford = wallet && wallet.balance >= item.priceCoins;

      res.json({
        canPurchase: canAfford,
        isFree: false,
        price: item.priceCoins,
        userBalance: wallet?.balance || 0,
        reason: canAfford ? null : 'Insufficient balance',
      });
    } catch (error: any) {
      if (error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      if (error.message.includes("does not support ledger operations")) {
        // Fallback for MemStorage - check user totalCoins instead
        const item = await storage.getContent(req.params.contentId);
        if (!item) {
          return res.status(404).json({ error: 'Content not found' });
        }
        
        const user = await storage.getUser(getAuthenticatedUserId(req));
        const canAfford = user && user.totalCoins >= item.priceCoins;
        
        return res.json({
          canPurchase: canAfford,
          isFree: item.isFree || item.priceCoins === 0,
          price: item.priceCoins,
          userBalance: user?.totalCoins || 0,
          reason: canAfford ? null : 'Insufficient balance',
        });
      }
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get user's purchased content
  app.get("/api/user/:userId/purchases", async (req, res) => {
    const purchases = await storage.getUserPurchases(req.params.userId);
    res.json(purchases);
  });
  
  // Check if user has purchased content
  app.get("/api/content/:contentId/purchased/:userId", async (req, res) => {
    const hasPurchased = await storage.hasPurchased(
      req.params.userId,
      req.params.contentId
    );
    res.json({ hasPurchased });
  });
  
  // Create review (with coin reward)
  app.post("/api/content/review", isAuthenticated, reviewReplyLimiter, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      const validated = insertContentReviewSchema.parse(req.body);
      // Override userId with authenticated user ID
      validated.userId = authenticatedUserId;
      
      const review = await storage.createReview(validated);
      
      // Award 5 coins for review (pending moderation approval)
      // Note: Coins will be awarded when admin approves the review
      
      res.json(review);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Content not found") {
          return res.status(404).json({ error: "Content not found" });
        }
        if (error.message === "User not found") {
          return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Invalid review data" });
    }
  });
  
  // Get content reviews
  app.get("/api/content/:contentId/reviews", async (req, res) => {
    const reviews = await storage.getContentReviews(req.params.contentId);
    res.json(reviews);
  });
  
  // Like content (with coin reward)
  app.post("/api/content/like", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      const validated = insertContentLikeSchema.parse(req.body);
      // Override userId with authenticated user ID
      validated.userId = authenticatedUserId;
      
      const like = await storage.likeContent(validated);
      if (!like) {
        return res.status(400).json({ error: "Already liked" });
      }
      
      // Send like notification email (fire-and-forget)
      (async () => {
        try {
          const liker = await storage.getUser(authenticatedUserId);
          const content = await storage.getContent(validated.contentId);
          
          if (content && liker?.username) {
            const contentAuthor = await storage.getUser(content.authorId);
            
            // Don't send email if user likes their own content
            if (contentAuthor?.username && contentAuthor.id !== authenticatedUserId) {
              const contentUrl = `/content/${content.slug}`;
              await emailService.sendLikeNotification(
                contentAuthor.username,
                liker.username,
                content.type,
                content.title,
                contentUrl
              );
            }
          }
        } catch (emailError) {
          console.error('Failed to send like notification email:', emailError);
        }
      })();
      
      res.json(like);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Content not found") {
          return res.status(404).json({ error: "Content not found" });
        }
        if (error.message === "User not found") {
          return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "Daily like limit reached (5 per day)") {
          return res.status(429).json({ error: "Daily like limit reached" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Like failed" });
    }
  });
  
  // Check if user has liked content
  app.get("/api/content/:contentId/liked/:userId", async (req, res) => {
    const hasLiked = await storage.hasLiked(
      req.params.userId,
      req.params.contentId
    );
    res.json({ hasLiked });
  });

  // ===== CONTENT REPLIES ENDPOINTS =====
  
  // Create reply (threaded discussion)
  app.post("/api/content/reply", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      const validated = insertContentReplySchema.parse(req.body);
      // Override userId with authenticated user ID
      validated.userId = authenticatedUserId;
      
      const reply = await storage.createReply(validated);
      res.json(reply);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Content not found") {
          return res.status(404).json({ error: "Content not found" });
        }
        if (error.message === "User not found") {
          return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "Parent reply not found") {
          return res.status(404).json({ error: "Parent reply not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Invalid reply data" });
    }
  });
  
  // Get content replies (threaded)
  app.get("/api/content/:contentId/replies", async (req, res) => {
    const replies = await storage.getContentReplies(req.params.contentId);
    res.json(replies);
  });
  
  // Mark reply as helpful
  app.post("/api/content/reply/:replyId/helpful", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // Use authenticated user ID for tracking the vote
      // Note: Storage layer should track which users voted to prevent double-voting
      await storage.updateReplyHelpful(req.params.replyId);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Reply not found") {
          return res.status(404).json({ error: "Reply not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Failed to mark as helpful" });
    }
  });

  // ===== BROKER DIRECTORY ENDPOINTS =====
  
  // Create broker (admin or user submission)
  app.post("/api/brokers", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      const validated = insertBrokerSchema.parse(req.body);
      // Override submittedBy with authenticated user ID if it exists in schema
      if ('submittedBy' in validated) {
        (validated as any).submittedBy = authenticatedUserId;
      }
      
      const broker = await storage.createBroker(validated);
      res.json(broker);
    } catch (error) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(400).json({ error: "Invalid broker data" });
    }
  });
  
  // Get all brokers with filters
  app.get("/api/brokers", async (req, res) => {
    const filters = {
      isVerified: req.query.isVerified === "true" ? true : req.query.isVerified === "false" ? false : undefined,
      status: req.query.status as string | undefined,
    };
    const brokers = await storage.getAllBrokers(filters);
    res.json(brokers);
  });
  
  // Get broker by ID
  app.get("/api/brokers/:id", async (req, res) => {
    const broker = await storage.getBroker(req.params.id);
    if (!broker) {
      return res.status(404).json({ error: "Broker not found" });
    }
    res.json(broker);
  });
  
  // Get broker by slug
  app.get("/api/brokers/slug/:slug", async (req, res) => {
    const broker = await storage.getBrokerBySlug(req.params.slug);
    if (!broker) {
      return res.status(404).json({ error: "Broker not found" });
    }
    res.json(broker);
  });
  
  // Submit broker review
  app.post("/api/brokers/review", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      const validated = insertBrokerReviewSchema.parse(req.body);
      // Override userId with authenticated user ID
      validated.userId = authenticatedUserId;
      
      const review = await storage.createBrokerReview(validated);
      
      // Update broker's overall rating
      await storage.updateBrokerRating(validated.brokerId);
      
      // AWARD COINS: Only for normal reviews (NOT scam reports)
      // Scam reports require admin verification before awarding coins
      if (!validated.isScamReport) {
        try {
          await storage.beginLedgerTransaction(
            'earn',
            authenticatedUserId,
            [
              {
                userId: authenticatedUserId,
                direction: 'credit',
                amount: 50,
                memo: `Reviewed broker: ${validated.brokerId}`,
              },
              {
                userId: 'system',
                direction: 'debit',
                amount: 50,
                memo: 'Platform reward for broker review',
              },
            ],
            { reviewId: review.id, isScamReport: false }
          );
        } catch (error) {
          console.error('Failed to award review coins:', error);
        }
      }
      
      // Mark onboarding step
      try {
        await storage.markOnboardingStep(authenticatedUserId, 'firstReport');
      } catch (error) {
        console.error('Onboarding step failed:', error);
      }
      
      res.json(review);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Broker not found") {
          return res.status(404).json({ error: "Broker not found" });
        }
        if (error.message === "User not found") {
          return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Invalid review data" });
    }
  });

  // Alias for broker review endpoint (frontend compatibility)
  app.post("/api/broker-reviews", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      const validated = insertBrokerReviewSchema.parse(req.body);
      // Override userId with authenticated user ID
      validated.userId = authenticatedUserId;
      
      const review = await storage.createBrokerReview(validated);
      
      // Update broker's overall rating
      await storage.updateBrokerRating(validated.brokerId);
      
      // AWARD COINS: Only for normal reviews (NOT scam reports)
      if (!validated.isScamReport) {
        try {
          await storage.beginLedgerTransaction(
            'earn',
            authenticatedUserId,
            [
              {
                userId: authenticatedUserId,
                direction: 'credit',
                amount: 50,
                memo: `Reviewed broker: ${validated.brokerId}`,
              },
              {
                userId: 'system',
                direction: 'debit',
                amount: 50,
                memo: 'Platform reward for broker review',
              },
            ],
            { reviewId: review.id, isScamReport: false }
          );
        } catch (error) {
          console.error('Failed to award review coins:', error);
        }
      }
      
      // Mark onboarding step
      try {
        await storage.markOnboardingStep(authenticatedUserId, 'firstReport');
      } catch (error) {
        console.error('Onboarding step failed:', error);
      }
      
      res.json(review);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Broker not found") {
          return res.status(404).json({ error: "Broker not found" });
        }
        if (error.message === "User not found") {
          return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Invalid review data" });
    }
  });
  
  // Get broker reviews (with optional scam filter)
  app.get("/api/brokers/:brokerId/reviews", async (req, res) => {
    const filters = {
      isScamReport: req.query.isScamReport === "true" ? true : req.query.isScamReport === "false" ? false : undefined,
    };
    const reviews = await storage.getBrokerReviews(req.params.brokerId, filters);
    res.json(reviews);
  });

  // POST /api/admin/verify-scam-report/:reviewId - Verify scam report and award coins
  app.post("/api/admin/verify-scam-report/:reviewId", isAuthenticated, async (req, res) => {
    // TODO: Add proper admin check here
    // For now, we'll block this endpoint entirely for security
    return res.status(403).json({
      error: "Admin verification endpoint disabled pending admin role implementation"
    });

    /* DISABLED PENDING ADMIN SYSTEM
    const { reviewId } = req.params;
    const { approved } = req.body;

    try {
      const authenticatedUserId = getAuthenticatedUserId(req);

      // Get review
      const review = await storage.getBrokerReview(reviewId);
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      if (!review.isScamReport) {
        return res.status(400).json({ error: 'Not a scam report' });
      }

      if (review.status === 'approved') {
        return res.status(400).json({ error: 'Already verified' });
      }

      // Update review status
      await storage.updateBrokerReviewStatus(reviewId, approved ? 'approved' : 'rejected');

      // Award coins only if approved
      if (approved) {
        try {
          await storage.beginLedgerTransaction(
            'earn',
            review.userId,
            [
              {
                userId: review.userId,
                direction: 'credit',
                amount: 150,
                memo: `Verified scam report for broker: ${review.brokerId}`,
              },
              {
                userId: 'system',
                direction: 'debit',
                amount: 150,
                memo: 'Platform reward for verified scam report',
              },
            ],
            { reviewId: review.id, isScamReport: true, verified: true }
          );
        } catch (error: any) {
          return res.status(500).json({ error: 'Failed to award coins' });
        }
      }

      res.json({ message: approved ? 'Scam report verified' : 'Scam report rejected' });
    } catch (error) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(400).json({ error: 'Failed to process scam report verification' });
    }
    */
  });

  // ===== FORUM THREADS ENDPOINTS =====
  
  // Create forum thread
  app.post("/api/threads", isAuthenticated, contentCreationLimiter, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // Sanitize inputs - allow HTML in body only
      const sanitized = sanitizeRequestBody(req.body, ['body']);
      
      // Validate schema (includes title 15-90 chars, body 150+ words, caps detection)
      const validated = insertForumThreadSchema.parse(sanitized);
      
      // Override authorId with authenticated user ID
      validated.authorId = authenticatedUserId;
      
      // Validate word count (min 150 words)
      const wordCount = countWords(validated.body);
      if (wordCount < 150) {
        return res.status(400).json({ 
          error: "A little more context helps people reply. Two more sentences?" 
        });
      }
      
      // Generate full slug with category path
      const slug = generateFullSlug(
        validated.categorySlug,
        validated.subcategorySlug,
        validated.title
      );
      
      // Generate meta description
      const metaDescription = generateMetaDescription(
        validated.body,
        validated.seoExcerpt
      );
      
      // Generate focus keyword from title
      const focusKeyword = generateFocusKeyword(validated.title);
      
      // Deduplicate tags (max 12 total)
      const deduplicated = deduplicateTags(
        validated.instruments || [],
        validated.timeframes || [],
        validated.strategies || [],
        validated.hashtags || [],
        12
      );
      
      // Calculate coin reward
      // Base: +10 for thread creation
      // Bonus: +2 if optional details provided
      let coinReward = 10;
      const hasOptionalDetails = !!(
        validated.seoExcerpt ||
        validated.primaryKeyword ||
        validated.reviewRating ||
        validated.questionSummary
      );
      if (hasOptionalDetails) {
        coinReward += 2;
      }
      
      // Create thread with deduplicated tags and generated metadata
      const thread = await storage.createForumThread({
        ...validated,
        slug,
        focusKeyword,
        metaDescription,
        instruments: deduplicated.instruments,
        timeframes: deduplicated.timeframes,
        strategies: deduplicated.strategies,
        hashtags: deduplicated.hashtags,
        engagementScore: 0, // Initial score
      });
      
      // Award coins for thread creation
      try {
        await storage.beginLedgerTransaction(
          'thread_creation',
          authenticatedUserId,
          [
            {
              userId: authenticatedUserId,
              direction: 'credit',
              amount: coinReward,
              memo: hasOptionalDetails 
                ? `Thread created with bonus details: ${thread.title}`
                : `Thread created: ${thread.title}`,
            },
          ],
          { threadId: thread.id, baseReward: 10, bonusReward: hasOptionalDetails ? 2 : 0 }
        );
      } catch (error) {
        console.error('Failed to award coins for thread creation:', error);
      }
      
      // Create activity feed entry
      await storage.createActivity({
        userId: authenticatedUserId,
        activityType: "thread_created",
        entityType: "thread",
        entityId: thread.id,
        title: `Created thread: ${thread.title}`,
        description: thread.body.substring(0, 200),
      });
      
      // Update category stats
      await storage.updateCategoryStats(validated.categorySlug);
      
      // Mark onboarding step
      try {
        await storage.markOnboardingStep(authenticatedUserId, 'firstReply');
      } catch (error) {
        console.error('Onboarding step failed:', error);
      }
      
      res.json({
        thread,
        coinsEarned: coinReward,
        message: "Posted! We'll share it around and keep things tidy for you.",
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "User not found") {
          return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
        // Handle Zod validation errors with friendly messages
        if (error.name === "ZodError") {
          return res.status(400).json({ error: error.message });
        }
      }
      console.error('Thread creation error:', error);
      res.status(400).json({ error: "Invalid thread data" });
    }
  });
  
  // List forum threads with filters
  app.get("/api/threads", async (req, res) => {
    // Cache for 60 seconds
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    
    const sortBy = req.query.sortBy as string | undefined;
    const filters = {
      categorySlug: req.query.categorySlug as string | undefined,
      status: req.query.status as string | undefined,
      isPinned: req.query.isPinned === "true" ? true : req.query.isPinned === "false" ? false : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };
    
    let threads = await storage.listForumThreads(filters);
    
    // Apply sorting (clone array to avoid mutating storage data)
    if (sortBy === "trending") {
      const { getTrendingThreads } = await import("./algorithms/trending.js");
      threads = getTrendingThreads(threads, filters.limit);
    } else if (sortBy === "newest") {
      // Clone, sort by creation date (newest first), then limit
      threads = [...threads]
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, filters.limit);
    } else if (sortBy === "answered") {
      // Clone, filter for threads with replies, sort by reply count, then limit
      threads = [...threads]
        .filter((t: any) => t.replyCount > 0)
        .sort((a: any, b: any) => b.replyCount - a.replyCount)
        .slice(0, filters.limit);
    }
    
    res.json(threads);
  });

  // GET /api/threads/hot - Trending/hot threads (What's Hot) - MUST BE BEFORE /:id route
  app.get("/api/threads/hot", async (req, res) => {
    // Cache for 60 seconds
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    
    try {
      const threads = await storage.getAllForumThreads();
      
      // Get threads from last 7 days, sorted by engagement score
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const hotThreads = threads
        .filter((t: any) => new Date(t.createdAt) >= sevenDaysAgo)
        .sort((a: any, b: any) => (b.engagementScore || 0) - (a.engagementScore || 0))
        .slice(0, 10);
      
      const threadsWithAuthors = await Promise.all(hotThreads.map(async (thread: any) => {
        const author = await storage.getUserById(thread.authorId);
        return {
          ...thread,
          author: {
            id: author?.id,
            username: author?.username,
            profileImageUrl: author?.profileImageUrl
          }
        };
      }));
      
      res.json({
        threads: threadsWithAuthors,
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/threads/highlights - This week's highlights - MUST BE BEFORE /:id route
  app.get("/api/threads/highlights", async (req, res) => {
    // Cache for 60 seconds
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    
    try {
      const tab = req.query.tab as string || 'new';
      const threads = await storage.getAllForumThreads();
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      let filteredThreads = threads.filter((t: any) => new Date(t.createdAt) >= oneWeekAgo);
      
      // Sort based on tab
      if (tab === 'trending') {
        filteredThreads = filteredThreads.sort((a: any, b: any) => (b.engagementScore || 0) - (a.engagementScore || 0));
      } else if (tab === 'solved') {
        // TODO: Add solved status tracking
        filteredThreads = filteredThreads.sort((a: any, b: any) => b.replyCount - a.replyCount);
      } else {
        // new
        filteredThreads = filteredThreads.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      
      const highlights = filteredThreads.slice(0, 10);
      
      const threadsWithAuthors = await Promise.all(highlights.map(async (thread: any) => {
        const author = await storage.getUserById(thread.authorId);
        return {
          ...thread,
          author: {
            id: author?.id,
            username: author?.username,
            profileImageUrl: author?.profileImageUrl
          }
        };
      }));
      
      res.json({
        threads: threadsWithAuthors,
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get thread by ID
  app.get("/api/threads/:id", async (req, res) => {
    const thread = await storage.getForumThreadById(req.params.id);
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }
    res.json(thread);
  });
  
  // Get thread by slug (increments views)
  app.get("/api/threads/slug/:slug", async (req, res) => {
    const thread = await storage.getForumThreadBySlug(req.params.slug);
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }
    
    // Increment view count (TODO: implement in storage)
    // For now, this is a placeholder - views should be updated in storage layer
    
    res.json(thread);
  });
  
  // Get user's threads
  app.get("/api/user/:userId/threads", async (req, res) => {
    // TODO: Implement getUserThreads in storage layer
    // For now, using listForumThreads with filter
    const threads = await storage.listForumThreads({ limit: 100 });
    const userThreads = threads.filter(t => t.authorId === req.params.userId);
    res.json(userThreads);
  });

  // ===== FORUM REPLIES ENDPOINTS =====
  
  // Create reply
  app.post("/api/threads/:threadId/replies", isAuthenticated, reviewReplyLimiter, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // Sanitize inputs - allow HTML in body only
      const sanitized = sanitizeRequestBody(req.body, ['body']);
      
      // Validate schema
      const validated = insertForumReplySchema.parse({
        ...sanitized,
        threadId: req.params.threadId,
      });
      // Override userId/authorId with authenticated user ID
      validated.userId = authenticatedUserId;
      
      // AUTO-GENERATE SEO METADATA
      const replyPreview = validated.body.substring(0, 50);
      const slug = await generateSlug(
        `reply-${replyPreview}-${Date.now()}`, 
        'reply'
      );
      const metaDescription = generateMetaDescription(validated.body);
      
      const reply = await storage.createForumReply({
        ...validated,
      });
      
      // Update thread reply count and activity
      await storage.updateForumThreadReplyCount(req.params.threadId, 1);
      await storage.updateForumThreadActivity(req.params.threadId);
      
      // Update category stats
      const thread = await storage.getForumThreadById(req.params.threadId);
      if (thread) {
        await storage.updateCategoryStats(thread.categorySlug);
      }
      
      // Create activity feed entry
      await storage.createActivity({
        userId: authenticatedUserId,
        activityType: "reply_posted",
        entityType: "reply",
        entityId: reply.id,
        title: `Replied to thread`,
        description: reply.body.substring(0, 200),
      });
      
      // Track onboarding progress for first reply
      try {
        const onboardingResult = await storage.trackOnboardingProgress(authenticatedUserId, 'firstReply');
        if (onboardingResult.completed && onboardingResult.coinsEarned > 0) {
          // Send thread reply email (fire-and-forget)
          (async () => {
            try {
              const replier = await storage.getUser(authenticatedUserId);
              const thread = await storage.getForumThreadById(req.params.threadId);
              
              if (thread && replier?.username) {
                const threadAuthor = await storage.getUser(thread.authorId);
                
                // Don't send email if user replies to their own thread
                if (threadAuthor?.username && threadAuthor.id !== authenticatedUserId) {
                  const replyPreview = validated.body.replace(/<[^>]*>/g, '').substring(0, 200);
                  await emailService.sendThreadReply(
                    threadAuthor.username,
                    replier.username,
                    thread.title,
                    replyPreview,
                    thread.slug
                  );
                }
              }
            } catch (emailError) {
              console.error('Failed to send thread reply email:', emailError);
            }
          })();
          
          return res.json({ 
            ...reply, 
            onboardingReward: {
              task: 'firstReply',
              coinsEarned: onboardingResult.coinsEarned 
            }
          });
        }
      } catch (error) {
        console.error('Onboarding tracking failed:', error);
      }
      
      // Send thread reply email (fire-and-forget)
      (async () => {
        try {
          const replier = await storage.getUser(authenticatedUserId);
          const thread = await storage.getForumThreadById(req.params.threadId);
          
          if (thread && replier?.username) {
            const threadAuthor = await storage.getUser(thread.authorId);
            
            // Don't send email if user replies to their own thread
            if (threadAuthor?.username && threadAuthor.id !== authenticatedUserId) {
              const replyPreview = validated.body.replace(/<[^>]*>/g, '').substring(0, 200);
              await emailService.sendThreadReply(
                threadAuthor.username,
                replier.username,
                thread.title,
                replyPreview,
                thread.slug
              );
            }
          }
        } catch (emailError) {
          console.error('Failed to send thread reply email:', emailError);
        }
      })();
      
      res.json(reply);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Thread not found") {
          return res.status(404).json({ error: "Thread not found" });
        }
        if (error.message === "User not found") {
          return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "Parent reply not found") {
          return res.status(404).json({ error: "Parent reply not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Invalid reply data" });
    }
  });
  
  // List thread replies
  app.get("/api/threads/:threadId/replies", async (req, res) => {
    const replies = await storage.listForumReplies(req.params.threadId);
    res.json(replies);
  });
  
  // Mark reply as accepted answer
  app.post("/api/replies/:replyId/accept", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // TODO: Verify that the authenticated user is the thread author before allowing accept
      // For now, we're allowing the accept action, but storage layer should verify ownership
      const reply = await storage.markReplyAsAccepted(req.params.replyId);
      
      if (reply) {
        // AWARD COINS: +25 for accepted answer
        try {
          await storage.beginLedgerTransaction(
            'earn',
            reply.userId,
            [
              {
                userId: reply.userId,
                direction: 'credit',
                amount: 25,
                memo: 'Answer accepted by thread author',
              },
              {
                userId: 'system',
                direction: 'debit',
                amount: 25,
                memo: 'Platform reward for accepted answer',
              },
            ],
            { replyId: reply.id, threadId: reply.threadId }
          );
        } catch (error) {
          console.error('Failed to award accepted answer coins:', error);
        }
      }
      
      res.json(reply);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Reply not found") {
          return res.status(404).json({ error: "Reply not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Failed to mark as accepted" });
    }
  });
  
  // Mark reply as helpful
  app.post("/api/replies/:replyId/helpful", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // Use authenticated user ID for tracking the vote
      // Note: Storage layer should track which users voted to prevent double-voting
      const reply = await storage.markReplyAsHelpful(req.params.replyId);
      
      if (reply) {
        // AWARD COINS: +5 for helpful reply
        try {
          await storage.beginLedgerTransaction(
            'earn',
            reply.userId,
            [
              {
                userId: reply.userId,
                direction: 'credit',
                amount: 5,
                memo: 'Reply marked as helpful',
              },
              {
                userId: 'system',
                direction: 'debit',
                amount: 5,
                memo: 'Platform reward for helpful contribution',
              },
            ],
            { replyId: reply.id }
          );
        } catch (error) {
          console.error('Failed to award helpful coins:', error);
        }
        
        // Check and award badges after marking reply as helpful
        try {
          await storage.checkAndAwardBadges(reply.userId);
        } catch (error) {
          console.error('Badge check failed:', error);
        }
      }
      
      res.json(reply);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Reply not found") {
          return res.status(404).json({ error: "Reply not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Failed to mark as helpful" });
    }
  });

  // ===== FORUM CATEGORIES ENDPOINTS =====
  
  // List all categories
  app.get("/api/categories", async (req, res) => {
    // Cache for 5 minutes
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    
    const categories = await storage.listForumCategories();
    // Filter to active categories only
    const activeCategories = categories.filter((c: any) => c.isActive);
    res.json(activeCategories);
  });
  
  // Get category by slug
  app.get("/api/categories/:slug", async (req, res) => {
    const category = await storage.getForumCategoryBySlug(req.params.slug);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(category);
  });
  
  // Get threads in category with filtering
  app.get("/api/categories/:slug/threads", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const tab = req.query.tab as string | undefined; // latest | trending | answered
    const searchQuery = req.query.q as string | undefined;
    
    let threads = await storage.listForumThreads({ 
      categorySlug: req.params.slug,
      limit: 100 // Fetch more for filtering
    });
    
    // Apply search filter if query exists
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      threads = threads.filter((t: any) => 
        t.title.toLowerCase().includes(query) || 
        (t.metaDescription && t.metaDescription.toLowerCase().includes(query))
      );
    }
    
    // Apply tab-specific filtering and sorting
    if (tab === "trending") {
      const { getTrendingThreads } = await import("./algorithms/trending.js");
      threads = getTrendingThreads(threads, limit);
    } else if (tab === "answered") {
      // Filter for threads with accepted replies or replies > 0
      threads = threads
        .filter((t: any) => t.replyCount > 0 || t.isSolved)
        .sort((a: any, b: any) => b.replyCount - a.replyCount)
        .slice(0, limit);
    } else {
      // Default: latest (by lastActivityAt)
      threads = threads
        .sort((a: any, b: any) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())
        .slice(0, limit);
    }
    
    res.json(threads);
  });
  
  // Get category tree (main categories with their subcategories)
  app.get("/api/categories/tree/all", async (req, res) => {
    // Cache for 5 minutes
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    
    try {
      const categories = await storage.listForumCategories();
      const activeCategories = categories.filter((c: any) => c.isActive);
      
      // Build hierarchical tree structure
      const mainCategories = activeCategories.filter((c: any) => !c.parentSlug);
      const tree = mainCategories.map((main: any) => ({
        ...main,
        children: activeCategories.filter((c: any) => c.parentSlug === main.slug)
      }));
      
      res.json(tree);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category tree" });
    }
  });
  
  // Get subcategories for a parent category
  app.get("/api/categories/:parentSlug/subcategories", async (req, res) => {
    try {
      const categories = await storage.listForumCategories();
      const subcategories = categories.filter((c: any) => 
        c.parentSlug === req.params.parentSlug && c.isActive
      );
      res.json(subcategories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subcategories" });
    }
  });
  
  // Get category with its children
  app.get("/api/categories/:slug/with-children", async (req, res) => {
    try {
      const category = await storage.getForumCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      const categories = await storage.listForumCategories();
      const children = categories.filter((c: any) => c.parentSlug === req.params.slug && c.isActive);
      
      res.json({
        ...category,
        children
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category with children" });
    }
  });

  // ===== USER BADGES ENDPOINTS =====
  
  // Get user's badges
  app.get("/api/user/:userId/badges", async (req, res) => {
    const badges = await storage.getUserBadges(req.params.userId);
    res.json(badges);
  });
  
  // Award badge (admin only - TODO: add auth check)
  app.post("/api/user/:userId/badges", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      const { badgeType } = req.body;
      if (!badgeType) {
        return res.status(400).json({ error: "Badge type is required" });
      }
      
      // SECURITY: Use authenticated user ID instead of param userId
      // This prevents users from awarding badges to other users
      // TODO: Add admin role check if this should be admin-only
      
      // Check if user already has this badge
      const hasBadge = await storage.hasUserBadge(authenticatedUserId, badgeType);
      if (hasBadge) {
        return res.status(400).json({ error: "User already has this badge" });
      }
      
      const badge = await storage.createUserBadge(authenticatedUserId, badgeType);
      
      // Create activity feed entry
      await storage.createActivity({
        userId: authenticatedUserId,
        activityType: "badge_earned",
        entityType: "badge",
        entityId: badge.id,
        title: `Earned badge: ${badgeType}`,
        description: undefined,
      });
      
      res.json(badge);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "User not found") {
          return res.status(404).json({ error: "User not found" });
        }
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
      }
      res.status(400).json({ error: "Failed to award badge" });
    }
  });

  // ===== ACTIVITY FEED ENDPOINTS =====
  
  // Get recent site activity
  app.get("/api/activity", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const activities = await storage.getRecentActivity(limit);
    res.json(activities);
  });
  
  // Get user's activity
  app.get("/api/user/:userId/activity", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const activities = await storage.getUserActivity(req.params.userId, limit);
    res.json(activities);
  });

  // ===== LEADERBOARD ENDPOINTS =====
  
  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    const type = (req.query.type as "coins" | "contributions" | "uploads") || "coins";
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    if (!["coins", "contributions", "uploads"].includes(type)) {
      return res.status(400).json({ error: "Invalid leaderboard type" });
    }
    
    const users = await storage.getLeaderboard(type, limit);
    res.json(users);
  });

  // ===== USER FOLLOWS ENDPOINTS =====
  
  // Follow user
  app.post("/api/users/:userId/follow", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      const validated = insertUserFollowSchema.parse({
        followerId: authenticatedUserId, // Always use authenticated user as follower
        followingId: req.params.userId,
      });
      
      if (validated.followerId === validated.followingId) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }
      
      const isFollowing = await storage.checkIfFollowing(validated.followerId, validated.followingId);
      if (isFollowing) {
        return res.status(400).json({ error: "Already following" });
      }
      
      const userFollow = await storage.createUserFollow(validated);
      
      // Send follow notification email (fire-and-forget)
      (async () => {
        try {
          const follower = await storage.getUser(validated.followerId);
          const followedUser = await storage.getUser(validated.followingId);
          
          if (follower?.username && followedUser?.username) {
            await emailService.sendFollowNotification(
              followedUser.username,
              follower.username,
              follower.username
            );
          }
        } catch (emailError) {
          console.error('Failed to send follow notification email:', emailError);
        }
      })();
      
      res.json(userFollow);
    } catch (error) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(400).json({ error: "Invalid follow data" });
    }
  });
  
  // Unfollow user
  app.delete("/api/users/:userId/unfollow", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // Always use authenticated user as the follower (who is unfollowing)
      await storage.deleteUserFollow(authenticatedUserId, req.params.userId);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(400).json({ error: "Failed to unfollow user" });
    }
  });
  
  // Get followers
  app.get("/api/users/:userId/followers", async (req, res) => {
    try {
      const followers = await storage.getUserFollowers(req.params.userId);
      res.json(followers);
    } catch (error) {
      res.status(500).json({ error: "Failed to get followers" });
    }
  });
  
  // Get following list
  app.get("/api/users/:userId/following", async (req, res) => {
    try {
      const following = await storage.getUserFollowing(req.params.userId);
      res.json(following);
    } catch (error) {
      res.status(500).json({ error: "Failed to get following list" });
    }
  });
  
  // Check if following
  app.get("/api/user/:userId/follows/:targetUserId", async (req, res) => {
    try {
      const isFollowing = await storage.checkIfFollowing(
        req.params.userId,
        req.params.targetUserId
      );
      res.json({ isFollowing });
    } catch (error) {
      res.status(500).json({ error: "Failed to check following status" });
    }
  });

  // ===== PRIVATE MESSAGES ENDPOINTS =====
  
  // Send message
  app.post("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      const validated = insertMessageSchema.parse(req.body);
      
      const message = await storage.sendMessage(
        authenticatedUserId,
        validated.recipientId,
        validated.body
      );
      
      // Send new message email (fire-and-forget)
      (async () => {
        try {
          const sender = await storage.getUser(authenticatedUserId);
          const recipient = await storage.getUser(validated.recipientId);
          
          if (sender?.username && recipient?.username) {
            const messagePreview = validated.body.replace(/<[^>]*>/g, '').substring(0, 200);
            await emailService.sendNewMessage(
              recipient.username,
              sender.username,
              sender.username,
              messagePreview
            );
          }
        } catch (emailError) {
          console.error('Failed to send new message email:', emailError);
        }
      })();
      
      res.json(message);
    } catch (error) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(400).json({ error: "Invalid message data" });
    }
  });
  
  // List user's conversations
  app.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const conversations = await storage.getConversations(authenticatedUserId);
      res.json(conversations);
    } catch (error) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(500).json({ error: "Failed to get conversations" });
    }
  });
  
  // Get conversation messages
  app.get("/api/conversations/:conversationId", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const messages = await storage.getConversationMessages(
        req.params.conversationId,
        authenticatedUserId
      );
      res.json(messages);
    } catch (error: any) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      if (error.message === "Conversation not found") {
        return res.status(404).json({ error: "Conversation not found" });
      }
      if (error.message === "Unauthorized") {
        return res.status(403).json({ error: "Unauthorized" });
      }
      res.status(500).json({ error: "Failed to get messages" });
    }
  });
  
  // Mark message as read
  app.post("/api/messages/:messageId/read", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      await storage.markMessageAsRead(req.params.messageId, authenticatedUserId);
      
      res.json({ success: true });
    } catch (error: any) {
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      if (error.message === "Message not found") {
        return res.status(404).json({ error: "Message not found" });
      }
      if (error.message === "Unauthorized") {
        return res.status(403).json({ error: "Unauthorized" });
      }
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  // Message reactions - COMMENTED OUT: These methods don't exist in MemStorage interface
  /* app.post("/api/messages/:messageId/reactions", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const { emoji } = req.body;
      
      if (!emoji || typeof emoji !== 'string') {
        return res.status(400).json({ error: "Emoji required" });
      }

      await storage.addMessageReaction(req.params.messageId, authenticatedUserId, emoji);
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding reaction:", error);
      res.status(500).json({ error: "Failed to add reaction" });
    }
  });

  // Remove reaction from message
  app.delete("/api/messages/:messageId/reactions/:emoji", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      await storage.removeMessageReaction(req.params.messageId, authenticatedUserId, req.params.emoji);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing reaction:", error);
      res.status(500).json({ error: "Failed to remove reaction" });
    }
  });

  // Get message reactions
  app.get("/api/messages/:messageId/reactions", async (req, res) => {
    try {
      const reactions = await storage.getMessageReactions(req.params.messageId);
      res.json(reactions);
    } catch (error) {
      console.error("Error getting reactions:", error);
      res.status(500).json({ error: "Failed to get reactions" });
    }
  });

  // Search messages
  app.get("/api/messages/search", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const { q, userId: filterUserId } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Search query required" });
      }

      const results = await storage.searchMessages(authenticatedUserId, q, filterUserId as string);
      res.json(results);
    } catch (error) {
      console.error("Error searching messages:", error);
      res.status(500).json({ error: "Failed to search messages" });
    }
  }); */

  // ===== USER PROFILES ENDPOINTS =====
  // NOTE: The /api/user/:username/profile route is defined later in this file (around line 3474)
  // It handles fetching user profiles by username
  
  // Update user profile
  app.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const validated = updateUserProfileSchema.parse(req.body);
      
      // Separate fields for users table vs profiles table
      const userFields: any = {};
      const profileFields: any = {};
      
      // User table fields
      if (validated.displayName) userFields.username = validated.displayName;
      if (validated.email) userFields.email = validated.email;
      if (validated.location !== undefined) userFields.location = validated.location || null;
      if (validated.youtubeUrl !== undefined) userFields.youtubeUrl = validated.youtubeUrl || null;
      if (validated.instagramHandle !== undefined) userFields.instagramHandle = validated.instagramHandle || null;
      if (validated.telegramHandle !== undefined) userFields.telegramHandle = validated.telegramHandle || null;
      if (validated.myfxbookLink !== undefined) userFields.myfxbookLink = validated.myfxbookLink || null;
      if (validated.investorId !== undefined) userFields.investorId = validated.investorId || null;
      if (validated.investorPassword !== undefined) userFields.investorPassword = validated.investorPassword || null;
      if (validated.emailNotifications !== undefined) userFields.emailNotifications = validated.emailNotifications;
      
      // Profile table fields
      if (validated.bio !== undefined) profileFields.bio = validated.bio || null;
      if (validated.website !== undefined) profileFields.website = validated.website || null;
      
      // Update user fields
      const updatedUser = await storage.updateUserProfile(authenticatedUserId, userFields);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Update profile fields if any
      if (Object.keys(profileFields).length > 0) {
        await db.insert(profiles).values({
          userId: authenticatedUserId,
          ...profileFields,
        }).onConflictDoUpdate({
          target: [profiles.userId],
          set: { ...profileFields, updatedAt: new Date() },
        });
      }

      let totalCoinsEarned = 0;
      const completedTasks: string[] = [];

      // Track onboarding progress for profile completion
      const hasProfileData = 
        (validated.youtubeUrl && validated.youtubeUrl.length > 0) ||
        (validated.instagramHandle && validated.instagramHandle.length > 0) ||
        (validated.telegramHandle && validated.telegramHandle.length > 0) ||
        (validated.myfxbookLink && validated.myfxbookLink.length > 0) ||
        (validated.bio && validated.bio.length > 0);

      if (hasProfileData) {
        const profileResult = await storage.trackOnboardingProgress(authenticatedUserId, "profileCreated");
        if (profileResult.completed && profileResult.coinsEarned > 0) {
          totalCoinsEarned += profileResult.coinsEarned;
          completedTasks.push("profileCreated");
        }
      }

      // Track social account linking if user added social links
      const hasSocialLinks =
        (validated.youtubeUrl && validated.youtubeUrl.length > 0) ||
        (validated.instagramHandle && validated.instagramHandle.length > 0) ||
        (validated.telegramHandle && validated.telegramHandle.length > 0);

      if (hasSocialLinks) {
        const socialResult = await storage.trackOnboardingProgress(authenticatedUserId, "socialLinked");
        if (socialResult.completed && socialResult.coinsEarned > 0) {
          totalCoinsEarned += socialResult.coinsEarned;
          completedTasks.push("socialLinked");
        }
      }
      
      // Return consistent response with onboarding reward info
      res.json({ 
        success: true, 
        user: updatedUser, 
        ...(totalCoinsEarned > 0 && {
          onboardingReward: {
            tasks: completedTasks,
            totalCoinsEarned
          }
        })
      });
    } catch (error) {
      console.error("Profile update error:", error);
      if (error instanceof Error && error.message === "No authenticated user") {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid profile data" });
    }
  });

  // Upload profile photo
  app.post("/api/user/upload-photo", isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Additional security: verify file is an image
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      if (!imageExtensions.includes(fileExt)) {
        // Delete the uploaded file if it's not an image
        const fs = await import('fs/promises');
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ error: "Only image files are allowed for profile photos" });
      }

      const authenticatedUserId = getAuthenticatedUserId(req);
      const photoUrl = `/uploads/${req.file.filename}`;
      
      // Update user's profile image
      await storage.updateUserProfile(authenticatedUserId, {
        profileImageUrl: photoUrl,
      });

      res.json({ 
        success: true,
        photoUrl,
        message: "Profile photo updated successfully"
      });
    } catch (error: any) {
      console.error('Profile photo upload error:', error);
      res.status(500).json({ error: error.message || "Failed to upload photo" });
    }
  });

  // ===== SEARCH ENDPOINTS =====
  
  // Global search
  app.get("/api/search", async (req, res) => {
    const query = req.query.q as string;
    const type = req.query.type as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: "Search query must be at least 2 characters" });
    }
    
    // TODO: Implement searchGlobal in storage layer
    // For now, basic search implementation
    const results: {
      threads: any[];
      content: any[];
      users: any[];
    } = {
      threads: [],
      content: [],
      users: [],
    };
    
    // If type is specified, only search that type
    if (!type || type === "threads") {
      const threads = await storage.listForumThreads({ limit: 100 });
      results.threads = threads
        .filter(t => 
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.body.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit);
    }
    
    if (!type || type === "content") {
      const content = await storage.getAllContent({});
      results.content = content
        .filter(c => 
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit);
    }
    
    // Users search would require getAllUsers method
    if (!type || type === "users") {
      // TODO: Implement user search in storage layer
      results.users = [];
    }
    
    res.json(results);
  });

  // ===== LEADERBOARD ENDPOINTS =====
  
  // GET /api/leaderboards/coins - Top users by coin balance
  app.get("/api/leaderboards/coins", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    
    try {
      const topUsers = await storage.getTopUsersByCoins(limit);
      res.json(topUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/leaderboards/contributors - Top users by helpful/accepted replies
  app.get("/api/leaderboards/contributors", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    
    try {
      const topContributors = await storage.getTopContributors(limit);
      res.json(topContributors);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/leaderboards/sellers - Top sellers by revenue
  app.get("/api/leaderboards/sellers", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    
    try {
      const topSellers = await storage.getTopSellers(limit);
      res.json(topSellers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== RANKING SYSTEM ENDPOINTS (Real-time Updates) =====
  
  // GET /api/stats - Platform statistics for stats bar
  app.get("/api/stats", async (req, res) => {
    // Cache for 30 seconds
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    
    try {
      // Parallel fetching for better performance
      const [threads, users, content] = await Promise.all([
        storage.getAllForumThreads(),
        storage.getAllUsers(),
        storage.getAllContent()
      ]);
      
      // Calculate today's activity
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayThreads = threads.filter(t => new Date(t.createdAt) >= today).length;
      const todayContent = content.filter(c => new Date(c.createdAt) >= today).length;
      
      // Total replies from all threads
      const totalReplies = threads.reduce((sum, t) => sum + t.replyCount, 0);
      
      res.json({
        totalThreads: threads.length,
        totalMembers: users.length,
        totalPosts: totalReplies,
        totalContent: content.length,
        todayActivity: {
          threads: todayThreads,
          content: todayContent,
        },
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/leaderboard - Top users by reputation score
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Sort by reputation score
      const sorted = users
        .sort((a, b) => (b.reputationScore || 0) - (a.reputationScore || 0))
        .slice(0, 50);
      
      const leaderboard = await Promise.all(sorted.map(async (user, index) => {
        const stats = await storage.getUserStats(user.id);
        return {
          rank: index + 1,
          id: user.id,
          username: user.username,
          profileImageUrl: user.profileImageUrl,
          reputationScore: user.reputationScore || 0,
          threadsCreated: stats.threadsCreated,
          repliesPosted: stats.repliesPosted,
          isVerifiedTrader: user.isVerifiedTrader
        };
      }));
      
      res.json({
        leaderboard,
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/content/top-sellers - Top selling EAs/Indicators
  app.get("/api/content/top-sellers", async (req, res) => {
    try {
      const content = await storage.getAllContent({ status: 'approved' });
      
      // Sort by sales score
      const topSellers = content
        .sort((a, b) => (b.salesScore || 0) - (a.salesScore || 0))
        .slice(0, 10);
      
      const sellersWithStats = await Promise.all(topSellers.map(async (item) => {
        const author = await storage.getUserById(item.authorId);
        const salesStats = await storage.getContentSalesStats(item.id);
        
        return {
          id: item.id,
          title: item.title,
          type: item.type,
          priceCoins: item.priceCoins,
          isFree: item.isFree,
          salesScore: item.salesScore || 0,
          totalSales: salesStats.totalSales,
          avgRating: salesStats.avgRating,
          reviewCount: salesStats.reviewCount,
          downloads: item.downloads,
          author: {
            id: author?.id,
            username: author?.username,
            profileImageUrl: author?.profileImageUrl
          }
        };
      }));
      
      res.json({
        topSellers: sellersWithStats,
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // DASHBOARD ANALYTICS APIS
  // ============================================

  app.get("/api/me/sales-dashboard", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const days = parseInt(req.query.days as string) || 30;
      const data = await storage.getSalesDashboard(userId, days);
      res.json(data);
    } catch (error) {
      console.error("Error fetching sales dashboard:", error);
      res.status(500).json({ error: "Failed to fetch sales dashboard" });
    }
  });

  app.get("/api/me/referrals", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const referrals = await storage.getReferrals(userId);
      res.json(referrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ error: "Failed to fetch referrals" });
    }
  });

  app.get("/api/me/referral-stats", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const stats = await storage.getReferralStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ error: "Failed to fetch referral stats" });
    }
  });

  app.post("/api/me/generate-referral-code", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const code = await storage.generateReferralCode(userId);
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.EXPRESS_URL || 'http://localhost:5000';
      res.json({ code, link: `${siteUrl}/ref/${code}` });
    } catch (error) {
      console.error("Error generating referral code:", error);
      res.status(500).json({ error: "Failed to generate referral code" });
    }
  });

  app.get("/api/me/earnings-breakdown", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const breakdown = await storage.getEarningsBreakdown(userId);
      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching earnings breakdown:", error);
      res.status(500).json({ error: "Failed to fetch earnings breakdown" });
    }
  });

  app.get("/api/me/goals", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.post("/api/me/goals", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const goal = await storage.createGoal(userId, req.body);
      res.json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  app.get("/api/me/achievements", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.get("/api/me/campaigns", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const campaigns = await storage.getCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.get("/api/me/customers", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const customers = await storage.getCustomerList(userId);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/me/dashboard-settings", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const settings = await storage.getDashboardSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching dashboard settings:", error);
      res.status(500).json({ error: "Failed to fetch dashboard settings" });
    }
  });

  // ============================================
  // USER SETTINGS APIS
  // ============================================

  app.get("/api/me/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ error: "Failed to fetch user settings" });
    }
  });

  app.put("/api/me/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      await storage.updateUserSettings(userId, req.body);
      res.json({ success: true, message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ error: "Failed to update user settings" });
    }
  });

  // ============================================
  // PROFILE APIS
  // ============================================

  app.get("/api/user/:username/profile", async (req, res) => {
    try {
      const username = req.params.username;
      
      // Get user by username
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if authenticated user is following this user
      let isFollowing = false;
      if (req.isAuthenticated()) {
        const claims = (req.user as any)?.claims;
        if (claims?.sub && claims.sub !== user.id) {
          const follow = await storage.getFollow(claims.sub, user.id);
          isFollowing = !!follow;
        }
      }

      // Fetch all profile data in parallel
      const content: any[] = await storage.getUserContent(user.id).catch(() => []);
      const [badges, threads] = await Promise.all([
        storage.getUserBadges(user.id).catch(() => []),
        storage.getUserThreads(user.id).catch(() => []),
      ]);
      
      // Get reviews for this user's content
      const reviewContent: any[] = content.filter((c: any) => c.sellerId === user.id);
      const reviews: any[] = [];

      // Calculate stats
      const totalRevenue = content.reduce((sum: number, c: any) => sum + ((c.priceCoins || 0) * (c.downloads || 0)), 0);
      const totalSales = content.reduce((sum: number, c: any) => sum + (c.downloads || 0), 0);
      const totalDownloads = content.reduce((sum: number, c: any) => sum + (c.downloads || 0), 0);
      
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      // Calculate rating breakdown
      const ratingBreakdown = {
        averageRating,
        totalReviews: reviews.length,
        breakdown: {
          5: reviews.filter(r => r.rating === 5).length,
          4: reviews.filter(r => r.rating === 4).length,
          3: reviews.filter(r => r.rating === 3).length,
          2: reviews.filter(r => r.rating === 2).length,
          1: reviews.filter(r => r.rating === 1).length,
        }
      };

      // Build comprehensive profile response
      const profileData = {
        user,
        isFollowing,
        badges,
        content,
        stats: {
          followers: 0, // TODO: Implement follower count
          following: 0, // TODO: Implement following count
          posts: threads.length,
          content: content.length,
          totalRevenue,
          totalSales,
          averageRating,
          totalDownloads,
        },
        reviews: reviews.slice(0, 10), // Limit to 10 most recent
        ratingBreakdown
      };

      res.json(profileData);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.put("/api/me/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      const profile = await storage.updateProfile(userId, req.body);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // ============================================
  // ADMIN ROUTES - Use only existing storage methods
  // ============================================

  // Admin System Settings
  app.get('/api/admin/settings', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const category = req.query.category as string | undefined;
      const settings = await storage.getSystemSettings(category);
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  });

  app.get('/api/admin/settings/:key', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const setting = await storage.getSystemSetting(req.params.key);
      res.json(setting);
    } catch (error) {
      console.error('Error fetching setting:', error);
      res.status(500).json({ message: 'Failed to fetch setting' });
    }
  });

  app.patch('/api/admin/settings/:key', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const userId = getAuthenticatedUserId(req);
      await storage.updateSystemSetting(req.params.key, req.body.value, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating setting:', error);
      res.status(500).json({ message: 'Failed to update setting' });
    }
  });

  // Admin Support Tickets
  app.get('/api/admin/support/tickets', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const filters = {
        status: req.query.status as string | undefined,
        priority: req.query.priority as string | undefined,
        assignedTo: req.query.assignedTo as string | undefined,
      };
      const tickets = await storage.getSupportTickets(filters);
      res.json(tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({ message: 'Failed to fetch tickets' });
    }
  });

  app.post('/api/admin/support/tickets', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const ticket = await storage.createSupportTicket(req.body);
      res.json(ticket);
    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(500).json({ message: 'Failed to create ticket' });
    }
  });

  app.patch('/api/admin/support/tickets/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const adminUserId = getAuthenticatedUserId(req);
      await storage.updateSupportTicket(parseInt(req.params.id), req.body, adminUserId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating ticket:', error);
      res.status(500).json({ message: 'Failed to update ticket' });
    }
  });

  // Admin Announcements
  app.get('/api/admin/announcements', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const filters = {
        isActive: req.query.isActive === 'true',
        targetAudience: req.query.targetAudience as string | undefined,
      };
      const announcements = await storage.getAnnouncements(filters);
      res.json(announcements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({ message: 'Failed to fetch announcements' });
    }
  });

  app.post('/api/admin/announcements', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const announcement = await storage.createAnnouncement(req.body);
      res.json(announcement);
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ message: 'Failed to create announcement' });
    }
  });

  app.patch('/api/admin/announcements/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await storage.updateAnnouncement(parseInt(req.params.id), req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating announcement:', error);
      res.status(500).json({ message: 'Failed to update announcement' });
    }
  });

  app.delete('/api/admin/announcements/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await storage.deleteAnnouncement(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      res.status(500).json({ message: 'Failed to delete announcement' });
    }
  });

  // Admin Create Marketplace Content
  app.post('/api/admin/content', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      
      // Sanitize inputs - allow HTML in description
      const sanitized = sanitizeRequestBody(req.body, ['description']);
      
      // Validate schema
      const validated = insertContentSchema.parse(sanitized);
      
      // Override authorId with authenticated admin user ID
      validated.authorId = authenticatedUserId;
      
      // AUTO-GENERATE SEO METADATA
      const slug = await generateSlug(validated.title, 'content');
      const focusKeyword = generateFocusKeyword(validated.title);
      const metaDescription = generateMetaDescription(validated.description);
      const imageAltTexts = validated.images 
        ? generateImageAltTexts(validated.title, validated.images.length)
        : [];
      
      // Admin-created content is automatically approved
      const content = await storage.createContent({
        ...validated,
        slug,
        focusKeyword,
        autoMetaDescription: metaDescription,
        autoImageAltTexts: imageAltTexts,
      });
      
      res.json(content);
    } catch (error) {
      console.error('Error creating admin content:', error);
      if (error instanceof Error) {
        if (error.message === "No authenticated user") {
          return res.status(401).json({ error: "Not authenticated" });
        }
        // Return Zod validation errors
        if (error.name === "ZodError") {
          return res.status(400).json({ 
            error: "Validation failed", 
            details: (error as any).errors 
          });
        }
      }
      res.status(500).json({ message: 'Failed to create content' });
    }
  });

  // Admin Email Templates
  app.get('/api/admin/email-templates', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const category = req.query.category as string | undefined;
      const templates = await storage.getEmailTemplates(category);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ message: 'Failed to fetch templates' });
    }
  });

  app.get('/api/admin/email-templates/:key', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const template = await storage.getEmailTemplate(req.params.key);
      res.json(template);
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({ message: 'Failed to fetch template' });
    }
  });

  app.patch('/api/admin/email-templates/:key', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const userId = getAuthenticatedUserId(req);
      await storage.updateEmailTemplate(req.params.key, req.body, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({ message: 'Failed to update template' });
    }
  });

  app.post('/api/admin/email-templates', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const template = await storage.createEmailTemplate(req.body);
      res.json(template);
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ message: 'Failed to create template' });
    }
  });

  // Admin Roles
  app.get('/api/admin/roles', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const roles = await storage.getAdminRoles();
      res.json(roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ message: 'Failed to fetch roles' });
    }
  });

  app.post('/api/admin/roles/grant', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const userId = getAuthenticatedUserId(req);
      const role = await storage.grantAdminRole(req.body.userId, req.body.role, req.body.permissions, userId);
      res.json(role);
    } catch (error) {
      console.error('Error granting role:', error);
      res.status(500).json({ message: 'Failed to grant role' });
    }
  });

  app.post('/api/admin/roles/revoke', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const adminUserId = getAuthenticatedUserId(req);
      await storage.revokeAdminRole(req.body.userId, adminUserId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error revoking role:', error);
      res.status(500).json({ message: 'Failed to revoke role' });
    }
  });

  // Admin Security
  app.get('/api/admin/security/events', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const filters = {
        eventType: req.query.eventType as string | undefined,
        severity: req.query.severity as string | undefined,
        userId: req.query.userId as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      const events = await storage.getSecurityEvents(filters);
      res.json(events);
    } catch (error) {
      console.error('Error fetching security events:', error);
      res.status(500).json({ message: 'Failed to fetch security events' });
    }
  });

  app.get('/api/admin/security/ip-bans', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const bans = await storage.getIpBans(activeOnly);
      res.json(bans);
    } catch (error) {
      console.error('Error fetching IP bans:', error);
      res.status(500).json({ message: 'Failed to fetch IP bans' });
    }
  });

  // Admin Action Logs
  app.get('/api/admin/logs/actions', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const filters = {
        adminId: req.query.adminId as string | undefined,
        actionType: req.query.actionType as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };
      const logs = await storage.getAdminActionLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching action logs:', error);
      res.status(500).json({ message: 'Failed to fetch action logs' });
    }
  });

  app.get('/api/admin/logs/recent', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const actions = await storage.getRecentAdminActions(limit);
      res.json(actions);
    } catch (error) {
      console.error('Error fetching recent actions:', error);
      res.status(500).json({ message: 'Failed to fetch recent actions' });
    }
  });

  // Admin Performance
  app.get('/api/admin/performance/metrics', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const metricType = req.query.metricType as string;
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      const metrics = await storage.getPerformanceMetrics(metricType, startDate, endDate);
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      res.status(500).json({ message: 'Failed to fetch performance metrics' });
    }
  });

  app.get('/api/admin/performance/alerts', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const alerts = await storage.getPerformanceAlerts();
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching performance alerts:', error);
      res.status(500).json({ message: 'Failed to fetch performance alerts' });
    }
  });

  // Admin Automation
  app.get('/api/admin/automation/rules', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const rules = await storage.getAutomationRules(activeOnly);
      res.json(rules);
    } catch (error) {
      console.error('Error fetching automation rules:', error);
      res.status(500).json({ message: 'Failed to fetch automation rules' });
    }
  });

  app.post('/api/admin/automation/rules', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const rule = await storage.createAutomationRule(req.body);
      res.json(rule);
    } catch (error) {
      console.error('Error creating automation rule:', error);
      res.status(500).json({ message: 'Failed to create automation rule' });
    }
  });

  app.patch('/api/admin/automation/rules/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await storage.updateAutomationRule(parseInt(req.params.id), req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating automation rule:', error);
      res.status(500).json({ message: 'Failed to update automation rule' });
    }
  });

  // Admin Testing
  app.get('/api/admin/testing/ab-tests', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const status = req.query.status as string | undefined;
      const tests = await storage.getAbTests(status);
      res.json(tests);
    } catch (error) {
      console.error('Error fetching AB tests:', error);
      res.status(500).json({ message: 'Failed to fetch AB tests' });
    }
  });

  app.post('/api/admin/testing/ab-tests', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const test = await storage.createAbTest(req.body);
      res.json(test);
    } catch (error) {
      console.error('Error creating AB test:', error);
      res.status(500).json({ message: 'Failed to create AB test' });
    }
  });

  app.patch('/api/admin/testing/ab-tests/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await storage.updateAbTest(parseInt(req.params.id), req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating AB test:', error);
      res.status(500).json({ message: 'Failed to update AB test' });
    }
  });

  app.get('/api/admin/testing/feature-flags', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const flags = await storage.getFeatureFlags();
      res.json(flags);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      res.status(500).json({ message: 'Failed to fetch feature flags' });
    }
  });

  app.get('/api/admin/testing/feature-flags/:key', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const flag = await storage.getFeatureFlag(req.params.key);
      res.json(flag);
    } catch (error) {
      console.error('Error fetching feature flag:', error);
      res.status(500).json({ message: 'Failed to fetch feature flag' });
    }
  });

  app.patch('/api/admin/testing/feature-flags/:key', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await storage.updateFeatureFlag(req.params.key, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating feature flag:', error);
      res.status(500).json({ message: 'Failed to update feature flag' });
    }
  });

  app.post('/api/admin/testing/feature-flags', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const flag = await storage.createFeatureFlag(req.body);
      res.json(flag);
    } catch (error) {
      console.error('Error creating feature flag:', error);
      res.status(500).json({ message: 'Failed to create feature flag' });
    }
  });

  // Admin Integrations
  app.get('/api/admin/integrations/api-keys', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const userId = req.query.userId as string | undefined;
      const keys = await storage.getApiKeys(userId);
      res.json(keys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      res.status(500).json({ message: 'Failed to fetch API keys' });
    }
  });

  app.post('/api/admin/integrations/api-keys', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const key = await storage.createApiKey(req.body);
      res.json(key);
    } catch (error) {
      console.error('Error creating API key:', error);
      res.status(500).json({ message: 'Failed to create API key' });
    }
  });

  app.delete('/api/admin/integrations/api-keys/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await storage.revokeApiKey(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error revoking API key:', error);
      res.status(500).json({ message: 'Failed to revoke API key' });
    }
  });

  app.get('/api/admin/integrations/webhooks', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const webhooks = await storage.getWebhooks(activeOnly);
      res.json(webhooks);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      res.status(500).json({ message: 'Failed to fetch webhooks' });
    }
  });

  app.post('/api/admin/integrations/webhooks', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const webhook = await storage.createWebhook(req.body);
      res.json(webhook);
    } catch (error) {
      console.error('Error creating webhook:', error);
      res.status(500).json({ message: 'Failed to create webhook' });
    }
  });

  app.patch('/api/admin/integrations/webhooks/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await storage.updateWebhook(parseInt(req.params.id), req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating webhook:', error);
      res.status(500).json({ message: 'Failed to update webhook' });
    }
  });

  app.delete('/api/admin/integrations/webhooks/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await storage.deleteWebhook(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting webhook:', error);
      res.status(500).json({ message: 'Failed to delete webhook' });
    }
  });

  // Admin Media Library
  app.get('/api/admin/studio/media', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      const filters = {
        uploadedBy: req.query.uploadedBy as string | undefined,
        mimeType: req.query.mimeType as string | undefined,
      };
      const media = await storage.getMediaLibrary(filters);
      res.json(media);
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ message: 'Failed to fetch media' });
    }
  });

  app.patch('/api/admin/studio/media/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await storage.updateMediaItem(parseInt(req.params.id), req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating media:', error);
      res.status(500).json({ message: 'Failed to update media' });
    }
  });

  app.delete('/api/admin/studio/media/:id', isAuthenticated, adminOperationLimiter, async (req, res) => {
    if (!isAdmin(req.user)) return res.status(403).json({ message: 'Admin access required' });
    try {
      await storage.deleteMediaItem(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting media:', error);
      res.status(500).json({ message: 'Failed to delete media' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
