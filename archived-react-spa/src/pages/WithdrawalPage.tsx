import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Bitcoin, Coins, Wallet } from "lucide-react";

const EXCHANGE_RATES = {
  BTC: 50000,
  ETH: 3000,
};

const withdrawalSchema = z.object({
  amount: z.coerce.number().min(1000, "Minimum withdrawal is 1000 coins"),
  cryptoType: z.enum(["BTC", "ETH"]),
  walletAddress: z.string().min(26, "Invalid wallet address").max(100, "Invalid wallet address"),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

export default function WithdrawalPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { promptAuth } = useAuthPrompt();
  const { toast } = useToast();
  const [previewCrypto, setPreviewCrypto] = useState<number>(0);
  const [previewFee, setPreviewFee] = useState<number>(0);

  const { data: userCoins } = useQuery({
    queryKey: user ? ['/api/user', user.id, 'coins'] : [],
    enabled: !!user,
  });

  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 1000,
      cryptoType: "BTC",
      walletAddress: "",
    },
  });

  const watchAmount = form.watch("amount");
  const watchCryptoType = form.watch("cryptoType");

  const calculatePreview = (amount: number, cryptoType: "BTC" | "ETH") => {
    if (!amount || amount < 1000) return;
    
    const fivePercent = Math.floor(amount * 0.05);
    const fee = Math.max(fivePercent, 100);
    const crypto = amount / EXCHANGE_RATES[cryptoType];
    
    setPreviewFee(fee);
    setPreviewCrypto(crypto);
  };

  const withdrawalMutation = useMutation({
    mutationFn: async (data: WithdrawalFormData) => {
      return await apiRequest("/api/withdrawals", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request has been submitted and will be processed within 24 hours.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user', user?.id, 'coins'] });
      navigate("/withdrawal/history");
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to create withdrawal request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WithdrawalFormData) => {
    if (!user) {
      promptAuth();
      return;
    }

    if (userCoins && userCoins.totalCoins < data.amount) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough coins for this withdrawal",
        variant: "destructive",
      });
      return;
    }

    withdrawalMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-withdrawal-title">Withdraw Gold Coins</h1>
            <p className="text-muted-foreground mt-2">Convert your gold coins to Bitcoin or Ethereum</p>
          </div>

          <Alert data-testid="alert-processing-time">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>24-Hour Processing Time</AlertTitle>
            <AlertDescription>
              All withdrawal requests are manually processed within 24 hours. Coins will be deducted immediately upon request.
            </AlertDescription>
          </Alert>

          {userCoins && (
            <Card data-testid="card-balance">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  Current Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-balance">{userCoins.totalCoins} Coins</div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Request</CardTitle>
              <CardDescription>
                Minimum withdrawal: 1000 coins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (Coins)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1000"
                            data-testid="input-amount"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              calculatePreview(Number(e.target.value), watchCryptoType);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum 1000 coins
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cryptoType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cryptocurrency</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            calculatePreview(watchAmount, value as "BTC" | "ETH");
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-crypto-type">
                              <SelectValue placeholder="Select cryptocurrency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="BTC" data-testid="option-btc">Bitcoin (BTC)</SelectItem>
                            <SelectItem value="ETH" data-testid="option-eth">Ethereum (ETH)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Exchange rate: {watchCryptoType === "BTC" ? "50,000" : "3,000"} coins per {watchCryptoType}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="walletAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wallet Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your crypto wallet address"
                            data-testid="input-wallet-address"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Your {watchCryptoType} wallet address (26-100 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {previewCrypto > 0 && (
                    <Card className="bg-muted" data-testid="card-preview">
                      <CardHeader>
                        <CardTitle className="text-lg">Withdrawal Preview</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-semibold" data-testid="text-preview-amount">{watchAmount} coins</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Processing Fee:</span>
                          <span className="font-semibold" data-testid="text-preview-fee">{previewFee} coins</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-muted-foreground">You will receive:</span>
                          <span className="font-bold text-lg" data-testid="text-preview-crypto">
                            {previewCrypto.toFixed(8)} {watchCryptoType}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={withdrawalMutation.isPending}
                      className="flex-1"
                      data-testid="button-submit"
                    >
                      {withdrawalMutation.isPending ? "Processing..." : "Submit Withdrawal Request"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/withdrawal/history")}
                      data-testid="button-history"
                    >
                      View History
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
