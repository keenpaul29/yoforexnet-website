import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '../../lib/db';
import { users, forumThreads, forumReplies, content, activityFeed } from '../../shared/schema';
import { sql, desc, count, and, gte } from 'drizzle-orm';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp, Users as UsersIcon, Upload, Flame } from 'lucide-react';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

// SEO Metadata
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'YoForex Leaderboard - Top Contributors 2025 | Rankings & Stats',
    description: 'View the YoForex leaderboard featuring top contributors, publishers, and most active community members. See who leads in forex trading expertise and content creation.',
    keywords: 'forex leaderboard, top forex traders, trading rankings, EA developers ranking, forex community stats, top contributors 2025',
    openGraph: {
      title: 'YoForex Leaderboard - Top Contributors 2025',
      description: 'Top performers in the YoForex community: contributors, publishers, and active traders.',
      type: 'website',
      url: '/leaderboard',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'YoForex Leaderboard - Top Contributors 2025',
      description: 'View top performers in the YoForex forex trading community.',
    },
  };
}

interface LeaderboardUser {
  id: string;
  username: string;
  profileImageUrl: string | null;
  totalCoins: number;
  badges: string[] | null;
  rank: number;
  score: number;
  threadCount?: number;
  replyCount?: number;
  uploadCount?: number;
  streakDays?: number;
}

async function getLeaderboardData() {
  // Get date for "this week" calculations
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Top Contributors (by thread + reply count)
  const topContributorsData = await db
    .select({
      id: users.id,
      username: users.username,
      profileImageUrl: users.profileImageUrl,
      totalCoins: users.totalCoins,
      badges: users.badges,
      threadCount: sql<number>`CAST((SELECT COUNT(*) FROM ${forumThreads} WHERE ${forumThreads.authorId} = ${users.id}) AS INTEGER)`,
      replyCount: sql<number>`CAST((SELECT COUNT(*) FROM ${forumReplies} WHERE ${forumReplies.userId} = ${users.id}) AS INTEGER)`,
    })
    .from(users)
    .orderBy(desc(sql`CAST((SELECT COUNT(*) FROM ${forumThreads} WHERE ${forumThreads.authorId} = ${users.id}) AS INTEGER) + CAST((SELECT COUNT(*) FROM ${forumReplies} WHERE ${forumReplies.userId} = ${users.id}) AS INTEGER)`))
    .limit(20);

  const topContributors: LeaderboardUser[] = topContributorsData.map((user, index): LeaderboardUser => ({
    ...user,
    rank: index + 1,
    score: (user.threadCount || 0) + (user.replyCount || 0),
  }));

  // Top Uploaders (by content published count)
  const topUploadersData = await db
    .select({
      id: users.id,
      username: users.username,
      profileImageUrl: users.profileImageUrl,
      totalCoins: users.totalCoins,
      badges: users.badges,
      uploadCount: sql<number>`CAST((SELECT COUNT(*) FROM ${content} WHERE ${content.authorId} = ${users.id} AND ${content.status} = 'approved') AS INTEGER)`,
    })
    .from(users)
    .orderBy(desc(sql`CAST((SELECT COUNT(*) FROM ${content} WHERE ${content.authorId} = ${users.id} AND ${content.status} = 'approved') AS INTEGER)`))
    .limit(20);

  const topUploaders: LeaderboardUser[] = topUploadersData.map((user, index): LeaderboardUser => ({
    ...user,
    rank: index + 1,
    score: user.uploadCount || 0,
  }));

  // Weekly Streaks (by recent activity count in last 7 days)
  const weeklyActiveData = await db
    .select({
      id: users.id,
      username: users.username,
      profileImageUrl: users.profileImageUrl,
      totalCoins: users.totalCoins,
      badges: users.badges,
      weeklyActivity: sql<number>`CAST(
        (SELECT COUNT(*) FROM ${forumThreads} WHERE ${forumThreads.authorId} = ${users.id} AND ${forumThreads.createdAt} >= ${oneWeekAgo}) +
        (SELECT COUNT(*) FROM ${forumReplies} WHERE ${forumReplies.userId} = ${users.id} AND ${forumReplies.createdAt} >= ${oneWeekAgo}) +
        (SELECT COUNT(*) FROM ${content} WHERE ${content.authorId} = ${users.id} AND ${content.createdAt} >= ${oneWeekAgo})
      AS INTEGER)`,
    })
    .from(users)
    .orderBy(desc(sql`CAST(
      (SELECT COUNT(*) FROM ${forumThreads} WHERE ${forumThreads.authorId} = ${users.id} AND ${forumThreads.createdAt} >= ${oneWeekAgo}) +
      (SELECT COUNT(*) FROM ${forumReplies} WHERE ${forumReplies.userId} = ${users.id} AND ${forumReplies.createdAt} >= ${oneWeekAgo}) +
      (SELECT COUNT(*) FROM ${content} WHERE ${content.authorId} = ${users.id} AND ${content.createdAt} >= ${oneWeekAgo})
    AS INTEGER)`))
    .limit(20);

  const weeklyStreaks: LeaderboardUser[] = weeklyActiveData.map((user, index): LeaderboardUser => ({
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
    totalCoins: user.totalCoins,
    badges: user.badges,
    rank: index + 1,
    score: user.weeklyActivity || 0,
    streakDays: user.weeklyActivity || 0, // Using activity count as streak approximation
  }));

  // This Week Stats Summary
  const thisWeekStats = {
    totalContributions: topContributors.reduce((sum, u) => sum + u.score, 0),
    totalUploads: topUploaders.reduce((sum, u) => sum + u.score, 0),
    activeMembers: weeklyStreaks.filter(u => u.score > 0).length,
  };

  return {
    topContributors,
    topUploaders,
    weeklyStreaks,
    thisWeekStats,
  };
}

