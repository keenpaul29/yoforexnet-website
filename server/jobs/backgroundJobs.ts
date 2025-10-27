import cron from 'node-cron';
import type { IStorage } from '../storage';
import { calculateEngagementScore, calculateUserReputation, calculateSalesScore } from '../utils/rankingAlgorithm';

export function startBackgroundJobs(storage: IStorage) {
  console.log('[JOBS] Starting background job scheduler...');

  // Update thread engagement scores every 60 minutes
  cron.schedule('0 * * * *', async () => {
    console.log('[JOBS] Updating thread engagement scores...');
    try {
      await updateThreadScores(storage);
    } catch (error) {
      console.error('[JOBS] Error updating thread scores:', error);
    }
  });

  // Update user reputation scores every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[JOBS] Updating user reputation scores...');
    try {
      await updateUserReputations(storage);
    } catch (error) {
      console.error('[JOBS] Error updating user reputations:', error);
    }
  });

  // Update top seller scores every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('[JOBS] Updating top seller scores...');
    try {
      await updateTopSellerScores(storage);
    } catch (error) {
      console.error('[JOBS] Error updating top seller scores:', error);
    }
  });

  // Initial calculation on startup
  console.log('[JOBS] Running initial score calculations...');
  setTimeout(async () => {
    try {
      await updateThreadScores(storage);
      await updateUserReputations(storage);
      await updateTopSellerScores(storage);
      console.log('[JOBS] Initial score calculations complete');
    } catch (error) {
      console.error('[JOBS] Error in initial calculations:', error);
    }
  }, 5000); // Wait 5 seconds after startup

  console.log('[JOBS] Background jobs scheduled successfully');
}

async function updateThreadScores(storage: IStorage) {
  // Get all forum threads
  const threads = await storage.getAllForumThreads();
  let updated = 0;

  for (const thread of threads) {
    try {
      // Get author reputation
      const author = await storage.getUserById(thread.authorId);
      const authorReputation = author?.reputationScore || 0;

      // Calculate engagement score
      const score = calculateEngagementScore({
        views: thread.views,
        replies: thread.replyCount,
        likes: 0, // TODO: Add likes tracking
        bookmarks: 0, // TODO: Add bookmarks tracking
        shares: 0, // TODO: Add shares tracking
        recency: thread.createdAt,
        authorReputation
      });

      // Update thread score
      await storage.updateThreadScore(thread.id, score);
      updated++;
    } catch (error) {
      console.error(`[JOBS] Error updating score for thread ${thread.id}:`, error);
    }
  }

  console.log(`[JOBS] Updated ${updated} thread scores`);
}

async function updateUserReputations(storage: IStorage) {
  // Get all users
  const users = await storage.getAllUsers();
  let updated = 0;

  for (const user of users) {
    try {
      // Get user statistics
      const stats = await storage.getUserStats(user.id);

      // Calculate reputation score
      const reputation = calculateUserReputation({
        threadsCreated: stats.threadsCreated,
        repliesPosted: stats.repliesPosted,
        likesReceived: stats.likesReceived,
        bestAnswers: stats.bestAnswers || 0,
        contentSales: stats.contentSales || 0,
        followersCount: stats.followersCount || 0,
        uploadsCount: stats.uploadsCount || 0,
        verifiedTrader: user.isVerifiedTrader || false
      });

      // Update user reputation
      await storage.updateUserReputation(user.id, reputation);
      updated++;
    } catch (error) {
      console.error(`[JOBS] Error updating reputation for user ${user.id}:`, error);
    }
  }

  console.log(`[JOBS] Updated ${updated} user reputations`);
}

async function updateTopSellerScores(storage: IStorage) {
  // Get all content (EAs, Indicators, etc.)
  const allContent = await storage.getAllContent();
  let updated = 0;

  for (const content of allContent) {
    try {
      // Get sales statistics
      const salesStats = await storage.getContentSalesStats(content.id);

      // Calculate sales score
      const score = calculateSalesScore({
        totalSales: salesStats.totalSales,
        priceCoins: content.priceCoins,
        reviewCount: salesStats.reviewCount,
        avgRating: salesStats.avgRating,
        downloads: content.downloads
      });

      // Update content sales score
      await storage.updateContentSalesScore(content.id, score);
      updated++;
    } catch (error) {
      console.error(`[JOBS] Error updating sales score for content ${content.id}:`, error);
    }
  }

  console.log(`[JOBS] Updated ${updated} content sales scores`);
}
