import { useState } from "react";
import { useRoute } from "wouter";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, ShieldCheck, AlertTriangle, TrendingUp, ExternalLink, ThumbsUp, ThumbsDown } from "lucide-react";
import { Link } from "wouter";

type BrokerReview = {
  id: string;
  userName: string;
  userReputation: number;
  rating: number;
  reviewTitle: string;
  reviewBody: string;
  isScamReport: boolean;
  datePosted: Date;
  helpfulCount: number;
};

export default function BrokerProfilePage() {
  const [, params] = useRoute("/brokers/:slug");
  const slug = params?.slug || "";
  const [activeTab, setActiveTab] = useState("all-reviews");

  const mockBroker = {
    id: "1",
    name: "IC Markets",
    slug: "ic-markets",
    websiteUrl: "https://icmarkets.com",
    logoUrl: null,
    overallRating: 4.5,
    reviewCount: 234,
    scamReportCount: 2,
    isVerified: true,
    regulationSummary: "Regulated by ASIC (Australia), CySEC (Cyprus), FSA (Seychelles)",
    yearFounded: 2007,
  };

  const mockReviews: BrokerReview[] = [
    {
      id: "1",
      userName: "ProTrader2024",
      userReputation: 2340,
      rating: 5,
      reviewTitle: "Excellent for scalping - tight spreads and fast execution",
      reviewBody: "I've been using IC Markets for 2 years now, primarily for gold scalping on RAW spread accounts. The execution speed is phenomenal, typically under 40ms to their NY4 server. Spreads on XAUUSD during London session average 0.15-0.25, which is industry-leading. Their cTrader platform is rock solid. The only minor issue is occasional wider spreads during major news, but that's expected. Highly recommended for serious EA traders.",
      isScamReport: false,
      datePosted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      helpfulCount: 23,
    },
    {
      id: "2",
      userName: "CryptoScalper",
      userReputation: 890,
      rating: 4,
      reviewTitle: "Good for crypto, but watch the rollover costs",
      reviewBody: "IC Markets offers great crypto pairs with decent leverage. I trade BTCUSD and ETHUSD on M5 timeframe. Execution is fast, and I've never had rejections during volatile moves. However, be aware of the overnight rollover costs on crypto - they can eat into profits if you hold positions. Overall solid broker, customer service responds within hours.",
      isScamReport: false,
      datePosted: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      helpfulCount: 15,
    },
    {
      id: "3",
      userName: "FrustratedTrader",
      userReputation: 450,
      rating: 2,
      reviewTitle: "SCAM REPORT: Withdrawal delayed for 3 weeks",
      reviewBody: "I requested a withdrawal of $5,000 and it's been stuck in 'processing' for 3 weeks. Support keeps giving generic responses about 'checking with finance team.' This is unacceptable. I've provided all KYC documents twice. Money is still in my account but I can't access it. Warning to others: be careful with large withdrawals.",
      isScamReport: true,
      datePosted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      helpfulCount: 8,
    },
  ];

  const filteredReviews = mockReviews.filter((review) => {
    if (activeTab === "scam-reports") return review.isScamReport;
    if (activeTab === "all-reviews") return true;
    return true;
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-primary text-primary"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userCoins={2450} />
      
      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/brokers">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-to-directory">
              ← Back to Directory
            </Button>
          </Link>

          <Card>
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                  {mockBroker.logoUrl ? (
                    <img src={mockBroker.logoUrl} alt={mockBroker.name} className="w-full h-full object-cover rounded-md" />
                  ) : (
                    <TrendingUp className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold" data-testid="text-broker-name">{mockBroker.name}</h1>
                    {mockBroker.isVerified && (
                      <Badge variant="default" className="flex items-center gap-1" data-testid="badge-verified">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                    {mockBroker.scamReportCount > 10 && (
                      <Badge variant="destructive" className="flex items-center gap-1" data-testid="badge-scam-alert">
                        <AlertTriangle className="h-3 w-3" />
                        High Scam Reports
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div data-testid="rating-stars">
                      {renderStars(Math.round(mockBroker.overallRating))}
                    </div>
                    <span className="font-semibold" data-testid="text-rating">{mockBroker.overallRating.toFixed(1)}</span>
                    <span className="text-muted-foreground" data-testid="text-review-count">({mockBroker.reviewCount} reviews)</span>
                    {mockBroker.scamReportCount > 0 && (
                      <span className="text-destructive text-sm" data-testid="text-scam-count">
                        {mockBroker.scamReportCount} scam reports
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm" data-testid="text-founded"><strong>Founded:</strong> {mockBroker.yearFounded}</p>
                    <p className="text-sm" data-testid="text-regulation"><strong>Regulation:</strong> {mockBroker.regulationSummary}</p>
                  </div>

                  <div className="flex gap-3">
                    {mockBroker.websiteUrl && (
                      <Button asChild data-testid="button-visit-website">
                        <a href={mockBroker.websiteUrl} target="_blank" rel="noopener noreferrer">
                          Visit Website <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Link href="/brokers/submit-review">
                      <Button variant="outline" data-testid="button-write-review">
                        Write a Review
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="all-reviews" data-testid="tab-all-reviews">
              All Reviews ({mockBroker.reviewCount})
            </TabsTrigger>
            <TabsTrigger value="scam-reports" data-testid="tab-scam-reports">
              Scam Reports ({mockBroker.scamReportCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.id} data-testid={`card-review-${review.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg" data-testid={`text-review-title-${review.id}`}>
                          {review.reviewTitle}
                        </h3>
                        {review.isScamReport && (
                          <Badge variant="destructive" className="flex items-center gap-1" data-testid={`badge-scam-report-${review.id}`}>
                            <AlertTriangle className="h-3 w-3" />
                            Scam Report
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span data-testid={`text-reviewer-name-${review.id}`}>{review.userName}</span>
                        <span>•</span>
                        <span data-testid={`text-reviewer-reputation-${review.id}`}>{review.userReputation} reputation</span>
                        <span>•</span>
                        <span data-testid={`text-review-date-${review.id}`}>{review.datePosted.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div data-testid={`rating-stars-${review.id}`}>
                      {renderStars(review.rating)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4" data-testid={`text-review-body-${review.id}`}>
                    {review.reviewBody}
                  </p>
                  <div className="flex items-center gap-4 pt-4 border-t">
                    <span className="text-sm text-muted-foreground">Was this helpful?</span>
                    <Button size="sm" variant="ghost" className="gap-2" data-testid={`button-helpful-${review.id}`}>
                      <ThumbsUp className="h-4 w-4" />
                      <span data-testid={`text-helpful-count-${review.id}`}>{review.helpfulCount}</span>
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-2" data-testid={`button-not-helpful-${review.id}`}>
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredReviews.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    {activeTab === "scam-reports" 
                      ? "No scam reports for this broker."
                      : "No reviews yet. Be the first to review this broker!"}
                  </p>
                  <Link href="/brokers/submit-review">
                    <Button className="mt-4" data-testid="button-write-first-review">
                      Write a Review
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <EnhancedFooter />
    </div>
  );
}
