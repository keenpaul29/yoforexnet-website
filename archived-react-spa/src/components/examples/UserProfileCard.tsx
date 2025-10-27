import UserProfileCard from '../UserProfileCard';

export default function UserProfileCardExample() {
  return (
    <div className="p-8 max-w-md">
      <UserProfileCard
        name="Alex Chen"
        username="alextrader"
        reputation={5420}
        role="verified"
        stats={{
          posts: 342,
          threads: 56,
          uploads: 8,
          helpful: 178
        }}
        joinDate={new Date(2022, 3, 15)}
      />
    </div>
  );
}
