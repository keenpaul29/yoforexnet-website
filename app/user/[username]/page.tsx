import { Metadata } from 'next';
import UserProfileClient from './UserProfileClient';
import type { User, Badge as BadgeType, Content, ForumThread } from '@shared/schema';

// Express API base URL
const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${EXPRESS_URL}/api/users/username/${params.username}`, { cache: 'no-store' });
    if (!res.ok) {
      return {
        title: 'User Not Found | YoForex Community',
      };
    }

    const user: User = await res.json();
    
    return {
      title: `${user.username}'s Profile | YoForex Community`,
      description: `View ${user.username}'s profile, badges, contributions, and reputation on YoForex`,
      keywords: `forex trader, ${user.username}, MT4, MT5, expert advisor`,
      openGraph: {
        title: `${user.username}'s Profile`,
        description: `View ${user.username}'s profile, badges, contributions, and reputation on YoForex`,
        type: 'profile',
      },
      twitter: {
        card: 'summary',
        title: `${user.username}'s Profile`,
        description: `View ${user.username}'s profile, badges, contributions, and reputation on YoForex`,
      },
    };
  } catch (error) {
    return {
      title: 'User Not Found | YoForex Community',
    };
  }
}

// Main page component (Server Component)
export default async function UserProfilePage({ params }: { params: { username: string } }) {
  // Fetch user with error handling that doesn't trigger Next.js 404
  let user: User | null = null;
  try {
    const userRes = await fetch(`${EXPRESS_URL}/api/users/username/${params.username}`, { 
      cache: 'no-store',
    });
    if (userRes.ok) {
      user = await userRes.json();
    }
  } catch (error) {
    // Swallow error - we'll show custom error card
    user = null;
  }

  // If user not found, return Client Component with null user to show custom error card
  if (!user) {
    return (
      <UserProfileClient
        username={params.username}
        initialUser={null}
        initialBadges={[]}
        initialContent={[]}
        initialThreads={[]}
      />
    );
  }

  // Fetch all additional data in parallel
  const [badgesRes, contentRes, threadsRes] = await Promise.all([
    // Fetch user badges
    user.id 
      ? fetch(`${EXPRESS_URL}/api/users/${user.id}/badges`, { cache: 'no-store' }).catch(() => null)
      : Promise.resolve(null),
    
    // Fetch user's content (EAs/Indicators)
    user.id 
      ? fetch(`${EXPRESS_URL}/api/user/${user.id}/content`, { cache: 'no-store' }).catch(() => null)
      : Promise.resolve(null),
    
    // Fetch user's threads
    user.id 
      ? fetch(`${EXPRESS_URL}/api/user/${user.id}/threads`, { cache: 'no-store' }).catch(() => null)
      : Promise.resolve(null),
  ]);

  // Parse responses
  const badges = badgesRes?.ok ? await badgesRes.json() : [];
  const content = contentRes?.ok ? await contentRes.json() : [];
  const threads = threadsRes?.ok ? await threadsRes.json() : [];

  // Pass all data to Client Component
  return (
    <UserProfileClient
      username={params.username}
      initialUser={user}
      initialBadges={badges}
      initialContent={content}
      initialThreads={threads}
    />
  );
}

// Enable dynamic rendering with no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
