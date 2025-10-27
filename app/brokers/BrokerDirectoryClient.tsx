"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Star, ShieldCheck, AlertTriangle, TrendingUp } from "lucide-react";
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
};

interface BrokerDirectoryClientProps {
  initialBrokers: Broker[];
}

export default function BrokerDirectoryClient({ initialBrokers }: BrokerDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all");

  // Use React Query with initialData and queryFn
  const { data: brokers = [] } = useQuery<Broker[]>({
    queryKey: ["/api/brokers"],
    initialData: initialBrokers,
    queryFn: async () => {
      const res = await fetch('/api/brokers', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch brokers');
      return res.json();
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refresh every minute
  });

  const filteredBrokers = brokers
    .filter((broker) => {
      const matchesSearch = broker.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (filterTab === "top-rated") {
        return matchesSearch && (broker.overallRating || 0) >= 4.0;
      }
      if (filterTab === "most-reviewed") {
        return matchesSearch;
      }
      if (filterTab === "scam-alerts") {
        return matchesSearch && broker.scamReportCount > 5;
      }
      return matchesSearch;
    })
    .sort((a, b) => {
      if (filterTab === "top-rated") {
        return (b.overallRating || 0) - (a.overallRating || 0);
      }
      if (filterTab === "most-reviewed") {
        return b.reviewCount - a.reviewCount;
      }
      if (filterTab === "scam-alerts") {
        return b.scamReportCount - a.scamReportCount;
      }
      return b.reviewCount - a.reviewCount;
    });

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-sm text-muted-foreground">No ratings</span>;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Broker Directory</h1>
          <p className="text-lg text-muted-foreground">
            Community-driven broker reviews and ratings. Submit your review and earn +50 gold coins.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Find a broker..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-broker-search"
                    />
                  </div>
                  <Link href="/brokers/submit-review">
                    <Button data-testid="button-submit-review">
                      Submit Review
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={filterTab} onValueChange={setFilterTab}>
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
                    <TabsTrigger value="top-rated" data-testid="tab-top-rated">Top Rated</TabsTrigger>
                    <TabsTrigger value="most-reviewed" data-testid="tab-most-reviewed">Most Reviewed</TabsTrigger>
                    <TabsTrigger value="scam-alerts" data-testid="tab-scam-alerts">Scam Alerts</TabsTrigger>
                  </TabsList>

                  <TabsContent value={filterTab} className="space-y-4">
                    {filteredBrokers.map((broker) => (
                      <Card key={broker.id} className="hover-elevate" data-testid={`card-broker-${broker.slug}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                                {broker.logoUrl ? (
                                  <img src={broker.logoUrl} alt={broker.name} className="w-full h-full object-cover rounded-md" />
                                ) : (
                                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Link href={`/brokers/${broker.slug}`}>
                                    <h3 className="text-xl font-semibold hover:text-primary cursor-pointer" data-testid={`text-broker-name-${broker.slug}`}>
                                      {broker.name}
                                    </h3>
                                  </Link>
                                  {broker.isVerified && (
                                    <Badge variant="default" className="flex items-center gap-1" data-testid={`badge-verified-${broker.slug}`}>
                                      <ShieldCheck className="h-3 w-3" />
                                      Verified
                                    </Badge>
                                  )}
                                  {broker.scamReportCount > 10 && (
                                    <Badge variant="destructive" className="flex items-center gap-1" data-testid={`badge-scam-alert-${broker.slug}`}>
                                      <AlertTriangle className="h-3 w-3" />
                                      High Scam Reports
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className="text-sm text-muted-foreground mb-3" data-testid={`text-regulation-${broker.slug}`}>
                                  {broker.regulationSummary || "No regulation information available"}
                                </p>
                                
                                <div className="flex items-center gap-4 flex-wrap">
                                  <div data-testid={`rating-stars-${broker.slug}`}>
                                    {renderStars(broker.overallRating)}
                                  </div>
                                  <span className="text-sm text-muted-foreground" data-testid={`text-review-count-${broker.slug}`}>
                                    {broker.reviewCount} reviews
                                  </span>
                                  {broker.scamReportCount > 0 && (
                                    <span className="text-sm text-destructive" data-testid={`text-scam-count-${broker.slug}`}>
                                      {broker.scamReportCount} scam reports
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              <Link href={`/brokers/${broker.slug}`}>
                                <Button size="sm" variant="outline" data-testid={`button-view-broker-${broker.slug}`}>
                                  View Details
                                </Button>
                              </Link>
                              {broker.websiteUrl && (
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={broker.websiteUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-broker-website-${broker.slug}`}>
                                    Visit Website
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {filteredBrokers.length === 0 && (
                      <Card>
                        <CardContent className="p-12 text-center">
                          <p className="text-muted-foreground">No brokers found matching your search.</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Submit a Review</CardTitle>
                <CardDescription>
                  Share your experience and help the community
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-md border border-primary/20">
                  <Star className="h-5 w-5 text-primary flex-shrink-0" />
                  <p className="text-sm">
                    <strong>Earn +50 coins</strong> for quality reviews (200+ words) once approved
                  </p>
                </div>
                
                <Link href="/brokers/submit-review">
                  <Button className="w-full" data-testid="button-submit-review-sidebar">
                    Write a Review
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Why Review Brokers?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>• Help traders avoid scam brokers</p>
                <p>• Share real execution costs & spreads</p>
                <p>• Build your reputation & earn coins</p>
                <p>• Contribute to community trust</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <EnhancedFooter />
    </div>
  );
}
