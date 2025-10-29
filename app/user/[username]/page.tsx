import { Metadata } from 'next';
import ProfileClient from './ProfileClient';
import { SchemaScript } from '@/components/SchemaGenerator';
import { generatePersonSchema } from '@/lib/schema-generator';

// Express API base URL
const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoforex.com';

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  try {
    const res = await fetch(`${EXPRESS_URL}/api/user/${username}/profile`, { cache: 'no-store' });
    if (!res.ok) {
      return {
        title: 'User Not Found | YoForex Community',
      };
    }

    const profileData = await res.json();
    const user = profileData?.user;
    
    if (!user) {
      return {
        title: 'User Not Found | YoForex Community',
      };
    }
    
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
export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  
  // Fetch profile data from the comprehensive profile endpoint
  let profileData = undefined;
  try {
    const profileRes = await fetch(`${EXPRESS_URL}/api/user/${username}/profile`, { 
      cache: 'no-store',
    });
    if (profileRes.ok) {
      profileData = await profileRes.json();
    }
  } catch (error) {
    // Swallow error - ProfileClient will show custom error card
    profileData = undefined;
  }

  // Generate Person schema if we have profile data
  let personSchema = null;
  if (profileData?.user) {
    personSchema = generatePersonSchema({
      user: profileData.user,
      baseUrl: BASE_URL,
      reputationScore: profileData.user.reputationScore,
      threadCount: profileData.stats?.threads || 0,
      replyCount: profileData.stats?.replies || 0,
      badges: profileData.user.badges?.map((badge: any) => badge.slug || badge) || []
    });
  }

  // Pass profile data to Client Component
  return (
    <>
      {personSchema && <SchemaScript schema={personSchema} />}
      <ProfileClient
        username={username}
        initialData={profileData}
      />
    </>
  );
}

// Enable dynamic rendering with no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
