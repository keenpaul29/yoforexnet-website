import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '../../lib/db';
import { users, forumThreads, forumReplies, userFollows, content } from '../../shared/schema';
import { sql, desc, count } from 'drizzle-orm';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Coins,
  TrendingUp,
  Upload,
  Star,
  Award,
  Crown,
  Medal,
  Target,
  MessageSquare,
  Users
} from 'lucide-react';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

// SEO Metadata
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Community Members - YoForex | Top Forex Traders & Contributors',
    description: 'Discover top forex traders, EA developers, and contributors in the YoForex community. Connect with experienced traders and learn from the best.',
    keywords: 'forex community, forex traders, EA developers, trading community, forex experts, top traders',
    openGraph: {
      title: 'YoForex Community Members - Top Forex Traders',
      description: 'Connect with top forex traders, EA developers, and trading experts in the YoForex community.',
      type: 'website',
      url: '/members',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'YoForex Community Members - Top Forex Traders',
      description: 'Connect with top forex traders, EA developers, and trading experts.',
    },
  };
}

interface MemberWithStats {
  id: string;
  username: string;
  email: string | null;
  profileImageUrl: string | null;
  totalCoins: number;
  rank: number | null;
  reputationScore: number;
  badges: string[] | null;
  threadCount: number;
  replyCount: number;
  followerCount: number;
  uploadCount: number;
  contributionCount: number;
}

async function getMembersData() {
  // Get all users with their stats in a single optimized query
  const membersData = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      profileImageUrl: users.profileImageUrl,
      totalCoins: users.totalCoins,
      rank: users.rank,
      reputationScore: users.reputationScore,
      badges: users.badges,
      threadCount: sql<number>`(SELECT COUNT(*) FROM ${forumThreads} WHERE ${forumThreads.authorId} = ${users.id})`,
      replyCount: sql<number>`(SELECT COUNT(*) FROM ${forumReplies} WHERE ${forumReplies.userId} = ${users.id})`,
      followerCount: sql<number>`(SELECT COUNT(*) FROM ${userFollows} WHERE ${userFollows.followingId} = ${users.id})`,
      uploadCount: sql<number>`(SELECT COUNT(*) FROM ${content} WHERE ${content.authorId} = ${users.id})`,
    })
    .from(users)
    .orderBy(desc(users.totalCoins));

  // Calculate contribution count (threads + replies)
  const members: MemberWithStats[] = membersData.map((m): MemberWithStats => ({
    ...m,
    contributionCount: (m.threadCount || 0) + (m.replyCount || 0),
  }));

  // Sort by different criteria
  const topByCoins = [...members].sort((a, b) => b.totalCoins - a.totalCoins).slice(0, 50);
  const topByContributions = [...members].sort((a, b) => b.contributionCount - a.contributionCount).slice(0, 50);
  const topByUploads = [...members].sort((a, b) => b.uploadCount - a.uploadCount).slice(0, 50);

  return {
    topByCoins,
    topByContributions,
    topByUploads,
    totalMembers: members.length,
  };
}

function getRankBadge(rank: number) {
  if (rank === 1) return { Icon: Crown, variant: "default" as const, color: "text-yellow-500" };
  if (rank === 2) return { Icon: Medal, variant: "secondary" as const, color: "text-gray-400" };
  if (rank === 3) return { Icon: Medal, variant: "outline" as const, color: "text-orange-600" };
  return { Icon: Trophy, variant: "outline" as const, color: "text-muted-foreground" };
}

