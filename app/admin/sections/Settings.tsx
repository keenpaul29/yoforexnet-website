"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [searchTemplate, setSearchTemplate] = useState("");
  const { toast } = useToast();

  const { data: generalSettings, isLoading: generalLoading } = useQuery({
    queryKey: ["/api/admin/settings/general"]
  });

  const { data: coinSettings, isLoading: coinLoading } = useQuery({
    queryKey: ["/api/admin/settings/coin-economy"]
  });

  const { data: emailTemplates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/admin/settings/email-templates", { search: searchTemplate }]
  });

  const { data: featureFlags, isLoading: flagsLoading } = useQuery({
    queryKey: ["/api/admin/settings/feature-flags"]
  });

  const { data: adminRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/admin/settings/admin-roles"]
  });

  const updateGeneralMutation = useMutation({
    mutationFn: async (settings: any) => {
      return apiRequest("PUT", "/api/admin/settings/general", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/general"] });
      toast({ title: "Settings updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update settings", variant: "destructive" });
    }
  });

  const updateCoinSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      return apiRequest("PUT", "/api/admin/settings/coin-economy", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/coin-economy"] });
      toast({ title: "Coin settings updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update coin settings", variant: "destructive" });
    }
  });

  const toggleFeatureFlagMutation = useMutation({
    mutationFn: async ({ flagId, enabled }: { flagId: number; enabled: boolean }) => {
      return apiRequest("PUT", `/api/admin/settings/feature-flags/${flagId}`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/feature-flags"] });
      toast({ title: "Feature flag updated" });
    },
    onError: () => {
      toast({ title: "Failed to update feature flag", variant: "destructive" });
    }
  });

  const grantAdminMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      return apiRequest("POST", `/api/admin/settings/admin-roles/grant`, { userId, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/admin-roles"] });
      toast({ title: "Admin role granted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to grant admin role", variant: "destructive" });
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System Settings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-settings">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
          <TabsTrigger value="coin-economy" data-testid="tab-coin-economy">Coin Economy</TabsTrigger>
          <TabsTrigger value="email-templates" data-testid="tab-email-templates">Email Templates</TabsTrigger>
          <TabsTrigger value="feature-flags" data-testid="tab-feature-flags">Feature Flags</TabsTrigger>
          <TabsTrigger value="admin-roles" data-testid="tab-admin-roles">Admin Roles</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          {generalLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <Card data-testid="card-general-settings">
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Site Name</Label>
                  <Input
                    id="site-name"
                    defaultValue={generalSettings?.siteName || 'YoForex'}
                    data-testid="input-site-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site-description">Site Description</Label>
                  <Textarea
                    id="site-description"
                    defaultValue={generalSettings?.siteDescription || ''}
                    data-testid="textarea-site-description"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable site maintenance mode</p>
                  </div>
                  <Switch
                    id="maintenance-mode"
                    defaultChecked={generalSettings?.maintenanceMode || false}
                    data-testid="switch-maintenance-mode"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="registration-enabled">Registration Enabled</Label>
                    <p className="text-sm text-muted-foreground">Allow new user registrations</p>
                  </div>
                  <Switch
                    id="registration-enabled"
                    defaultChecked={generalSettings?.registrationEnabled !== false}
                    data-testid="switch-registration-enabled"
                  />
                </div>

                <Button
                  onClick={() => updateGeneralMutation.mutate(generalSettings)}
                  disabled={updateGeneralMutation.isPending}
                  data-testid="button-save-general"
                >
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Coin Economy Tab */}
        <TabsContent value="coin-economy" className="space-y-4">
          {coinLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <>
              <Card data-testid="card-exchange-rate">
                <CardHeader>
                  <CardTitle>Exchange Rate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="usd-to-coins">USD to Coins Rate</Label>
                    <Input
                      id="usd-to-coins"
                      type="number"
                      defaultValue={coinSettings?.usdToCoinsRate || 100}
                      data-testid="input-usd-to-coins"
                    />
                    <p className="text-sm text-muted-foreground">1 USD = X coins</p>
                  </div>
                  <Button data-testid="button-save-exchange-rate">Save Exchange Rate</Button>
                </CardContent>
              </Card>

              <Card data-testid="card-recharge-packages">
                <CardHeader>
                  <CardTitle>Recharge Packages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Package</TableHead>
                          <TableHead>Coins</TableHead>
                          <TableHead>Price (USD)</TableHead>
                          <TableHead>Bonus</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {coinSettings?.packages && coinSettings.packages.length > 0 ? (
                          coinSettings.packages.map((pkg: any) => (
                            <TableRow key={pkg.id} data-testid={`package-${pkg.id}`}>
                              <TableCell>{pkg.name}</TableCell>
                              <TableCell>{pkg.coins}</TableCell>
                              <TableCell>${pkg.price}</TableCell>
                              <TableCell>{pkg.bonus || 0}%</TableCell>
                              <TableCell>
                                <Button size="sm" variant="outline" data-testid={`button-edit-package-${pkg.id}`}>
                                  Edit
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No packages configured
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-withdrawal-settings">
                <CardHeader>
                  <CardTitle>Withdrawal Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-withdrawal">Minimum Withdrawal Amount</Label>
                    <Input
                      id="min-withdrawal"
                      type="number"
                      defaultValue={coinSettings?.minWithdrawal || 1000}
                      data-testid="input-min-withdrawal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="withdrawal-fee">Withdrawal Fee (%)</Label>
                    <Input
                      id="withdrawal-fee"
                      type="number"
                      defaultValue={coinSettings?.withdrawalFee || 5}
                      data-testid="input-withdrawal-fee"
                    />
                  </div>
                  <Button data-testid="button-save-withdrawal">Save Withdrawal Settings</Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="email-templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search templates..."
                value={searchTemplate}
                onChange={(e) => setSearchTemplate(e.target.value)}
                data-testid="input-search-templates"
              />
            </CardContent>
          </Card>

          {templatesLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <Card data-testid="card-email-templates">
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailTemplates && emailTemplates.length > 0 ? (
                        emailTemplates.map((template: any) => (
                          <TableRow key={template.id} data-testid={`template-${template.id}`}>
                            <TableCell>{template.name}</TableCell>
                            <TableCell>{template.subject}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{template.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" data-testid={`button-edit-template-${template.id}`}>
                                  Edit
                                </Button>
                                <Button size="sm" variant="outline" data-testid={`button-preview-template-${template.id}`}>
                                  Preview
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No templates found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Feature Flags Tab */}
        <TabsContent value="feature-flags" className="space-y-4">
          {flagsLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <Card data-testid="card-feature-flags">
              <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Feature</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Enabled</TableHead>
                        <TableHead>Rollout %</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {featureFlags && featureFlags.length > 0 ? (
                        featureFlags.map((flag: any) => (
                          <TableRow key={flag.id} data-testid={`flag-${flag.id}`}>
                            <TableCell>{flag.name}</TableCell>
                            <TableCell>{flag.description}</TableCell>
                            <TableCell>
                              <Switch
                                checked={flag.enabled}
                                onCheckedChange={(checked) =>
                                  toggleFeatureFlagMutation.mutate({ flagId: flag.id, enabled: checked })
                                }
                                data-testid={`switch-flag-${flag.id}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="w-24">
                                <Slider
                                  defaultValue={[flag.rolloutPercentage || 100]}
                                  max={100}
                                  step={1}
                                  data-testid={`slider-rollout-${flag.id}`}
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" data-testid={`button-configure-flag-${flag.id}`}>
                                Configure
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No feature flags configured
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Admin Roles Tab */}
        <TabsContent value="admin-roles" className="space-y-4">
          {rolesLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <Card data-testid="card-admin-roles">
              <CardHeader>
                <CardTitle>Admin Roles & Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminRoles && adminRoles.length > 0 ? (
                        adminRoles.map((admin: any) => (
                          <TableRow key={admin.id} data-testid={`admin-${admin.id}`}>
                            <TableCell>{admin.username}</TableCell>
                            <TableCell>{admin.email}</TableCell>
                            <TableCell>
                              <Badge>{admin.role}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  data-testid={`button-edit-permissions-${admin.id}`}
                                >
                                  Edit Permissions
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  data-testid={`button-revoke-admin-${admin.id}`}
                                >
                                  Revoke
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No admins found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