function getRankBadge(rank: number) {
  if (rank === 1) return { icon: Trophy, color: "text-yellow-500", label: "1st" };
  if (rank === 2) return { icon: Medal, color: "text-gray-400", label: "2nd" };
  if (rank === 3) return { icon: Award, color: "text-amber-600", label: "3rd" };
  return { icon: null, color: "text-muted-foreground", label: `#${rank}` };
}

function LeaderboardRow({ user, type }: { user: LeaderboardUser; type: 'contributors' | 'uploaders' | 'streaks' }) {
  const { icon: RankIcon, color, label } = getRankBadge(user.rank);
  
  const getScoreLabel = () => {
    if (type === 'contributors') return `${user.score} contributions`;
    if (type === 'uploaders') return `${user.score} uploads`;
    if (type === 'streaks') return `${user.score} activities this week`;
    return `${user.score}`;
  };

  const isPodium = user.rank <= 3;

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-md hover-elevate ${isPodium ? 'bg-accent/20' : ''}`}
      data-testid={`leader-${type}-${user.rank}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 flex justify-center items-center">
          {RankIcon ? (
            <RankIcon className={`w-6 h-6 ${color}`} data-testid={`icon-rank-${user.rank}`} />
          ) : (
            <span className="text-sm font-semibold text-muted-foreground" data-testid={`text-rank-${user.rank}`}>
              {label}
            </span>
          )}
        </div>
        
        <Avatar className={isPodium ? 'w-12 h-12 border-2 border-primary' : 'w-10 h-10'}>
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
            {user.username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div>
          <Link href={`/user/${user.username}`}>
            <div className="flex items-center gap-2">
              <span className={`font-medium hover:text-primary ${isPodium ? 'text-lg' : ''}`} data-testid={`username-${user.id}`}>
                {user.username}
              </span>
              {isPodium && (
                <Badge variant="default" className="text-xs">
                  Podium
                </Badge>
              )}
            </div>
          </Link>
          {type === 'contributors' && (
            <div className="text-xs text-muted-foreground mt-1" data-testid={`stats-${user.id}`}>
              {user.threadCount || 0} threads • {user.replyCount || 0} replies
            </div>
          )}
        </div>
      </div>

      <Badge variant="secondary" className={isPodium ? 'text-base px-4 py-1' : ''} data-testid={`score-${user.id}`}>
        {getScoreLabel()}
      </Badge>
    </div>
  );
}

