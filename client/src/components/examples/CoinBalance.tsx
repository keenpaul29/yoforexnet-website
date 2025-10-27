import CoinBalance from '../CoinBalance';

export default function CoinBalanceExample() {
  return (
    <div className="p-8 max-w-sm">
      <CoinBalance balance={2450} weeklyEarned={85} rank={142} />
    </div>
  );
}
