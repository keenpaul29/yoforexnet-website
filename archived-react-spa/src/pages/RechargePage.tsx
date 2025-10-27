import Header from "@/components/Header";
import CoinRecharge from "@/components/CoinRecharge";
import EnhancedFooter from "@/components/EnhancedFooter";

export default function RechargePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header userCoins={2450} />
      <CoinRecharge />
      <EnhancedFooter />
    </div>
  );
}
