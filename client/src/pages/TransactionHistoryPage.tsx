import Header from "@/components/Header";
import CoinTransactionHistory from "@/components/CoinTransactionHistory";
import EnhancedFooter from "@/components/EnhancedFooter";

export default function TransactionHistoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header userCoins={2450} />
      <CoinTransactionHistory />
      <EnhancedFooter />
    </div>
  );
}
