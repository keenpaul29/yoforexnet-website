import ForumThreadCard from '../ForumThreadCard';

export default function ForumThreadCardExample() {
  return (
    <div className="p-8 max-w-2xl space-y-4">
      <ForumThreadCard
        id="1"
        title="Best settings for Scalping Master Pro on EURUSD?"
        excerpt="I've been testing this EA on a demo account and getting mixed results. What settings do you recommend for EURUSD M5 timeframe?"
        author={{
          name: "TraderMike",
          reputation: 1250
        }}
        category="Strategy Discussion"
        replyCount={23}
        viewCount={1450}
        isAnswered={true}
        isPinned={false}
        lastActivity={new Date(Date.now() - 2 * 60 * 60 * 1000)}
      />
      <ForumThreadCard
        id="2"
        title="New to EA trading - where should I start?"
        excerpt="Complete beginner here. What are the essential things I need to know before deploying an EA on a live account?"
        author={{
          name: "NewbieTom",
          reputation: 45
        }}
        category="Beginner Questions"
        replyCount={67}
        viewCount={3200}
        isAnswered={false}
        isPinned={true}
        lastActivity={new Date(Date.now() - 30 * 60 * 1000)}
      />
    </div>
  );
}
