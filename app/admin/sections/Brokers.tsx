"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, CheckCircle, XCircle, AlertTriangle, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Type definitions for API responses
interface Broker {
  id: number;
  name: string;
  country?: string;
  regulation?: string;
  verified: boolean;
  reviewCount?: number;
  rating?: number;
}

interface ScamReport {
  id: number;
  brokerName: string;
  reporterUsername: string;
  reason: string;
  status: string;
  createdAt: string;
}

interface Review {
  id: number;
  brokerName: string;
  reviewerUsername: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export default function AdminBrokers() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Add explicit type annotations to ensure TypeScript knows the structure
  const { data: brokersData, isLoading: brokersLoading } = useQuery<Broker[]>({
    queryKey: ["/api/admin/brokers", { search }]
  });

  // Defensive programming: ensure arrays are always defined
  const brokers: Broker[] = Array.isArray(brokersData) ? brokersData : [];

  const { data: scamReportsData, isLoading: reportsLoading } = useQuery<ScamReport[]>({
    queryKey: ["/api/admin/brokers/scam-reports"]
  });

  const scamReports: ScamReport[] = Array.isArray(scamReportsData) ? scamReportsData : [];

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ["/api/admin/brokers/reviews"]
  });

  const reviews: Review[] = Array.isArray(reviewsData) ? reviewsData : [];

  const verifyBrokerMutation = useMutation({
    mutationFn: async (brokerId: number) => {
      return apiRequest("POST", `/api/admin/brokers/${brokerId}/verify`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers"] });
      toast({ title: "Broker verified successfully" });
    },
    onError: () => {
      toast({ title: "Failed to verify broker", variant: "destructive" });
    }
  });

  const unverifyBrokerMutation = useMutation({
    mutationFn: async (brokerId: number) => {
      return apiRequest("POST", `/api/admin/brokers/${brokerId}/unverify`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers"] });
      toast({ title: "Broker verification removed" });
    },
    onError: () => {
      toast({ title: "Failed to unverify broker", variant: "destructive" });
    }
  });

  const resolveScamReportMutation = useMutation({
    mutationFn: async ({ reportId, action }: { reportId: number; action: string }) => {
      return apiRequest("POST", `/api/admin/brokers/scam-reports/${reportId}/resolve`, { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers"] });
      toast({ title: "Scam report resolved" });
    },
    onError: () => {
      toast({ title: "Failed to resolve report", variant: "destructive" });
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Broker Management</h1>

      <Tabs defaultValue="brokers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="brokers" data-testid="tab-brokers">
            Brokers
          </TabsTrigger>
          <TabsTrigger value="scam-reports" data-testid="tab-scam-reports">
            Scam Reports ({scamReports.length})
          </TabsTrigger>
          <TabsTrigger value="reviews" data-testid="tab-broker-reviews">
            Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="brokers" className="space-y-4">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Search Brokers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by broker name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-broker-search"
                />
              </div>
            </CardContent>
          </Card>

          {/* Brokers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Brokers ({brokers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {brokersLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Broker Name</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Regulation</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead>Reviews</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brokers.length > 0 ? (
                        brokers.map((broker: Broker) => (
                          <TableRow key={broker.id} data-testid={`broker-row-${broker.id}`}>
                            <TableCell data-testid={`broker-name-${broker.id}`}>
                              {broker.name}
                            </TableCell>
                            <TableCell>{broker.country || 'N/A'}</TableCell>
                            <TableCell>
                              {broker.regulation ? (
                                <Badge variant="outline">{broker.regulation}</Badge>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={broker.verified ? 'default' : 'secondary'}>
                                {broker.verified ? 'Verified' : 'Unverified'}
                              </Badge>
                            </TableCell>
                            <TableCell>{broker.reviewCount || 0}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {broker.rating ? broker.rating.toFixed(1) : 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 flex-wrap">
                                {!broker.verified ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => verifyBrokerMutation.mutate(broker.id)}
                                    data-testid={`button-verify-broker-${broker.id}`}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Verify
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => unverifyBrokerMutation.mutate(broker.id)}
                                    data-testid={`button-unverify-broker-${broker.id}`}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Unverify
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No brokers found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scam-reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scam Reports ({scamReports.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Broker</TableHead>
                        <TableHead>Reporter</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reported</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scamReports.length > 0 ? (
                        scamReports.map((report: ScamReport) => (
                          <TableRow key={report.id} data-testid={`scam-report-${report.id}`}>
                            <TableCell>{report.brokerName}</TableCell>
                            <TableCell>{report.reporterUsername}</TableCell>
                            <TableCell>{report.reason}</TableCell>
                            <TableCell>
                              <Badge variant={report.status === 'resolved' ? 'default' : 'destructive'}>
                                {report.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => resolveScamReportMutation.mutate({ 
                                    reportId: report.id, 
                                    action: 'verified' 
                                  })}
                                  disabled={report.status === 'resolved'}
                                  data-testid={`button-resolve-report-${report.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Resolve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  data-testid={`button-view-report-${report.id}`}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No scam reports
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Broker Reviews ({reviews.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Broker</TableHead>
                        <TableHead>Reviewer</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Review</TableHead>
                        <TableHead>Posted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reviews.length > 0 ? (
                        reviews.map((review: Review) => (
                          <TableRow key={review.id} data-testid={`review-row-${review.id}`}>
                            <TableCell>{review.brokerName}</TableCell>
                            <TableCell>{review.reviewerUsername}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{review.rating}/5</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {review.comment || 'No comment'}
                            </TableCell>
                            <TableCell>
                              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`button-view-review-${review.id}`}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No reviews found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
