"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Trash2, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Type definitions for API responses
interface ContentItem {
  id: number;
  title: string;
  type: string;
  authorUsername: string;
  status: string;
  createdAt: string;
}

export default function AdminContent() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");
  const { toast } = useToast();

  const { data: moderationQueueData, isLoading: queueLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/admin/content/moderation-queue", { type: typeFilter, status: statusFilter }]
  });

  const moderationQueue: ContentItem[] = Array.isArray(moderationQueueData) ? moderationQueueData : [];

  const { data: reportedContentData, isLoading: reportsLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/admin/content/reported"]
  });

  const reportedContent: ContentItem[] = Array.isArray(reportedContentData) ? reportedContentData : [];

  const approveMutation = useMutation({
    mutationFn: async (contentId: number) => {
      return apiRequest("POST", `/api/admin/content/${contentId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      toast({ title: "Content approved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to approve content", variant: "destructive" });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ contentId, reason }: { contentId: number; reason: string }) => {
      return apiRequest("POST", `/api/admin/content/${contentId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      toast({ title: "Content rejected successfully" });
    },
    onError: () => {
      toast({ title: "Failed to reject content", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (contentId: number) => {
      return apiRequest("DELETE", `/api/admin/content/${contentId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      toast({ title: "Content deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete content", variant: "destructive" });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">Content Moderation</h1>
      </div>

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue" data-testid="tab-moderation-queue">
            Moderation Queue
          </TabsTrigger>
          <TabsTrigger value="reported" data-testid="tab-reported-content">
            Reported Content
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-content-type">
                    <SelectValue placeholder="Content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="thread">Threads</SelectItem>
                    <SelectItem value="reply">Replies</SelectItem>
                    <SelectItem value="ea">EAs</SelectItem>
                    <SelectItem value="article">Articles</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-content-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Moderation Queue Table */}
          <Card>
            <CardHeader>
              <CardTitle>Content Queue ({moderationQueue?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {queueLoading ? (
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
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {moderationQueue && moderationQueue.length > 0 ? (
                        moderationQueue.map((content: any) => (
                          <TableRow key={content.id} data-testid={`content-row-${content.id}`}>
                            <TableCell data-testid={`content-title-${content.id}`}>
                              {content.title || 'Untitled'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{content.type}</Badge>
                            </TableCell>
                            <TableCell>{content.authorUsername}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  content.status === 'approved' ? 'default' : 
                                  content.status === 'rejected' ? 'destructive' : 
                                  'secondary'
                                }
                              >
                                {content.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDistanceToNow(new Date(content.createdAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => approveMutation.mutate(content.id)}
                                  disabled={content.status === 'approved'}
                                  data-testid={`button-approve-${content.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => rejectMutation.mutate({ contentId: content.id, reason: "Violates guidelines" })}
                                  disabled={content.status === 'rejected'}
                                  data-testid={`button-reject-${content.id}`}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No content in moderation queue
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

        <TabsContent value="reported" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reported Content ({reportedContent?.length || 0})</CardTitle>
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
                        <TableHead>Content</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Reporter</TableHead>
                        <TableHead>Reports</TableHead>
                        <TableHead>Reported</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportedContent && reportedContent.length > 0 ? (
                        reportedContent.map((report: any) => (
                          <TableRow key={report.id} data-testid={`report-row-${report.id}`}>
                            <TableCell>{report.contentTitle || 'Content'}</TableCell>
                            <TableCell>{report.reason}</TableCell>
                            <TableCell>{report.reporterUsername}</TableCell>
                            <TableCell>
                              <Badge>{report.reportCount || 1}</Badge>
                            </TableCell>
                            <TableCell>
                              {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  data-testid={`button-view-report-${report.id}`}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteMutation.mutate(report.contentId)}
                                  data-testid={`button-delete-reported-${report.id}`}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No reported content
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
