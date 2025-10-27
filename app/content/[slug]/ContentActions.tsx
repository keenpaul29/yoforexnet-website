'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ShoppingCart, Heart, Share2 } from 'lucide-react';

const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';

interface ContentActionsProps {
  contentId: string;
  price: number;
  isPurchased: boolean;
}

export function ContentActions({ contentId, price, isPurchased: initialPurchased }: ContentActionsProps) {
  const [user, setUser] = useState<any>(null);
  const [isPurchased, setIsPurchased] = useState(initialPurchased);
  const [isLiked, setIsLiked] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    // Fetch current user
    fetch(`${EXPRESS_URL}/api/me`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data);
        // Check purchase status if user is logged in
        if (data?.id) {
          fetch(`${EXPRESS_URL}/api/content/${contentId}/purchased?userId=${data.id}`, {
            credentials: 'include',
          })
            .then((res) => res.json())
            .then((status) => setIsPurchased(status.hasPurchased))
            .catch(() => {});
        }
      })
      .catch(() => setUser(null));
  }, [contentId]);

  const handlePurchase = async () => {
    if (!user) {
      window.location.href = `${EXPRESS_URL}/api/login`;
      return;
    }

    setIsPurchasing(true);

    try {
      const response = await fetch(`${EXPRESS_URL}/api/content/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          contentId,
          buyerId: user.id,
        }),
      });

      if (response.ok) {
        setIsPurchased(true);
        alert('Purchase successful! You can now download this content.');
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.message || 'Purchase failed');
      }
    } catch (error) {
      alert('An error occurred during purchase');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleDownload = () => {
    if (!isPurchased) {
      alert('Please purchase this content first');
      return;
    }
    // Trigger download
    window.location.href = `${EXPRESS_URL}/api/content/${contentId}/download`;
  };

  const handleLike = async () => {
    if (!user) {
      window.location.href = `${EXPRESS_URL}/api/login`;
      return;
    }

    try {
      await fetch(`${EXPRESS_URL}/api/content/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          contentId,
          userId: user.id,
        }),
      });

      setIsLiked(true);
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this content on YoForex',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="space-y-2">
      {!isPurchased ? (
        <Button
          className="w-full"
          size="lg"
          onClick={handlePurchase}
          disabled={isPurchasing}
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          {isPurchasing ? 'Processing...' : price > 0 ? `Buy Now (${price} coins)` : 'Get Free'}
        </Button>
      ) : (
        <Button
          className="w-full bg-green-600 hover:bg-green-700"
          size="lg"
          onClick={handleDownload}
        >
          <Download className="mr-2 h-5 w-5" />
          Download
        </Button>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleLike}
          disabled={isLiked}
        >
          <Heart className={`mr-2 h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          {isLiked ? 'Liked' : 'Like'}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleShare}
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  );
}
