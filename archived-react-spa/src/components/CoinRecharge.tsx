import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Coins, CreditCard, Wallet, Gift, AlertCircle } from "lucide-react";
import { useState } from "react";

interface CoinPackage {
  coins: number;
  price: number;
  bonus?: number;
  popular?: boolean;
}

export default function CoinRecharge() {
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "crypto">("stripe");

  const packages: CoinPackage[] = [
    { coins: 22, price: 22 },
    { coins: 52, price: 52, bonus: 5 },
    { coins: 200, price: 200, bonus: 20, popular: true },
    { coins: 500, price: 500, bonus: 75 },
    { coins: 1000, price: 1000, bonus: 200 },
    { coins: 2000, price: 2000, bonus: 500 }
  ];

  const handleRecharge = () => {
    if (!selectedPackage && !customAmount) {
      alert("Please select a package or enter a custom amount");
      return;
    }
    
    const amount = selectedPackage ? selectedPackage.coins : parseInt(customAmount);
    console.log(`Recharging ${amount} coins via ${paymentMethod}`);
    // TODO: Integrate with Stripe or crypto payment gateway
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8" data-testid="container-coin-recharge">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Recharge Gold Coins</h1>
        <p className="text-muted-foreground">
          Top up your account to download EAs, access premium content, and unlock exclusive features
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                Select Coin Package
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <div
                    key={pkg.coins}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer hover-elevate ${
                      selectedPackage?.coins === pkg.coins
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    data-testid={`package-${pkg.coins}`}
                  >
                    {pkg.popular && (
                      <Badge className="absolute -top-2 -right-2" variant="default">
                        Popular
                      </Badge>
                    )}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Coins className="h-5 w-5 text-primary" />
                        <span className="text-2xl font-bold">{pkg.coins}</span>
                      </div>
                      {pkg.bonus && (
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <Gift className="h-4 w-4 text-chart-3" />
                          <span className="text-sm text-chart-3 font-medium">+{pkg.bonus} bonus</span>
                        </div>
                      )}
                      <div className="text-lg font-semibold">${pkg.price}</div>
                      <div className="text-xs text-muted-foreground">
                        {pkg.bonus ? `${pkg.coins + pkg.bonus} total coins` : `${pkg.coins} coins`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <label className="text-sm font-medium mb-2 block">Custom Amount</label>
                <Input
                  type="number"
                  placeholder="Enter custom coin amount (min. 10)"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedPackage(null);
                  }}
                  min="10"
                  data-testid="input-custom-amount"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onClick={() => setPaymentMethod("stripe")}
                className={`p-4 border-2 rounded-lg cursor-pointer hover-elevate ${
                  paymentMethod === "stripe" ? "border-primary bg-primary/5" : "border-border"
                }`}
                data-testid="payment-stripe"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-primary" />
                  <div>
                    <div className="font-semibold">Credit/Debit Card</div>
                    <div className="text-sm text-muted-foreground">
                      Secure payment via Stripe
                    </div>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setPaymentMethod("crypto")}
                className={`p-4 border-2 rounded-lg cursor-pointer hover-elevate ${
                  paymentMethod === "crypto" ? "border-primary bg-primary/5" : "border-border"
                }`}
                data-testid="payment-crypto"
              >
                <div className="flex items-center gap-3">
                  <Wallet className="h-6 w-6 text-primary" />
                  <div>
                    <div className="font-semibold">Cryptocurrency (USDT)</div>
                    <div className="text-sm text-muted-foreground">
                      Pay with USDT (TRC20/ERC20)
                    </div>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleRecharge}
                disabled={!selectedPackage && !customAmount}
                data-testid="button-proceed-payment"
              >
                Proceed to Payment
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Why Top Up?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <span>Download premium EAs and indicators</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <span>Access exclusive trading strategies</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <span>View premium backtests and set files</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <span>Support quality content creators</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold mb-1">Important Notice</div>
                  <div className="text-muted-foreground">
                    Gold coins are non-refundable after top-up. Please review content descriptions carefully before making purchases.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
