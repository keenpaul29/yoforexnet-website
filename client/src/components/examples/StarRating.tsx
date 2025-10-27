import StarRating from '../StarRating';

export default function StarRatingExample() {
  return (
    <div className="p-8 space-y-4">
      <StarRating rating={4.5} showCount count={128} />
      <StarRating rating={3} showCount count={45} size="sm" />
      <StarRating rating={5} showCount count={89} size="lg" />
    </div>
  );
}
