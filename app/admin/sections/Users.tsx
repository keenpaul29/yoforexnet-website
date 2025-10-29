"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Ban, UserCheck, Coins } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  status: 'active' | 'suspended' | 'banned';
  coinBalance: number;
  createdAt: string;
  reputation: number;
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const { toast } = useToast();

  const { data: usersRaw, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users", { search, role: roleFilter, status: statusFilter }]
  });

  const users: AdminUser[] = Array.isArray(usersRaw) ? usersRaw : [];

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/ban`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User banned successfully" });
    },
    onError: () => {
      toast({ title: "Failed to ban user", variant: "destructive" });
    }
  });

  const adjustCoinsMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: number; amount: number; reason: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/adjust-coins`, { amount, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Coins adjusted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to adjust coins", variant: "destructive" });
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">User Management</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-user-search"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-role-filter">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Coins</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                      <TableCell data-testid={`user-name-${user.id}`}>
                        {user.username}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`user-coins-${user.id}`}>
                        {user.coinBalance}
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUser(user)}
                            data-testid={`button-view-user-${user.id}`}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => banUserMutation.mutate({ userId: user.id, reason: "Manual ban" })}
                            disabled={user.status === 'banned'}
                            data-testid={`button-ban-user-${user.id}`}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Ban
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent data-testid="dialog-user-detail">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information and actions for {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium">{selectedUser.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Coin Balance</p>
                  <p className="font-medium">{selectedUser.coinBalance}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reputation</p>
                  <p className="font-medium">{selectedUser.reputation}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => {
                    adjustCoinsMutation.mutate({ 
                      userId: selectedUser.id, 
                      amount: 100, 
                      reason: "Admin adjustment" 
                    });
                    setSelectedUser(null);
                  }}
                  data-testid="button-add-coins"
                >
                  <Coins className="h-4 w-4 mr-1" />
                  Add 100 Coins
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
