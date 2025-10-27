import type { MetadataRoute } from 'next';
import { db } from '../lib/db';
import { forumThreads, content, users, forumCategories } from '../shared/schema';
import { desc } from 'drizzle-orm';
import type { ForumThread, Content, User, ForumCategory } from '../shared/schema';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yoforex.net';

  // Fetch all threads
  const threads = await db.query.forumThreads.findMany({
    orderBy: [desc(forumThreads.updatedAt)],
    limit: 1000,
  });

  // Fetch all content
  const contentItems = await db.query.content.findMany({
    orderBy: [desc(content.updatedAt)],
    limit: 1000,
  });

  // Fetch all users
  const userProfiles = await db.query.users.findMany({
    orderBy: [desc(users.reputationScore)],
    limit: 500,
  });

  // Fetch all categories
  const categories = await db.query.forumCategories.findMany();

  return [
    // Homepage
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // Forum threads
    ...threads.map((thread: ForumThread) => ({
      url: `${baseUrl}/thread/${thread.slug}`,
      lastModified: thread.updatedAt ? new Date(thread.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    // Marketplace content
    ...contentItems.map((item: Content) => ({
      url: `${baseUrl}/content/${item.slug}`,
      lastModified: item.updatedAt ? new Date(item.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    // User profiles
    ...userProfiles.map((user: User) => ({
      url: `${baseUrl}/user/${user.username}`,
      lastModified: user.updatedAt ? new Date(user.updatedAt) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    // Categories
    ...categories.map((category: ForumCategory) => ({
      url: `${baseUrl}/category/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    // Static pages
    {
      url: `${baseUrl}/marketplace`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/discussions`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/brokers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];
}
