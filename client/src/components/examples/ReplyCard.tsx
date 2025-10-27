import ReplyCard from '../ReplyCard';

export default function ReplyCardExample() {
  return (
    <div className="p-8 max-w-3xl space-y-4">
      <ReplyCard
        id="1"
        content="I've been using these settings on EURUSD M5 for the past 3 months with consistent results: Lot Size 0.01, Max Spread 2.5, Stop Loss 30 pips, Take Profit 15 pips. The key is to avoid trading during high-impact news events."
        author={{
          name: "ProTrader99",
          reputation: 2450,
          role: "verified"
        }}
        createdAt={new Date(Date.now() - 4 * 60 * 60 * 1000)}
        upvotes={24}
        isAnswer={true}
      />
      <ReplyCard
        id="2"
        content="Thanks for sharing! Have you tried running this on other pairs like GBPUSD? I'm curious if the same settings would work."
        author={{
          name: "NewbieTom",
          reputation: 45
        }}
        createdAt={new Date(Date.now() - 2 * 60 * 60 * 1000)}
        upvotes={5}
      />
    </div>
  );
}
