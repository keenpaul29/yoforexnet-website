import { db } from '@/lib/db';
import { users, forumThreads, content, userFollows } from '../../../shared/schema';
import { eq, count as drizzleCount, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  User as UserIcon,
  Calendar,
  Star,
  TrendingUp,
  MessageSquare,
  Package,
  Award,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FollowButton } from './FollowButton';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const user = await db.query.users.findFirst({
    where: eq(users.username, params.username),
  });

  if (!user) {
    return {
      title: 'User Not Found',
    };
  }

  const description = user.bio || `${user.username} on YoForex - Expert Advisor Forum`;

  return {
    title: `${user.username} - YoForex Profile`,
    description,
    openGraph: {
      title: `${user.username} - YoForex Profile`,
      description,
      type: 'profile',
      username: user.username || '',
    },
    twitter: {
      card: 'summary',
      title: `${user.username} - YoForex Profile`,
      description,
    },
    alternates: {
      canonical: `/user/${params.username}`,
    },
  };
}

// Main User Profile Page (Server Component)
export default async function UserProfilePage({ params }: { params: { username: string } }) {
  // Fetch user
  const user = await db.query.users.findFirst({
    where: eq(users.username, params.username),
  });

  if (!user) {
    notFound();
  }

  // Fetch user's threads
  const userThreads = await db.query.forumThreads.findMany({
    where: eq(forumThreads.authorId, user.id),
    orderBy: [desc(forumThreads.createdAt)],
    limit: 10,
  });

  // Fetch user's content
  const userContent = await db.query.content.findMany({
    where: eq(content.authorId, user.id),
    orderBy: [desc(content.createdAt)],
    limit: 10,
  });

  // Count followers
  const [followerCount] = await db
    .select({ count: drizzleCount() })
    .from(userFollows)
    .where(eq(userFollows.followingId, user.id));

  // Count following
  const [followingCount] = await db
    .select({ count: drizzleCount() })
    .from(userFollows)
    .where(eq(userFollows.followerId, user.id));

  // Generate JSON-LD Person Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: user.username,
    ...(user.bio && { description: user.bio }),
    url: `/user/${params.username}`,
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/FollowAction',
        userInteractionCount: followerCount?.count || 0,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <Header />

      <main className="container mx-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-3xl">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{user.username}</h1>
                      {user.bio && (
                        <p className="text-muted-foreground mb-4">{user.bio}</p>
                      )}
                    </div>
                    <FollowButton userId={user.id} username={user.username || ''} />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {user.coins || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Coins</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {user.reputationScore || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Reputation</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {followerCount?.count || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {followingCount?.count || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Following</div>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Joined{' '}
                        {user.createdAt && formatDistanceToNow(new Date(user.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs - Threads, Content, Badges */}
          <Tabs defaultValue="threads" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="threads">
                <MessageSquare className="h-4 w-4 mr-2" />
                Threads ({userThreads.length})
              </TabsTrigger>
              <TabsTrigger value="content">
                <Package className="h-4 w-4 mr-2" />
                Content ({userContent.length})
              </TabsTrigger>
              <TabsTrigger value="badges">
                <Award className="h-4 w-4 mr-2" />
                Badges
              </TabsTrigger>
            </TabsList>

            {/* Threads Tab */}
            <TabsContent value="threads" className="space-y-4">
              {userThreads.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No threads yet
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {userThreads.map((thread) => (
                    <Card key={thread.id}>
                      <CardContent className="p-4">
                        <Link
                          href={`/thread/${thread.slug}`}
                          className="text-lg font-semibold hover:text-primary"
                        >
                          {thread.title}
                        </Link>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{thread.views || 0} views</span>
                          <span>•</span>
                          <span>{thread.replyCount || 0} replies</span>
                          <span>•</span>
                          <span>
                            {thread.createdAt && formatDistanceToNow(new Date(thread.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              {userContent.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No content published yet
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {userContent.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <Link
                          href={`/content/${item.slug}`}
                          className="text-lg font-semibold hover:text-primary"
                        >
                          {item.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{item.type}</Badge>
                          {item.price && item.price > 0 ? (
                            <Badge className="bg-primary">{item.price} coins</Badge>
                          ) : (
                            <Badge className="bg-green-600">FREE</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {item.averageRating?.toFixed(1) || 'N/A'}
                          </span>
                          <span>•</span>
                          <span>{item.views || 0} views</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Badges Tab */}
            <TabsContent value="badges">
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Badge display coming soon
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Enable ISR - 60s revalidation
export const revalidate = 60;

// Generate static params for top users
export async function generateStaticParams() {
  const topUsers = await db.query.users.findMany({
    limit: 100,
    orderBy: (users, { desc }) => [desc(users.reputationScore)],
  });

  return topUsers.map((user) => ({
    username: user.username,
  }));
}
