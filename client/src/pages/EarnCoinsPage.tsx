import Header from "@/components/Header";
import EarnCoins from "@/components/EarnCoins";
import EnhancedFooter from "@/components/EnhancedFooter";

export default function EarnCoinsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header userCoins={2450} />
      <EarnCoins />
      <EnhancedFooter />
    </div>
  );
}
