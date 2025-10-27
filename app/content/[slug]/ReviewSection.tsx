'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';

interface ReviewSectionProps {
  contentId: string;
  contentSlug: string;
  reviews: any[];
  averageRating: number;
}

export function ReviewSection({
  contentId,
  contentSlug,
  reviews: initialReviews,
  averageRating,
}: ReviewSectionProps) {
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${EXPRESS_URL}/api/me`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  const handleSubmitReview = async () => {
    if (!user) {
      window.location.href = `${EXPRESS_URL}/api/login`;
      return;
    }

    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    if (reviewText.length < 50) {
      alert('Review must be at least 50 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${EXPRESS_URL}/api/content/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          contentId,
          userId: user.id,
          rating,
          review: reviewText,
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit review');
      }
    } catch (error) {
      alert('An error occurred while submitting your review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Average Rating */}
      <div className="flex items-center gap-4">
        <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
        <div>
          <div className="flex gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= Math.round(averageRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <Separator />

      {/* Write a Review */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Your Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Your Review</label>
            <Textarea
              placeholder={
                user
                  ? 'Share your experience with this content (minimum 50 characters)...'
                  : 'Please log in to write a review'
              }
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              disabled={!user}
              rows={5}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground mt-1">
              {reviewText.length} / 1000 characters
            </div>
          </div>

          <Button
            onClick={handleSubmitReview}
            disabled={!user || isSubmitting || rating === 0}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>

          {!user && (
            <p className="text-sm text-muted-foreground">
              <Link href={`${EXPRESS_URL}/api/login`} className="text-primary hover:underline">
                Log in
              </Link>{' '}
              to write a review
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Reviews ({reviews.length})</h3>

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No reviews yet. Be the first to review this content!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {review.author?.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Link
                          href={`/user/${review.author?.username || 'unknown'}`}
                          className="font-medium hover:underline"
                        >
                          {review.author?.username || 'Unknown'}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {review.createdAt && formatDistanceToNow(new Date(review.createdAt), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= (review.rating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-sm">{review.review}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