function PodiumDisplay({ leaders }: { leaders: LeaderboardUser[] }) {
  if (leaders.length < 3) return null;

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {/* 2nd Place */}
      <div className="flex flex-col items-center pt-8" data-testid="podium-2">
        <div className="relative">
          <Medal className="w-8 h-8 text-gray-400 absolute -top-4 -right-2" />
          <Avatar className="w-20 h-20 border-4 border-gray-400">
            <AvatarFallback className="bg-gray-400 text-white font-bold text-xl">
              {leaders[1].username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <Link href={`/user/${leaders[1].username}`}>
          <p className="font-semibold mt-2 hover:text-primary">{leaders[1].username}</p>
        </Link>
        <Badge variant="secondary" className="mt-1">{leaders[1].score}</Badge>
        <div className="w-full h-24 bg-gray-400/20 border-2 border-gray-400 rounded-t-lg mt-4 flex items-center justify-center">
          <span className="text-3xl font-bold text-gray-400">2</span>
        </div>
      </div>

      {/* 1st Place */}
      <div className="flex flex-col items-center" data-testid="podium-1">
        <div className="relative">
          <Trophy className="w-10 h-10 text-yellow-500 absolute -top-6 -right-2" />
          <Avatar className="w-24 h-24 border-4 border-yellow-500">
            <AvatarFallback className="bg-yellow-500 text-white font-bold text-2xl">
              {leaders[0].username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <Link href={`/user/${leaders[0].username}`}>
          <p className="font-bold text-lg mt-2 hover:text-primary">{leaders[0].username}</p>
        </Link>
        <Badge variant="default" className="mt-1">{leaders[0].score}</Badge>
        <div className="w-full h-32 bg-yellow-500/20 border-2 border-yellow-500 rounded-t-lg mt-4 flex items-center justify-center">
          <span className="text-4xl font-bold text-yellow-500">1</span>
        </div>
      </div>

      {/* 3rd Place */}
      <div className="flex flex-col items-center pt-12" data-testid="podium-3">
        <div className="relative">
          <Award className="w-8 h-8 text-amber-600 absolute -top-4 -right-2" />
          <Avatar className="w-18 h-18 border-4 border-amber-600">
            <AvatarFallback className="bg-amber-600 text-white font-bold">
              {leaders[2].username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <Link href={`/user/${leaders[2].username}`}>
          <p className="font-semibold mt-2 hover:text-primary">{leaders[2].username}</p>
        </Link>
        <Badge variant="outline" className="mt-1">{leaders[2].score}</Badge>
        <div className="w-full h-20 bg-amber-600/20 border-2 border-amber-600 rounded-t-lg mt-4 flex items-center justify-center">
          <span className="text-3xl font-bold text-amber-600">3</span>
        </div>
      </div>
    </div>
  );
}

export default async function LeaderboardPage() {
  const { topContributors, topUploaders, weeklyStreaks, thisWeekStats } = await getLeaderboardData();

  // JSON-LD Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'YoForex Leaderboard - Top Contributors 2025',
    description: 'Top performing members in the YoForex community by contributions, uploads, and activity',
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://yoforex.com'}/leaderboard`,
    publisher: {
      '@type': 'Organization',
      name: 'YoForex',
      url: process.env.NEXT_PUBLIC_BASE_URL || 'https://yoforex.com',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="heading-leaderboards">Leaderboards</h1>
            <p className="text-muted-foreground" data-testid="text-leaderboard-description">
              Top performers in the YoForex community
            </p>
          </div>

          {/* This Week Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Total Contributions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="stat-total-contributions">
                  {thisWeekStats.totalContributions.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">All-time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Upload className="w-5 h-5 text-chart-3" />
                  Total Uploads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="stat-total-uploads">
                  {thisWeekStats.totalUploads.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Approved content</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Active This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="stat-active-members">
                  {thisWeekStats.activeMembers.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Active members</p>
              </CardContent>
            </Card>
          </div>

          {/* Note about tabs */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Interactive tabs require client-side JavaScript. 
              This server component displays all three leaderboard categories in separate sections below.
            </p>
          </div>

          {/* Top Contributors */}
          <section className="mb-12">
            <Card data-testid="content-contributors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersIcon className="w-6 h-6" />
                  Top Contributors
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ranked by total threads and replies
                </p>
              </CardHeader>
              <CardContent>
                <PodiumDisplay leaders={topContributors.slice(0, 3)} />
                <div className="space-y-2">
                  {topContributors.map((user) => (
                    <LeaderboardRow key={user.id} user={user} type="contributors" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Top Uploaders */}
          <section className="mb-12">
            <Card data-testid="content-uploaders">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-6 h-6" />
                  Top Uploaders
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ranked by approved content published
                </p>
              </CardHeader>
              <CardContent>
                <PodiumDisplay leaders={topUploaders.slice(0, 3)} />
                <div className="space-y-2">
                  {topUploaders.map((user) => (
                    <LeaderboardRow key={user.id} user={user} type="uploaders" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Weekly Streaks */}
          <section className="mb-12">
            <Card data-testid="content-streaks">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-6 h-6 text-orange-500" />
                  Weekly Activity Streaks
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Most active members in the last 7 days
                </p>
              </CardHeader>
              <CardContent>
                <PodiumDisplay leaders={weeklyStreaks.slice(0, 3)} />
                <div className="space-y-2">
                  {weeklyStreaks.map((user) => (
                    <LeaderboardRow key={user.id} user={user} type="streaks" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
