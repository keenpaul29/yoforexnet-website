import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Coins, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

const reviewSchema = z.object({
  brokerId: z.string().min(1, "Please select a broker"),
  rating: z.number().min(1).max(5),
  reviewTitle: z.string().min(10, "Title must be at least 10 characters").max(200),
  reviewBody: z.string().min(100, "Review must be at least 100 characters for coin reward").max(2000),
  isScamReport: z.boolean(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export default function SubmitBrokerReviewPage() {
  const { toast } = useToast();
  const [selectedRating, setSelectedRating] = useState(0);

  const mockBrokers = [
    { id: "1", name: "IC Markets" },
    { id: "2", name: "Pepperstone" },
    { id: "3", name: "FXTM" },
    { id: "4", name: "XM" },
    { id: "5", name: "FBS" },
  ];

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      brokerId: "",
      rating: 0,
      reviewTitle: "",
      reviewBody: "",
      isScamReport: false,
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      return await apiRequest("POST", "/api/broker-reviews", data);
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted!",
        description: "Your review will be approved shortly. You'll earn +50 coins once approved.",
      });
      form.reset();
      setSelectedRating(0);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: ReviewFormData) => {
    submitReviewMutation.mutate(data);
  };

  const wordCount = form.watch("reviewBody")?.split(/\s+/).filter(Boolean).length || 0;
  const isEligibleForReward = wordCount >= 200;

  return (
    <div className="min-h-screen bg-background">
      <Header userCoins={2450} />
      
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/brokers">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-to-brokers">
              ← Back to Broker Directory
            </Button>
          </Link>

          <h1 className="text-4xl font-bold mb-2">Submit Broker Review</h1>
          <p className="text-lg text-muted-foreground">
            Share your experience and help the community make informed decisions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Review</CardTitle>
                <CardDescription>
                  Provide honest feedback about your experience with this broker
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="brokerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Broker</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-broker">
                                <SelectValue placeholder="Choose a broker..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockBrokers.map((broker) => (
                                <SelectItem key={broker.id} value={broker.id}>
                                  {broker.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Rating</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-8 w-8 cursor-pointer transition-colors ${
                                    star <= (selectedRating || field.value)
                                      ? "fill-primary text-primary"
                                      : "text-muted-foreground hover:text-primary"
                                  }`}
                                  onClick={() => {
                                    setSelectedRating(star);
                                    field.onChange(star);
                                  }}
                                  data-testid={`star-rating-${star}`}
                                />
                              ))}
                              {selectedRating > 0 && (
                                <span className="ml-2 font-semibold">{selectedRating}/5</span>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reviewTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Review Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Sum up your experience in one line..."
                              {...field}
                              data-testid="input-review-title"
                            />
                          </FormControl>
                          <FormDescription data-testid="text-title-character-count">
                            {field.value.length}/200 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reviewBody"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Review</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Share your detailed experience with this broker. Include information about spreads, execution speed, customer service, withdrawals, etc."
                              className="min-h-[200px]"
                              {...field}
                              data-testid="textarea-review-body"
                            />
                          </FormControl>
                          <FormDescription className="flex items-center justify-between">
                            <span data-testid="text-word-count">{wordCount} words (minimum 100, recommended 200+ for coins)</span>
                            {isEligibleForReward && (
                              <Badge variant="secondary" className="flex items-center gap-1" data-testid="badge-coin-eligible">
                                <Coins className="h-3 w-3 text-primary" />
                                Eligible for +50 Coins
                              </Badge>
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isScamReport"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-destructive/5">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-scam-report"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="flex items-center gap-2 text-destructive">
                              <AlertTriangle className="h-4 w-4" />
                              This is a SCAM REPORT
                            </FormLabel>
                            <FormDescription>
                              Check this box only if you're reporting fraudulent activity, withdrawal issues, or deceptive practices. Provide detailed evidence in your review.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        size="lg"
                        disabled={submitReviewMutation.isPending}
                        data-testid="button-submit-review"
                      >
                        {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                      </Button>
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        onClick={() => {
                          form.reset();
                          setSelectedRating(0);
                        }}
                        data-testid="button-reset-form"
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Earn Gold Coins</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-md border border-primary/20">
                  <Coins className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">+50 Gold Coins</p>
                    <p className="text-xs text-muted-foreground">For quality reviews (200+ words)</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your review will be verified by our moderators before approval. Helpful, detailed reviews earn coins faster!
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>✓ Be specific about spreads, execution speed, and costs</p>
                <p>✓ Share actual numbers and dates when possible</p>
                <p>✓ Include both positives and negatives</p>
                <p>✓ Mention the account type you used</p>
                <p>✓ Upload screenshots if reporting issues</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <EnhancedFooter />
    </div>
  );
}