function MemberCard({ member, index, type }: { member: MemberWithStats; index: number; type: 'coins' | 'contributions' | 'uploads' }) {
  const { Icon: RankIcon, variant, color } = getRankBadge(index + 1);
  
  const getStatValue = () => {
    if (type === 'coins') return member.totalCoins.toLocaleString();
    if (type === 'contributions') return member.contributionCount.toLocaleString();
    if (type === 'uploads') return member.uploadCount.toLocaleString();
    return '0';
  };

  const getStatLabel = () => {
    if (type === 'coins') return 'coins';
    if (type === 'contributions') return 'contributions';
    if (type === 'uploads') return 'uploads';
    return '';
  };

  return (
    <Card className="hover-elevate active-elevate-2" data-testid={`card-member-${member.id}`}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="relative">
              <Badge variant={variant} className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center p-0 ${color}`}>
                {index < 3 ? <RankIcon className="w-4 h-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
              </Badge>
              <Avatar className="w-14 h-14">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {member.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <Link href={`/user/${member.username}`} data-testid={`link-user-${member.id}`}>
              <h3 className="font-semibold text-lg hover:text-primary" data-testid={`text-username-${member.id}`}>
                {member.username}
              </h3>
            </Link>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-sm text-muted-foreground">
                Rank #{member.rank || index + 1}
              </span>
              {index < 10 && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Top 10
                </Badge>
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold" data-testid={`stat-value-${member.id}`}>
              {getStatValue()}
            </p>
            <p className="text-xs text-muted-foreground">{getStatLabel()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function MembersPage() {
  const { topByCoins, topByContributions, topByUploads, totalMembers } = await getMembersData();

  // JSON-LD Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'YoForex Community Members',
    description: 'Top forex traders, EA developers, and contributors in the YoForex community',
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://yoforex.com'}/members`,
    publisher: {
      '@type': 'Organization',
      name: 'YoForex',
      url: process.env.NEXT_PUBLIC_BASE_URL || 'https://yoforex.com',
    },
    numberOfItems: totalMembers,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="heading-members">Community Members</h1>
            <p className="text-muted-foreground">
              Top contributors, traders, and developers in the YoForex community
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Top Earner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-top-earner-coins">
                    {topByCoins[0]?.totalCoins.toLocaleString() || 0} coins
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="stat-top-earner-name">
                    {topByCoins[0]?.username || 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-primary" />
                  Most Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-most-active-count">
                    {topByContributions[0]?.contributionCount.toLocaleString() || 0} posts
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="stat-most-active-name">
                    {topByContributions[0]?.username || 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Upload className="w-5 h-5 text-chart-3" />
                  Top Publisher
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-top-publisher-count">
                    {topByUploads[0]?.uploadCount.toLocaleString() || 0} uploads
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="stat-top-publisher-name">
                    {topByUploads[0]?.username || 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Note about client-side features */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Tabs, search, and filtering features require client-side interactivity. 
              For this server component, we display the top 50 members by each category. 
              For full interactive features, a client component wrapper would be needed.
            </p>
          </div>

          {/* Top by Coins */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Coins className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold" data-testid="heading-top-by-coins">Top by Coins</h2>
            </div>
            <div className="space-y-4" data-testid="content-coins-leaderboard">
              {topByCoins.length > 0 ? (
                topByCoins.map((member, index) => (
                  <MemberCard key={member.id} member={member} index={index} type="coins" />
                ))
              ) : (
                <Card className="p-12 text-center">
                  <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No members yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Start earning coins to appear on the leaderboard!
                  </p>
                </Card>
              )}
            </div>
          </section>

          {/* Top Contributors */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold" data-testid="heading-top-contributors">Top Contributors</h2>
            </div>
            <div className="space-y-4" data-testid="content-contributions-leaderboard">
              {topByContributions.length > 0 ? (
                topByContributions.map((member, index) => (
                  <MemberCard key={member.id} member={member} index={index} type="contributions" />
                ))
              ) : (
                <Card className="p-12 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Start contributing to the community to appear here!
                  </p>
                </Card>
              )}
            </div>
          </section>

          {/* Top Publishers */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Upload className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold" data-testid="heading-top-publishers">Top Publishers</h2>
            </div>
            <div className="space-y-4" data-testid="content-uploads-leaderboard">
              {topByUploads.length > 0 ? (
                topByUploads.map((member, index) => (
                  <MemberCard key={member.id} member={member} index={index} type="uploads" />
                ))
              ) : (
                <Card className="p-12 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No uploads yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Publish your first EA or indicator to appear here!
                  </p>
                </Card>
              )}
            </div>
          </section>

          {/* Call to Action */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-2xl font-bold mb-2">Want to climb the leaderboard?</h3>
              <p className="text-muted-foreground mb-6">
                Earn coins by contributing to the community, publishing quality content, and helping fellow traders
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/marketplace">
                  <Button size="lg" data-testid="button-publish-content">
                    <Upload className="w-4 h-4 mr-2" />
                    Publish Content
                  </Button>
                </Link>
                <a href={`${process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000'}/earn-coins`}>
                  <Button variant="outline" size="lg" data-testid="button-earn-coins">
                    <Coins className="w-4 h-4 mr-2" />
                    Learn How to Earn
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
}
