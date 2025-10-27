"use client";

import { useState } from "react";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  BarChart,
  Coins,
  Target,
  Bell,
  UserCog,
  Megaphone,
} from "lucide-react";

// Import all tab components
import { OverviewTab } from "./components/tabs/OverviewTab";
import { SalesTab } from "./components/tabs/SalesTab";
import { ReferralsTab } from "./components/tabs/ReferralsTab";
import { AnalyticsTab } from "./components/tabs/AnalyticsTab";
import { EarningsTab } from "./components/tabs/EarningsTab";
import { GoalsTab } from "./components/tabs/GoalsTab";
import { NotificationsTab } from "./components/tabs/NotificationsTab";
import { CRMTab } from "./components/tabs/CRMTab";
import { MarketingTab } from "./components/tabs/MarketingTab";

export default function DashboardClient() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Manage your business, track performance, and grow your revenue
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap gap-2 h-auto bg-muted/50 p-2" data-testid="tabs-dashboard-navigation">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2"
              data-testid="tab-overview"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="sales" 
              className="flex items-center gap-2"
              data-testid="tab-sales"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Sales</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="referrals" 
              className="flex items-center gap-2"
              data-testid="tab-referrals"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Referrals</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-2"
              data-testid="tab-analytics"
            >
              <BarChart className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="earnings" 
              className="flex items-center gap-2"
              data-testid="tab-earnings"
            >
              <Coins className="w-4 h-4" />
              <span className="hidden sm:inline">Earnings</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="goals" 
              className="flex items-center gap-2"
              data-testid="tab-goals"
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="notifications" 
              className="flex items-center gap-2"
              data-testid="tab-notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="crm" 
              className="flex items-center gap-2"
              data-testid="tab-crm"
            >
              <UserCog className="w-4 h-4" />
              <span className="hidden sm:inline">CRM</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="marketing" 
              className="flex items-center gap-2"
              data-testid="tab-marketing"
            >
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">Marketing</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" data-testid="content-overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="sales" data-testid="content-sales">
            <SalesTab />
          </TabsContent>

          <TabsContent value="referrals" data-testid="content-referrals">
            <ReferralsTab />
          </TabsContent>

          <TabsContent value="analytics" data-testid="content-analytics">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="earnings" data-testid="content-earnings">
            <EarningsTab />
          </TabsContent>

          <TabsContent value="goals" data-testid="content-goals">
            <GoalsTab />
          </TabsContent>

          <TabsContent value="notifications" data-testid="content-notifications">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="crm" data-testid="content-crm">
            <CRMTab />
          </TabsContent>

          <TabsContent value="marketing" data-testid="content-marketing">
            <MarketingTab />
          </TabsContent>
        </Tabs>
      </main>

      <EnhancedFooter />
    </div>
  );
}
