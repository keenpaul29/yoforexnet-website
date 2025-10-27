'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Users, UserPlus } from 'lucide-react';

const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';

interface FollowButtonProps {
  userId: string;
  username: string;
}

export function FollowButton({ userId, username }: FollowButtonProps) {
  const [user, setUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch current user
    fetch(`${EXPRESS_URL}/api/me`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data);
        // Check if following
        if (data?.id && data.id !== userId) {
          fetch(`${EXPRESS_URL}/api/users/${userId}/followers?checkFollower=${data.id}`, {
            credentials: 'include',
          })
            .then((res) => res.json())
            .then((status) => setIsFollowing(status.isFollowing))
            .catch(() => {});
        }
      })
      .catch(() => setUser(null));
  }, [userId]);

  const handleFollow = async () => {
    if (!user) {
      window.location.href = `${EXPRESS_URL}/api/login`;
      return;
    }

    setIsLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        await fetch(`${EXPRESS_URL}/api/users/${userId}/unfollow`, {
          method: 'DELETE',
          credentials: 'include',
        });
        setIsFollowing(false);
      } else {
        // Follow
        await fetch(`${EXPRESS_URL}/api/users/${userId}/follow`, {
          method: 'POST',
          credentials: 'include',
        });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show button if viewing own profile
  if (user?.id === userId) {
    return null;
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      onClick={handleFollow}
      disabled={isLoading}
    >
      {isFollowing ? (
        <>
          <Users className="mr-2 h-4 w-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="mr-2 h-4 w-4" />
          Follow
        </>
      )}
    </Button>
  );
}
