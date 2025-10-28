"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Star, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  X, 
  Building2,
  Filter,
  Users,
  MessageSquare,
  Award,
  Flame,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

type Broker = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  overallRating: number | null;
  reviewCount: number;
  scamReportCount: number;
  isVerified: boolean;
  regulationSummary: string | null;
  spreadType?: string | null;
  minSpread?: number | null;
  platform?: string | null;
  yearFounded?: number | null;
};

type BrokerStats = {
  totalBrokers: number;
  verifiedBrokers: number;
  totalReviews: number;
  avgRating: number;
  scamAlertsActive: number;
  newReviews24h: number;
};

type TrendingBroker = {
  brokerId: string;
  name: string;
  slug: string;
  reviewsThisWeek: number;
  ratingTrend: number;
  verificationStatus: string;
  logoUrl?: string | null;
  overallRating?: number | null;
};

interface BrokerDirectoryClientProps {
  initialBrokers: Broker[];
}

export default function BrokerDirectoryClient({ initialBrokers }: BrokerDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [selectedBrokers, setSelectedBrokers] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Fetch brokers
  const { data: brokers = [], isLoading: brokersLoading } = useQuery<Broker[]>({
    queryKey: ["/api/brokers"],
    initialData: initialBrokers,
    staleTime: 60000,
    refetchInterval: 60000,
  });

  // Fetch broker stats
  const { data: stats, isLoading: statsLoading } = useQuery<BrokerStats>({
    queryKey: ["/api/brokers/stats"],
    staleTime: 60000,
  });

  // Fetch trending brokers
  const { data: trendingBrokers = [], isLoading: trendingLoading } = useQuery<TrendingBroker[]>({
    queryKey: ["/api/brokers/trending"],
    staleTime: 60000,
  });

  // Fetch comparison data when modal is open
  const { data: comparisonData, isLoading: comparisonLoading } = useQuery({
    queryKey: ["/api/brokers/comparison", selectedBrokers.join(",")],
    queryFn: async () => {
      if (selectedBrokers.length === 0) return null;
      const res = await fetch(`/api/brokers/comparison?ids=${selectedBrokers.join(",")}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch comparison');
      return res.json();
    },
    enabled: showComparison && selectedBrokers.length > 0,
    staleTime: 30000,
  });

  // Filter and sort brokers
  const filteredBrokers = brokers
    .filter((broker) => {
      const matchesSearch = broker.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (verificationFilter === "verified" && !broker.isVerified) return false;
      if (verificationFilter === "unverified" && broker.isVerified) return false;
      
      if (ratingFilter === "4+" && (broker.overallRating || 0) < 4) return false;
      if (ratingFilter === "3+" && (broker.overallRating || 0) < 3) return false;
      
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return (b.overallRating || 0) - (a.overallRating || 0);
      if (sortBy === "reviews") return b.reviewCount - a.reviewCount;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const handleCompareToggle = (brokerId: string) => {
    setSelectedBrokers(prev => {
      if (prev.includes(brokerId)) {
        return prev.filter(id => id !== brokerId);
      }
      if (prev.length >= 3) {
        return prev; // Max 3 brokers
      }
      return [...prev, brokerId];
    });
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-sm text-muted-foreground">No ratings</span>;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${
              star <= Math.round(rating)
                ? "fill-primary text-primary"
                : "text-muted-foreground"
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-semibold">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Top rated brokers for sidebar
  const topRated = brokers
    .filter(b => b.isVerified && (b.overallRating || 0) > 0)
    .sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0))
    .slice(0, 5);

  // Most reviewed brokers for sidebar
  const mostReviewed = brokers
    .filter(b => b.reviewCount > 0)
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 5);

  // Scam alerts for sidebar
  const scamAlerts = brokers
    .filter(b => b.scamReportCount > 5)
    .sort((a, b) => b.scamReportCount - a.scamReportCount)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-7xl mx-auto px-4 py-6">
        {/* Enhanced Header with Platform Stats */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3" data-testid="heading-broker-directory">
                <Building2 className="w-8 h-8 text-primary" />
                Broker Directory
              </h1>
              <p className="text-lg text-muted-foreground">
                Community-driven broker reviews and ratings. Compare brokers and submit reviews to earn coins.
              </p>
            </div>
            <Link href="/brokers/submit-review">
              <Button size="lg" data-testid="button-submit-review">
                Submit Review
              </Button>
            </Link>
          </div>

          {/* Platform Stats */}
          {!statsLoading && stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-total-brokers">{stats.totalBrokers}</p>
                      <p className="text-xs text-muted-foreground">Total Brokers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-verified-brokers">{stats.verifiedBrokers}</p>
                      <p className="text-xs text-muted-foreground">Verified</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-total-reviews">{stats.totalReviews}</p>
                      <p className="text-xs text-muted-foreground">Reviews</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                      <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-avg-rating">{stats.avgRating.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">Avg Rating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-scam-alerts">{stats.scamAlertsActive}</p>
                      <p className="text-xs text-muted-foreground">Scam Alerts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-new-reviews">{stats.newReviews24h}</p>
                      <p className="text-xs text-muted-foreground">New 24h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Content - 3 columns */}
          <div className="lg:col-span-3 space-y-4">
            {/* Filter Bar */}
            <Card>
              <CardContent className="p-3">
                <div className="space-y-3">
                  {/* Search + Quick Actions */}
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search brokers..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        data-testid="input-broker-search"
                      />
                    </div>
                    <Button variant="outline" size="icon" data-testid="button-filter">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                      <SelectTrigger className="w-[160px]" data-testid="select-verification">
                        <SelectValue placeholder="Verification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Brokers</SelectItem>
                        <SelectItem value="verified">Verified Only</SelectItem>
                        <SelectItem value="unverified">Unverified</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={ratingFilter} onValueChange={setRatingFilter}>
                      <SelectTrigger className="w-[140px]" data-testid="select-rating">
                        <SelectValue placeholder="Rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ratings</SelectItem>
                        <SelectItem value="4+">4+ Stars</SelectItem>
                        <SelectItem value="3+">3+ Stars</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[140px]" data-testid="select-sort">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rating">By Rating</SelectItem>
                        <SelectItem value="reviews">By Reviews</SelectItem>
                        <SelectItem value="name">By Name</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Active Filter Chips */}
                    {verificationFilter !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        {verificationFilter === "verified" ? "Verified" : "Unverified"}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setVerificationFilter("all")} />
                      </Badge>
                    )}
                    {ratingFilter !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        {ratingFilter} stars
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setRatingFilter("all")} />
                      </Badge>
                    )}
                  </div>

                  {/* Results Count */}
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredBrokers.length} broker{filteredBrokers.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Broker Grid - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {brokersLoading ? (
                Array(9).fill(0).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-3">
                      <Skeleton className="h-48" />
                    </CardContent>
                  </Card>
                ))
              ) : filteredBrokers.length === 0 ? (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <p className="text-muted-foreground">No brokers found matching your criteria.</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                filteredBrokers.map((broker) => (
                  <Card 
                    key={broker.id} 
                    className={`hover-elevate cursor-pointer ${selectedBrokers.includes(broker.id) ? 'ring-2 ring-primary' : ''}`}
                    data-testid={`card-broker-${broker.slug}`}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        {/* Logo + Name + Badge */}
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12 rounded-md">
                            <AvatarImage src={broker.logoUrl || undefined} alt={broker.name} />
                            <AvatarFallback className="rounded-md">
                              <Building2 className="h-6 w-6 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <Link href={`/brokers/${broker.slug}`}>
                              <h3 className="font-semibold text-sm line-clamp-1 hover:text-primary" data-testid={`text-broker-name-${broker.slug}`}>
                                {broker.name}
                              </h3>
                            </Link>
                            {broker.isVerified && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30 mt-1" data-testid={`badge-verified-${broker.slug}`}>
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          {/* Compare Checkbox */}
                          <button
                            onClick={() => handleCompareToggle(broker.id)}
                            className={`p-1 rounded hover:bg-accent ${selectedBrokers.includes(broker.id) ? 'bg-primary text-primary-foreground' : ''}`}
                            data-testid={`checkbox-compare-${broker.slug}`}
                            disabled={!selectedBrokers.includes(broker.id) && selectedBrokers.length >= 3}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Rating */}
                        <div data-testid={`rating-stars-${broker.slug}`}>
                          {renderStars(broker.overallRating)}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3 text-xs flex-wrap">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            <span data-testid={`text-review-count-${broker.slug}`}>{broker.reviewCount} reviews</span>
                          </div>
                          {broker.scamReportCount > 0 && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0" data-testid={`badge-scam-alert-${broker.slug}`}>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {broker.scamReportCount} scam reports
                            </Badge>
                          )}
                        </div>

                        {/* Regulation Summary */}
                        <p className="text-xs text-muted-foreground line-clamp-2" data-testid={`text-regulation-${broker.slug}`}>
                          {broker.regulationSummary || "No regulation information available"}
                        </p>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Link href={`/brokers/${broker.slug}`} className="flex-1">
                            <Button size="sm" variant="outline" className="w-full" data-testid={`button-view-broker-${broker.slug}`}>
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <aside className="space-y-4">
            {/* Top Rated Widget */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Top Rated
                </CardTitle>
                <CardDescription className="text-xs">Highest rated verified brokers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topRated.slice(0, 5).map((broker) => (
                  <Link key={broker.id} href={`/brokers/${broker.slug}`}>
                    <div className="flex items-center gap-2 p-2 rounded-md hover-elevate cursor-pointer" data-testid={`widget-top-rated-${broker.slug}`}>
                      <Avatar className="h-8 w-8 rounded-md">
                        <AvatarImage src={broker.logoUrl || undefined} />
                        <AvatarFallback className="rounded-md text-xs">
                          <Building2 className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium line-clamp-1">{broker.name}</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          <span className="text-xs">{broker.overallRating?.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Most Reviewed Widget */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Most Reviewed
                </CardTitle>
                <CardDescription className="text-xs">Most popular brokers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {mostReviewed.slice(0, 5).map((broker) => (
                  <Link key={broker.id} href={`/brokers/${broker.slug}`}>
                    <div className="flex items-center gap-2 p-2 rounded-md hover-elevate cursor-pointer" data-testid={`widget-most-reviewed-${broker.slug}`}>
                      <Avatar className="h-8 w-8 rounded-md">
                        <AvatarImage src={broker.logoUrl || undefined} />
                        <AvatarFallback className="rounded-md text-xs">
                          <Building2 className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium line-clamp-1">{broker.name}</p>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          <span className="text-xs">{broker.reviewCount} reviews</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Trending This Week Widget */}
            {!trendingLoading && trendingBrokers.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flame className="h-4 w-4 text-primary" />
                    Trending This Week
                  </CardTitle>
                  <CardDescription className="text-xs">Most active this week</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trendingBrokers.slice(0, 5).map((broker) => (
                    <Link key={broker.brokerId} href={`/brokers/${broker.slug}`}>
                      <div className="flex items-center gap-2 p-2 rounded-md hover-elevate cursor-pointer" data-testid={`widget-trending-${broker.slug}`}>
                        <Avatar className="h-8 w-8 rounded-md">
                          <AvatarImage src={broker.logoUrl || undefined} />
                          <AvatarFallback className="rounded-md text-xs">
                            <Building2 className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium line-clamp-1">{broker.name}</p>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <TrendingUp className="h-3 w-3" />
                            <span className="text-xs">{broker.reviewsThisWeek} new reviews</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Scam Alerts Widget */}
            {scamAlerts.length > 0 && (
              <Card className="border-destructive/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Scam Alerts
                  </CardTitle>
                  <CardDescription className="text-xs">Brokers with high scam reports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scamAlerts.slice(0, 5).map((broker) => (
                    <Link key={broker.id} href={`/brokers/${broker.slug}`}>
                      <div className="flex items-center gap-2 p-2 rounded-md hover-elevate cursor-pointer" data-testid={`widget-scam-alert-${broker.slug}`}>
                        <Avatar className="h-8 w-8 rounded-md">
                          <AvatarImage src={broker.logoUrl || undefined} />
                          <AvatarFallback className="rounded-md text-xs">
                            <Building2 className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium line-clamp-1">{broker.name}</p>
                          <div className="flex items-center gap-1 text-destructive">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="text-xs">{broker.scamReportCount} reports</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </main>

      {/* Floating Comparison Bar */}
      {selectedBrokers.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-50" data-testid="comparison-bar">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium">
                  {selectedBrokers.length} broker{selectedBrokers.length !== 1 ? 's' : ''} selected
                </p>
                <div className="flex items-center gap-2">
                  {selectedBrokers.map(id => {
                    const broker = brokers.find(b => b.id === id);
                    return broker ? (
                      <Badge key={id} variant="secondary" className="gap-1">
                        {broker.name}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleCompareToggle(id)}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedBrokers([])}
                  data-testid="button-clear-selection"
                >
                  Clear
                </Button>
                <Button
                  onClick={() => setShowComparison(true)}
                  disabled={selectedBrokers.length < 2}
                  data-testid="button-compare-now"
                >
                  Compare Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Dialog */}
      <Dialog open={showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Broker Comparison</DialogTitle>
            <DialogDescription>
              Side-by-side comparison of selected brokers
            </DialogDescription>
          </DialogHeader>
          
          {comparisonLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading comparison...</p>
            </div>
          ) : comparisonData?.brokers ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Feature</th>
                    {comparisonData.brokers.map((broker: any) => (
                      <th key={broker.id} className="text-left p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 rounded-md">
                            <AvatarImage src={broker.logoUrl || undefined} />
                            <AvatarFallback className="rounded-md">
                              <Building2 className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">{broker.name}</p>
                            {broker.isVerified && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3 text-sm font-medium">Overall Rating</td>
                    {comparisonData.brokers.map((broker: any) => (
                      <td key={broker.id} className="p-3">
                        {renderStars(broker.overallRating)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-sm font-medium">Total Reviews</td>
                    {comparisonData.brokers.map((broker: any) => (
                      <td key={broker.id} className="p-3 text-sm">{broker.reviewCount}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-sm font-medium">Scam Reports</td>
                    {comparisonData.brokers.map((broker: any) => (
                      <td key={broker.id} className="p-3">
                        <span className={broker.scamReportCount > 5 ? "text-destructive font-semibold" : ""}>
                          {broker.scamReportCount}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-sm font-medium">Regulation</td>
                    {comparisonData.brokers.map((broker: any) => (
                      <td key={broker.id} className="p-3 text-sm">{broker.regulationSummary || "N/A"}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-sm font-medium">Platform</td>
                    {comparisonData.brokers.map((broker: any) => (
                      <td key={broker.id} className="p-3 text-sm">{broker.platform || "N/A"}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-sm font-medium">Spread Type</td>
                    {comparisonData.brokers.map((broker: any) => (
                      <td key={broker.id} className="p-3 text-sm">{broker.spreadType || "N/A"}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-sm font-medium">Min Spread</td>
                    {comparisonData.brokers.map((broker: any) => (
                      <td key={broker.id} className="p-3 text-sm">
                        {broker.minSpread ? `${broker.minSpread} pips` : "N/A"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-sm font-medium">Year Founded</td>
                    {comparisonData.brokers.map((broker: any) => (
                      <td key={broker.id} className="p-3 text-sm">{broker.yearFounded || "N/A"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-sm font-medium">Actions</td>
                    {comparisonData.brokers.map((broker: any) => (
                      <td key={broker.id} className="p-3">
                        <div className="flex flex-col gap-2">
                          <Link href={`/brokers/${broker.slug}`}>
                            <Button size="sm" variant="outline" className="w-full">
                              View Details
                            </Button>
                          </Link>
                          {broker.websiteUrl && (
                            <Button size="sm" variant="ghost" asChild>
                              <a href={broker.websiteUrl} target="_blank" rel="noopener noreferrer">
                                Visit Website
                              </a>
                            </Button>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No comparison data available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EnhancedFooter />
    </div>
  );
}
